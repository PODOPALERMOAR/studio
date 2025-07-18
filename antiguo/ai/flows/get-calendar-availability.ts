
'use server';
/**
 * @fileOverview Reads availability from Google Calendars.
 * Looks for events with the title "Ocupar" (case-insensitive and trim-safe)
 * to determine available slots. Can fetch for a specific podologist or all.
 *
 * - getCalendarAvailability - A function that returns available slots.
 * - GetCalendarAvailabilityInput - Input for the flow.
 * - GetCalendarAvailabilityOutput - The return type, an object containing an array of events.
 * - CalendarEventType - The type for individual slot/event data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { podologists, type PodologistProfile } from '@/config/podologists';

const GetCalendarAvailabilityInputSchema = z.object({
  podologistKey: z.string().optional().describe("The key of a specific podologist to fetch availability for. If omitted or 'any', fetches for all."),
}).optional();
export type GetCalendarAvailabilityInput = z.infer<typeof GetCalendarAvailabilityInputSchema>;

const CalendarEventSchema = z.object({
  title: z.string().describe("The title of the calendar event."),
  dateISO: z.string().datetime({ message: "Each date must be a valid ISO 8601 string." })
    .describe("The ISO date-time string for the event start (in UTC)."),
  eventId: z.string().optional().describe("The Google Calendar event ID."),
  podologistKey: z.string().describe("The key of the podologist for this slot."),
  podologistName: z.string().describe("The name of the podologist for this slot."),
  podologistCalendarId: z.string().describe("The Google Calendar ID of the podologist for this slot."),
});
export type CalendarEventType = z.infer<typeof CalendarEventSchema>;

const GetCalendarAvailabilityOutputSchema = z.object({
  availableSlots: z.array(CalendarEventSchema).describe("An array of available slots (events titled 'Ocupar')."),
  error: z.string().optional().describe("User-friendly error message if fetching availability failed."),
  debugInfo: z.string().optional().describe("Debugging information about the calendar fetch."),
});
export type GetCalendarAvailabilityOutput = z.infer<typeof GetCalendarAvailabilityOutputSchema>;

export async function getCalendarAvailability(input?: GetCalendarAvailabilityInput): Promise<GetCalendarAvailabilityOutput> {
  return getCalendarAvailabilityFlow(input || {});
}

const getCalendarAvailabilityFlow = ai.defineFlow(
  {
    name: 'getCalendarAvailabilityFlow',
    inputSchema: GetCalendarAvailabilityInputSchema,
    outputSchema: GetCalendarAvailabilityOutputSchema,
  },
  async (input) => {
    let debugInfo = `Starting getCalendarAvailabilityFlow. Input: ${JSON.stringify(input)}\n`;
    const allFetchedSlots: CalendarEventType[] = [];

    let calendarsToQuery: PodologistProfile[];

    if (input?.podologistKey && input.podologistKey !== 'any') {
      const targetPodologist = podologists.find(p => p.key.trim().toLowerCase() === input.podologistKey!.trim().toLowerCase());
      if (targetPodologist) {
        if (targetPodologist.calendarId) {
          calendarsToQuery = [targetPodologist];
          debugInfo += `Specific podologist requested: ${targetPodologist.name}. Calendar ID found.\n`;
        } else {
          calendarsToQuery = []; 
          debugInfo += `Specific podologist requested: ${targetPodologist.name}, but their Calendar ID is MISSING. Cannot fetch for this podologist.\n`;
        }
      } else {
        debugInfo += `Warning: Requested podologist key "${input.podologistKey}" not found in config. No calendars will be queried based on this key.\n`;
        calendarsToQuery = [];
      }
    } else {
      debugInfo += "No specific podologist key, or 'any' requested. Considering all configured podologists with a calendar ID.\n";
      calendarsToQuery = podologists.filter(p => {
        if (!p.calendarId) {
          debugInfo += `Skipping podologist ${p.name} (Key: ${p.key}) in 'any' search due to MISSING calendarId.\n`;
          return false;
        }
        return true;
      });
    }

    if (calendarsToQuery.length === 0) {
      let errorMsg = "No hay calendarios configurados correctamente para buscar disponibilidad.";
      if (input?.podologistKey && input.podologistKey !== 'any') {
        const targetPodologistInfo = podologists.find(p => p.key.trim().toLowerCase() === input.podologistKey!.trim().toLowerCase());
        if (targetPodologistInfo) {
             errorMsg = `El podólogo/a ${targetPodologistInfo.name} no tiene un ID de calendario configurado. No podemos buscar sus turnos.`;
        } else {
             errorMsg = `El podólogo/a con clave "${input.podologistKey}" no fue encontrado en la configuración.`;
        }
      }
      debugInfo += "No valid calendars to fetch from after filtering based on input and configuration.\n";
      return { availableSlots: [], error: errorMsg, debugInfo };
    }

    debugInfo += `Will attempt to fetch from ${calendarsToQuery.length} calendar(s): ${calendarsToQuery.map(p=>p.name).join(', ')}.\n`;

    try {
      // Use Application Default Credentials, which is the recommended way in Cloud environments.
      // It will automatically use the service account associated with the environment.
      const auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
      });
      const authClient = await auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: authClient });
      debugInfo += "Successfully obtained auth client and calendar instance for Google Calendar API via ADC.\n";

      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(new Date().setDate(now.getDate() + 90)).toISOString(); // Look 90 days ahead

      for (const podologistProfile of calendarsToQuery) {
        debugInfo += `Fetching events for ${podologistProfile.name} (Calendar ID: ${podologistProfile.calendarId}) from ${timeMin} to ${timeMax}.\n`;
        
        try {
          const response = await calendar.events.list({
            calendarId: podologistProfile.calendarId,
            timeMin: timeMin,
            timeMax: timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          });
          debugInfo += `Google Calendar API response status for ${podologistProfile.name}: ${response.status}.\n`;

          const events = response.data.items;
          if (events && events.length > 0) {
            debugInfo += `Found ${events.length} total events for ${podologistProfile.name}. Inspecting events before filtering:\n`;
            events.forEach(event => {
                const title = event.summary || "No Title";
                const start = event.start?.dateTime || event.start?.date || "No Start Date";
                const eventId = event.id || "No Event ID";
                debugInfo += `  - Raw Event for ${podologistProfile.name}: ID: ${eventId}, Title: "${title}", Start: ${start}\n`;
            });
            
            const processedSlotsForCurrentPodologist: CalendarEventType[] = events
              .filter(event => {
                  const originalTitle = event.summary || "";
                  const trimmedTitle = originalTitle.trim().toLowerCase();
                  const titleMatch = trimmedTitle === 'ocupar';
                  const hasStartDate = !!(event.start?.dateTime || event.start?.date);
                  if (!titleMatch && trimmedTitle.includes('ocupar')) { // Log near matches for debugging typos
                      debugInfo += `    Possible typo for ${podologistProfile.name}? Event title: "${originalTitle}" (processed: "${trimmedTitle}") was not an exact 'ocupar' match.\n`;
                  }
                  return titleMatch && hasStartDate;
              })
              .map(event => {
                let eventStartIso: string;
                if (event.start?.dateTime) {
                  eventStartIso = new Date(event.start.dateTime).toISOString();
                } else { 
                  eventStartIso = new Date(event.start!.date! + "T00:00:00Z").toISOString();
                }
                
                return {
                  title: event.summary!, 
                  dateISO: eventStartIso,
                  eventId: event.id || undefined,
                  podologistKey: podologistProfile.key,
                  podologistName: podologistProfile.name,
                  podologistCalendarId: podologistProfile.calendarId,
                };
              });
            allFetchedSlots.push(...processedSlotsForCurrentPodologist);
            debugInfo += `Added ${processedSlotsForCurrentPodologist.length} 'Ocupar' slots for ${podologistProfile.name}.\n`;
          } else {
            debugInfo += `No events found for ${podologistProfile.name} in the period.\n`;
          }
        } catch (fetchErr: any) {
           debugInfo += `Error fetching/processing calendar for ${podologistProfile.name} (ID: ${podologistProfile.calendarId}): ${fetchErr.message || fetchErr.toString()}. This podologist's slots might be missing.\n`;
           // Continue to next podologist, don't fail the whole flow for one calendar error if fetching multiple
        }
      }

      allFetchedSlots.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
      debugInfo += `Total 'Ocupar' slots found across all queried calendars: ${allFetchedSlots.length}.\n`;

      return { availableSlots: allFetchedSlots, debugInfo };

    } catch (err: any) {
      console.error('Error en getCalendarAvailabilityFlow (outer try-catch):', err);
      // User-friendly error message for the client
      const userFriendlyErrorMessage = "Lo siento, no pudimos consultar la disponibilidad de la agenda en este momento. Por favor, intenta de nuevo más tarde o contacta a Cecilia.";
      
      debugInfo += `Outer error: ${err.message || err.toString()}\n`;
      if ((err as any).response?.data?.error?.message) {
        debugInfo += `Google API Error details: ${(err as any).response.data.error.message}\n`;
      }
      return { availableSlots: [], error: userFriendlyErrorMessage, debugInfo };
    }
  }
);
    
