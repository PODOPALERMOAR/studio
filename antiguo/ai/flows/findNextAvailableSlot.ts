
'use server';
/**
 * @fileOverview Finds the next available appointment slot by reading "Ocupar"
 * events from Google Calendar (via getCalendarAvailability flow).
 * Can be filtered by a specific podologist or search all.
 * Allows advancing the search if a previous slot was rejected.
 * Displays times in Buenos Aires timezone (UTC-3).
 *
 * - findNextAvailableSlot - A function that returns an available slot and options.
 * - FindNextAvailableSlotInput - Input for the flow, can include previously offered slot and podologistKey.
 * - FindNextAvailableSlotOutput - The return type for the findNextAvailableSlot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCalendarAvailability, type CalendarEventType } from './get-calendar-availability';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { podologists } from '@/config/podologists';

const FindNextAvailableSlotInputSchema = z.object({
  previousSlotTimestamp: z.string().datetime().optional().describe("An ISO string timestamp (UTC) of the previously suggested slot, if any, to search after this date."),
  podologistKey: z.string().optional().describe("The key of the podologist to search for. If 'any' or undefined, searches all."),
});
export type FindNextAvailableSlotInput = z.infer<typeof FindNextAvailableSlotInputSchema>;


const OptionSchema = z.object({
  label: z.string().describe("The text displayed on the button for the user."),
  action: z.string().describe("An identifier for the action this option triggers."),
  metadata: z.record(z.string(), z.any()).optional().describe("Any additional data associated with the option, e.g., slotId for confirmation"),
});

const FindNextAvailableSlotOutputSchema = z.object({
  message: z.string().describe("The message from the AI assistant regarding the found slot."),
  slotFound: z.boolean().describe("Indicates if a slot was found."),
  suggestedSlotTimestamp: z.string().datetime().optional().describe("An ISO string timestamp (UTC) of the suggested slot, if found."),
  options: z.array(OptionSchema).optional().describe("An array of choices presented to the user as buttons."),
  debugInfo: z.string().optional().describe("Debugging information about the calendar fetch and slot selection."),
  eventId: z.string().optional().describe("The Google Calendar event ID of the suggested slot, if found."),
  podologistInfo: z.object({
    key: z.string(),
    name: z.string(),
    calendarId: z.string(),
  }).optional().describe("Information about the podologist for the suggested slot."),
});
export type FindNextAvailableSlotOutput = z.infer<typeof FindNextAvailableSlotOutputSchema>;

export async function findNextAvailableSlot(input?: FindNextAvailableSlotInput): Promise<FindNextAvailableSlotOutput> {
  return findNextAvailableSlotFlow(input || {});
}

const findNextAvailableSlotFlow = ai.defineFlow(
  {
    name: 'findNextAvailableSlotFlow',
    inputSchema: FindNextAvailableSlotInputSchema,
    outputSchema: FindNextAvailableSlotOutputSchema,
  },
  async (input) => {
    let debugInfo = `Starting findNextAvailableSlotFlow. Input: ${JSON.stringify(input)}\n`;
    
    const effectivePodologistKey = input.podologistKey === 'any' ? undefined : input.podologistKey;
    let searchingForPodologistName = "cualquiera disponible";
    if (effectivePodologistKey) {
        const profile = podologists.find(p => p.key === effectivePodologistKey);
        if (profile) searchingForPodologistName = profile.name;
    }
    debugInfo += `Effective podologistKey for search: ${effectivePodologistKey || 'all'}\n`;

    const availabilityResult = await getCalendarAvailability({ podologistKey: effectivePodologistKey }); 

    if (availabilityResult.error) {
      debugInfo += `Calendar fetch error detail: ${availabilityResult.error}\n`;
      debugInfo += `getCalendarAvailability debug info: ${availabilityResult.debugInfo || 'N/A'}\n`;
      console.error(debugInfo);
      return {
        message: `Lo siento, tuve un problema al consultar la agenda para ${searchingForPodologistName}. Por favor, intenta más tarde o contacta a Cecilia.`,
        slotFound: false,
        options: [{ label: "Volver al menú principal", action: "goHome" }],
        debugInfo,
      };
    }
    
    debugInfo += `getCalendarAvailability debug info: ${availabilityResult.debugInfo || 'N/A'}\n`;

    if (!availabilityResult.availableSlots || availabilityResult.availableSlots.length === 0) {
       debugInfo += `No 'Ocupar' slots were returned from getCalendarAvailability for ${searchingForPodologistName}.\n`;
       console.log(debugInfo);
       let noSlotsMessage = `En este momento no encuentro turnos disponibles para ${searchingForPodologistName}.`;
       if (!effectivePodologistKey) { // Searching for 'any'
           noSlotsMessage += " Te sugiero consultar nuevamente más tarde o, si prefieres, puedes contactar directamente a Cecilia por WhatsApp al 1167437969 para coordinar.";
       }

      return {
        message: noSlotsMessage,
        slotFound: false,
        options: [
          { label: "Buscar por mis preferencias", action: "findByPreference", metadata: {selectedPodologistKey: effectivePodologistKey || 'any'} },
          { label: "Volver al menú principal", action: "goHome" },
        ],
        debugInfo,
      };
    }
    
    const allAvailableOcuparSlots: CalendarEventType[] = availabilityResult.availableSlots;
    debugInfo += `Received ${allAvailableOcuparSlots.length} 'Ocupar' slots for the specified criteria.\n`;

    let searchFromDate: Date;
    const now = new Date(); 

    if (input.previousSlotTimestamp) {
      const prevSlotDateUtc = new Date(input.previousSlotTimestamp);
      searchFromDate = new Date(prevSlotDateUtc.getTime() + 1); 
      debugInfo += `Searching for slots after previous suggestion: ${searchFromDate.toISOString()}\n`;
    } else {
      searchFromDate = now;
      debugInfo += `Searching for slots from now: ${searchFromDate.toISOString()}\n`;
    }
    
    const sortedAndFilteredSlots = allAvailableOcuparSlots
      .map(slot => ({ ...slot, dateObj: new Date(slot.dateISO) })) 
      .filter(slot => slot.dateObj >= searchFromDate)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()); 

    debugInfo += `Found ${sortedAndFilteredSlots.length} 'Ocupar' slots after filtering by searchFromDate.\n`;
    
    if (sortedAndFilteredSlots.length > 0) {
      const suggestedSlot = sortedAndFilteredSlots[0];
      const finalSuggestedDateUtc = suggestedSlot.dateObj; 

      const TIMEZONE_BA = 'America/Argentina/Buenos_Aires';
      const formattedDateTime = formatInTimeZone(finalSuggestedDateUtc, TIMEZONE_BA, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", { locale: es });
      
      const message = `¡Perfecto! El próximo turno disponible que encontré es el ${formattedDateTime} con ${suggestedSlot.podologistName}. ¿Te gustaría reservarlo?`;
      debugInfo += `Offering slot: Original ISO: ${suggestedSlot.dateISO}, UTC Date Obj: ${finalSuggestedDateUtc.toISOString()}, Display: ${formattedDateTime}. Event ID: ${suggestedSlot.eventId} with ${suggestedSlot.podologistName}\n`;
      
      return {
        message: message,
        slotFound: true,
        suggestedSlotTimestamp: finalSuggestedDateUtc.toISOString(), 
        eventId: suggestedSlot.eventId,
        podologistInfo: {
            key: suggestedSlot.podologistKey,
            name: suggestedSlot.podologistName,
            calendarId: suggestedSlot.podologistCalendarId,
        },
        options: [
          { 
            label: "Sí, reservar este turno", 
            action: "confirmSlot", 
            metadata: { 
              slotId: suggestedSlot.eventId, 
              slotTimestamp: finalSuggestedDateUtc.toISOString(),
              podologistCalendarId: suggestedSlot.podologistCalendarId,
              podologistKey: suggestedSlot.podologistKey,
              podologistName: suggestedSlot.podologistName,
            } 
          },
          { 
            label: "Ver siguiente turno disponible (cualquiera)", 
            action: "findNext", 
            metadata: { 
              podologistKey: 'any', 
              previousSlotTimestamp: finalSuggestedDateUtc.toISOString() 
            } 
          },
          {
            label: "Buscar por mis preferencias",
            action: "findByPreference",
            metadata: {
              selectedPodologistKey: 'any' // Ensures preferences start with 'any' podologist
            }
          },
          { 
            label: "Volver al menú principal", 
            action: "goHome" 
          }
        ],
        debugInfo,
      };
    } else {
      debugInfo += `No suitable 'Ocupar' slot found after filtering for ${searchingForPodologistName} (previousSlot: ${input.previousSlotTimestamp}).\n`;
      let noMoreSlotsMessage: string;
      const options: NonNullable<FindNextAvailableSlotOutput['options']> = [];

      if (input.previousSlotTimestamp) { 
        noMoreSlotsMessage = `Lo siento, no encontré más turnos disponibles para ${searchingForPodologistName} después de la fecha que te indiqué.`;
      } else { 
        noMoreSlotsMessage = `Lo siento, parece que no hay turnos disponibles para ${searchingForPodologistName} que coincidan con tu búsqueda en este momento.`;
      }
      
      options.push({
          label: "Buscar por mis preferencias", 
          action: "findByPreference",
          metadata: { selectedPodologistKey: effectivePodologistKey || 'any' } // Start preference search with current or 'any'
      });
      options.push({ label: "Volver al menú principal", action: "goHome" });
      
      console.log(debugInfo);
      return {
        message: noMoreSlotsMessage,
        slotFound: false,
        options: options,
        debugInfo,
      };
    }
  }
);
    
