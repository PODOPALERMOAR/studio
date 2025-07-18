
'use server';
/**
 * @fileOverview Fetches the detailed appointment history (past and future)
 * for a single patient by scanning Google Calendars. It ONLY considers events
 * with the strict "N: [Name] T: [Phone]" format.
 * This is an on-demand flow called by the admin panel to lazy-load data.
 *
 * - getPatientAppointmentDetails - The main function.
 * - GetPatientAppointmentDetailsInput - Input schema.
 * - GetPatientAppointmentDetailsOutput - Output schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { podologists } from '@/config/podologists';
import { isValid, parseISO, subYears } from 'date-fns';


// --- Schemas ---

const AppointmentSchema = z.object({
  date: z.string().datetime(),
  podologistName: z.string(),
  eventTitle: z.string(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

const GetPatientAppointmentDetailsInputSchema = z.object({
  patientId: z.string().describe("The composite ID for the patient, e.g., 'displayname|+123456789'."),
});
export type GetPatientAppointmentDetailsInput = z.infer<typeof GetPatientAppointmentDetailsInputSchema>;

const GetPatientAppointmentDetailsOutputSchema = z.object({
  appointments: z.array(AppointmentSchema),
  error: z.string().optional(),
});
export type GetPatientAppointmentDetailsOutput = z.infer<typeof GetPatientAppointmentDetailsOutputSchema>;


// --- Helper Functions ---
const normalizeArgentinianPhone = (phone: string): string => {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('11') && digits.length === 10) {
        return `+549${digits}`;
    }
    if (digits.startsWith('5411') && digits.length === 12) {
        return `+549${digits.substring(2)}`;
    }
    if (digits.startsWith('549')) {
        return `+${digits}`;
    }
    if (!phone.startsWith('+')) {
        return `+${phone}`;
    }
    return phone;
};

const extractPatientInfo = (title: string): { name: string; phone: string } | null => {
    if (!title) return null;
    const strictRegex = /^N\s*:\s*(.*?)\s*T\s*:\s*(.*)$/is;
    const match = title.match(strictRegex);
    if (match && match[1] && match[2]) {
        const rawName = match[1].trim();
        const rawPhone = match[2].trim();
        if (rawName && rawPhone) {
            return { name: rawName, phone: rawPhone };
        }
    }
    return null;
};

const simpleCleanName = (name: string): string => {
    if (!name) return "";
    return name
        .replace(/^[^\p{L}\p{N}\s]+|[^\p{L}\p{N}\s]+$/gu, '')
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
        .join(' ');
};

const removeDiacritics = (str: string): string => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// --- Main Flow ---

export async function getPatientAppointmentDetails(input: GetPatientAppointmentDetailsInput): Promise<GetPatientAppointmentDetailsOutput> {
  return getPatientAppointmentDetailsFlow(input);
}

const getPatientAppointmentDetailsFlow = ai.defineFlow(
  {
    name: 'getPatientAppointmentDetailsFlow',
    inputSchema: GetPatientAppointmentDetailsInputSchema,
    outputSchema: GetPatientAppointmentDetailsOutputSchema,
  },
  async ({ patientId }) => {
    if (!patientId || !patientId.includes('|')) {
        return { appointments: [], error: "ID de paciente inválido." };
    }
    
    let calendar;
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });
      const authClient = await auth.getClient();
      calendar = google.calendar({ version: 'v3', auth: authClient });
    } catch (authError: any) {
      return { appointments: [], error: "Error de autenticación con Google Calendar." };
    }
    
    const [targetCanonicalName, targetPhone] = patientId.split('|');
    if (!targetCanonicalName || !targetPhone) {
      return { appointments: [], error: "Formato de ID de paciente inválido." };
    }

    const foundAppointments: Appointment[] = [];
    const now = new Date();
    const timeMin = subYears(now, 1).toISOString(); 
    const timeMax = now.toISOString();

    const calendarsToQuery = podologists.filter(p => p.calendarId && p.calendarId.trim() !== '');

    for (const podo of calendarsToQuery) {
      try {
        const response = await calendar.events.list({
          calendarId: podo.calendarId,
          timeMin: timeMin,
          timeMax: timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 2500,
        });

        const events = response.data.items;
        if (events && events.length > 0) {
          for (const event of events) {
            const eventTitle = event.summary || "";
            const patientInfo = extractPatientInfo(eventTitle);

            if (!patientInfo) continue;

            const cleanedEventName = simpleCleanName(patientInfo.name);
            const currentEventCanonicalName = removeDiacritics(cleanedEventName).toLowerCase();
            const normalizedPhone = normalizeArgentinianPhone(patientInfo.phone);

            if (currentEventCanonicalName === targetCanonicalName && normalizedPhone === targetPhone) {
                const eventDateStr = event.start?.dateTime || event.start?.date;
                if (!eventDateStr) continue;
                const eventDate = parseISO(eventDateStr);
                if (!isValid(eventDate)) continue;

                foundAppointments.push({
                    date: eventDate.toISOString(),
                    podologistName: podo.name,
                    eventTitle: eventTitle,
                });
            }
          }
        }
      } catch (fetchErr: any) {
        console.warn(`Could not fetch events for ${podo.name} while getting details: ${fetchErr.message}`);
      }
    }
    
    foundAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { appointments: foundAppointments };
  }
);
