
'use server';
/**
 * @fileOverview Builds and enriches a patient database from Google Calendar events.
 * This is the core engine for the Patient Intelligence Panel (PIP).
 *
 * It scans all podiatrist calendars, extracts patient information from events
 * strictly formatted as "N: [Name] T: [Phone]", groups all events for the
 * same patient, and calculates key metrics. It also calculates strategic
 * business KPIs like retention, churn, and average return time.
 *
 * - getPatientAnalytics - The main function to perform the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { podologists } from '@/config/podologists';
import { 
  isValid, 
  parseISO, 
  subYears,
  isAfter,
  isBefore,
  differenceInMonths,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';


// --- Schemas ---

const PatientProfileSchema = z.object({
  id: z.string().describe("A unique composite ID for the patient, generated from their cleaned name and phone number (e.g., 'juan perez|+54911...')."),
  displayName: z.string().describe("The cleaned, standardized name of the patient."),
  primaryPhoneNumber: z.string().nullable().describe("The primary phone number associated with the patient, prefixed with '+'."),
  totalAppointments: z.number().int().describe("Total number of past appointments found for this patient in the last 12 months."),
  lastAppointmentDate: z.string().datetime().nullable().describe("The ISO date of the patient's most recent past appointment."),
  nextAppointmentDate: z.string().datetime().nullable().describe("The ISO date of the patient's soonest future appointment."),
  firstAppointmentDate: z.string().datetime().nullable().describe("The ISO date of the patient's very first appointment found in the scan."),
  status: z.enum(['Activo', 'Frecuente', 'Nuevo', 'En Riesgo', 'Inactivo']).describe("The calculated status of the patient based on their visit history."),
});
export type PatientProfile = z.infer<typeof PatientProfileSchema>;

const KpiSchema = z.object({
    totalActivePatients: z.number().int(),
    newPatientsThisMonth: z.number().int(),
    atRiskPatients: z.number().int(),
    secondAppointmentRetentionRate: z.number(), // Percentage
    visitFrequencyPerYear: z.number(),
    quarterlyChurnRate: z.number(), // Percentage
    averageReturnTimeDays: z.number().int(),
});

const MonthlyChartDataSchema = z.object({
    name: z.string().describe("Month name, e.g., 'Jun'"),
    year: z.string().describe("Full year, e.g., '2025'"),
    newPatients: z.number().int().describe("Nuevos"),
    recurringPatients: z.number().int().describe("Recurrentes"),
});
export type MonthlyChartData = z.infer<typeof MonthlyChartDataSchema>;


const PatientAnalyticsDataSchema = z.object({
  patients: z.array(PatientProfileSchema),
  kpis: KpiSchema,
  monthlyChartData: z.array(MonthlyChartDataSchema),
  error: z.string().optional(),
  debugInfo: z.string().optional(),
});
export type PatientAnalyticsData = z.infer<typeof PatientAnalyticsDataSchema>;


// --- Helper Functions ---

/**
 * Normalizes an Argentinian phone number to a consistent E.164 format.
 */
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

/**
 * Strictly parses a calendar event title to extract a name and phone number
 * ONLY if it matches the "N: [Name] T: [Phone]" format.
 */
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

/**
 * Cleans a name for display purposes (capitalization, spacing).
 */
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

/**
 * Removes diacritics (accents) from a string for canonical comparison.
 */
const removeDiacritics = (str: string): string => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const determinePatientStatus = (
    pastAppointments: { date: Date }[],
    now: Date
): PatientProfile['status'] => {
    const totalAppointments = pastAppointments.length;
    if (totalAppointments === 0) return 'Nuevo';
    
    pastAppointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    const lastAppointmentDate = pastAppointments[0].date;
    const monthsSinceLastVisit = differenceInMonths(now, lastAppointmentDate);

    if (monthsSinceLastVisit >= 9) return 'Inactivo';
    if (monthsSinceLastVisit >= 4) return 'En Riesgo';

    if (totalAppointments === 1) return 'Nuevo';
    
    const oneYearAgo = subYears(now, 1);
    const appointmentsLastYear = pastAppointments.filter(appt => isAfter(appt.date, oneYearAgo)).length;
    if (appointmentsLastYear >= 5) {
        return 'Frecuente';
    }
    return 'Activo';
};


// --- Main Flow ---

export async function getPatientAnalytics(): Promise<PatientAnalyticsData> {
  return getPatientAnalyticsFlow({});
}

const getPatientAnalyticsFlow = ai.defineFlow(
  {
    name: 'getPatientAnalyticsFlow',
    inputSchema: z.object({}),
    outputSchema: PatientAnalyticsDataSchema,
  },
  async () => {
    let debugInfo = "--- START getPatientAnalyticsFlow (High-Fidelity Parser v4) ---\n";
    
    const defaultReturn = {
        patients: [],
        kpis: { totalActivePatients: 0, newPatientsThisMonth: 0, atRiskPatients: 0, secondAppointmentRetentionRate: 0, visitFrequencyPerYear: 0, quarterlyChurnRate: 0, averageReturnTimeDays: 0 },
        monthlyChartData: [],
        debugInfo: "Default return due to early exit."
    };

    let calendar;
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      });
      const authClient = await auth.getClient();
      calendar = google.calendar({ version: 'v3', auth: authClient });
    } catch (authError: any) {
      debugInfo += `CRITICAL: Error initializing Google Calendar auth: ${authError.message}\n`;
      return { ...defaultReturn, error: "Error de autenticación con Google Calendar.", debugInfo };
    }
    
    const now = new Date();
    const timeMin = subYears(now, 1).toISOString();
    const timeMax = now.toISOString();

    // 1. Fetch all events and strictly filter them
    const allValidAppointments: {
        rawName: string;
        rawPhone: string;
        date: Date;
        isFuture: boolean;
        podologistName: string;
    }[] = [];

    const calendarsToQuery = podologists.filter(p => p.calendarId && p.calendarId.trim() !== '');
    debugInfo += `Querying ${calendarsToQuery.length} calendars from ${timeMin} to ${timeMax}...\n`;

    for (const podo of calendarsToQuery) {
      try {
        const response = await calendar.events.list({
          calendarId: podo.calendarId,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 2500,
        });

        const events = response.data.items;
        if (events && events.length > 0) {
          for (const event of events) {
            const eventTitle = event.summary || "";
            const eventDateStr = event.start?.dateTime || event.start?.date;

            const patientInfo = extractPatientInfo(eventTitle);

            if (!patientInfo || !eventDateStr) {
                if (!patientInfo && eventTitle.toLowerCase().includes('n:') && eventTitle.toLowerCase().includes('t:')) {
                    debugInfo += `  - Skipped event (format mismatch): "${eventTitle}"\n`;
                }
                continue;
            }
            
            const eventDate = parseISO(eventDateStr);
            if (!isValid(eventDate)) continue;

            allValidAppointments.push({
                rawName: patientInfo.name,
                rawPhone: patientInfo.phone,
                date: eventDate,
                isFuture: isAfter(eventDate, now),
                podologistName: podo.name,
            });
          }
        }
      } catch (fetchErr: any) {
        debugInfo += `  WARNING: Could not fetch events for ${podo.name}: ${fetchErr.message}\n`;
      }
    }
    
    debugInfo += `  - Processed ${allValidAppointments.length} total valid events after strict filtering.\n`;

    if (allValidAppointments.length === 0) {
        debugInfo += "No valid appointments matching 'N: ... T: ...' format found.\n";
        return { ...defaultReturn, debugInfo };
    }

    // 2. Group appointments by a canonical composite key (accent-insensitive name | normalizedPhone)
    const patientDataGrouped = new Map<string, {
        appointments: { rawName: string; date: Date; podologistName: string; isFuture: boolean }[];
    }>();

    for (const appt of allValidAppointments) {
        const cleanedName = simpleCleanName(appt.rawName);
        const normalizedPhone = normalizeArgentinianPhone(appt.rawPhone);
        const canonicalKey = `${removeDiacritics(cleanedName).toLowerCase()}|${normalizedPhone}`;

        let patientGroup = patientDataGrouped.get(canonicalKey);
        if (!patientGroup) {
            patientGroup = { appointments: [] };
            patientDataGrouped.set(canonicalKey, patientGroup);
        }
        patientGroup.appointments.push({ rawName: appt.rawName, date: appt.date, podologistName: appt.podologistName, isFuture: appt.isFuture });
    }
    
    debugInfo += `--- Finalized ${patientDataGrouped.size} unique patient profiles after grouping ---\n`;
    
    // 3. Build final profiles and calculate KPIs
    const finalPatientList: PatientProfile[] = [];
    const monthlyChartDataMap = new Map<string, { newPatients: number; recurringPatients: number }>();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    for (const [key, data] of patientDataGrouped.entries()) {
        const allAppointments = data.appointments.sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort descending
        const pastAppointments = allAppointments.filter(a => !a.isFuture);
        const futureAppointments = allAppointments.filter(a => a.isFuture);
        
        if (allAppointments.length === 0) continue;

        // Use name from most recent appointment for display
        const displayName = simpleCleanName(allAppointments[0].rawName);
        const primaryPhoneNumber = key.split('|')[1] || null;
        
        const firstAppointmentDate = allAppointments.length > 0 ? allAppointments[allAppointments.length - 1].date : null;
        const status = determinePatientStatus(pastAppointments, now);

        const enrichedProfile: PatientProfile = {
            id: key,
            displayName: displayName,
            primaryPhoneNumber: primaryPhoneNumber,
            totalAppointments: pastAppointments.length,
            lastAppointmentDate: pastAppointments.length > 0 ? pastAppointments[0].date.toISOString() : null,
            nextAppointmentDate: futureAppointments.length > 0 ? futureAppointments[futureAppointments.length - 1].date.toISOString() : null,
            firstAppointmentDate: firstAppointmentDate ? firstAppointmentDate.toISOString() : null,
            status: status,
        };
        finalPatientList.push(enrichedProfile);

        pastAppointments.forEach(appt => {
            const apptDate = appt.date;
            if (isAfter(apptDate, sixMonthsAgo)) {
                const monthKey = format(apptDate, 'yyyy-MM');
                if (!monthlyChartDataMap.has(monthKey)) {
                    monthlyChartDataMap.set(monthKey, { newPatients: 0, recurringPatients: 0 });
                }
                const isFirstAppointmentForPatient = firstAppointmentDate ? apptDate.getTime() === firstAppointmentDate.getTime() : false;
                if (isFirstAppointmentForPatient) {
                    monthlyChartDataMap.get(monthKey)!.newPatients++;
                } else {
                    monthlyChartDataMap.get(monthKey)!.recurringPatients++;
                }
            }
        });
    }
    
    finalPatientList.sort((a, b) => {
        const dateA = a.lastAppointmentDate ? parseISO(a.lastAppointmentDate).getTime() : 0;
        const dateB = b.lastAppointmentDate ? parseISO(b.lastAppointmentDate).getTime() : 0;
        return dateB - dateA;
    });

    // --- KPI Calculation ---
    const thisMonthStart = startOfMonth(now);
    const atRiskPatients = finalPatientList.filter(p => p.status === 'En Riesgo').length;

    const appointmentsInLastYear = finalPatientList.reduce((sum, p) => sum + p.totalAppointments, 0);
    const activePatientsInLastYear = finalPatientList.filter(p => p.status !== 'Inactivo').length;
    const visitFrequencyPerYear = activePatientsInLastYear > 0 ? appointmentsInLastYear / activePatientsInLastYear : 0;

    const retentionWindowStart = subDays(now, 90);
    const retentionWindowEnd = subDays(now, 60);
    const newPatientsInWindow = finalPatientList.filter(p => 
        p.firstAppointmentDate && isAfter(parseISO(p.firstAppointmentDate), retentionWindowStart) && isBefore(parseISO(p.firstAppointmentDate), retentionWindowEnd)
    );
    const retainedCount = newPatientsInWindow.filter(p => p.totalAppointments > 1).length;
    const secondAppointmentRetentionRate = newPatientsInWindow.length > 0 ? (retainedCount / newPatientsInWindow.length) * 100 : 0;

    const quarterAgo = subDays(now, 90);
    const patientsAtStartOfQuarter = finalPatientList.filter(p => {
        const lastAppt = p.lastAppointmentDate ? parseISO(p.lastAppointmentDate) : null;
        return lastAppt && isAfter(lastAppt, subMonths(quarterAgo, 9)); 
    });
    const newlyInactiveCount = patientsAtStartOfQuarter.filter(p => p.status === 'Inactivo').length;
    const quarterlyChurnRate = patientsAtStartOfQuarter.length > 0 ? (newlyInactiveCount / patientsAtStartOfQuarter.length) * 100 : 0;

    let totalTimeBetweenAppointments = 0;
    let numberOfIntervals = 0;
    for (const data of patientDataGrouped.values()) {
        if (data.appointments.filter(a => !a.isFuture).length > 1) {
            const pastAppointmentsSorted = data.appointments
                .filter(a => !a.isFuture)
                .sort((a, b) => a.date.getTime() - b.date.getTime());
            
            for (let i = 1; i < pastAppointmentsSorted.length; i++) {
                const timeDiff = pastAppointmentsSorted[i].date.getTime() - pastAppointmentsSorted[i - 1].date.getTime();
                totalTimeBetweenAppointments += timeDiff;
                numberOfIntervals++;
            }
        }
    }
    const averageReturnTimeDays = numberOfIntervals > 0
        ? Math.round((totalTimeBetweenAppointments / numberOfIntervals) / (1000 * 60 * 60 * 24))
        : 0;
    
    const kpis: z.infer<typeof KpiSchema> = {
        totalActivePatients: finalPatientList.filter(p => p.status !== 'Inactivo').length,
        newPatientsThisMonth: finalPatientList.filter(p => p.firstAppointmentDate && isAfter(parseISO(p.firstAppointmentDate), thisMonthStart)).length,
        atRiskPatients,
        secondAppointmentRetentionRate: parseFloat(secondAppointmentRetentionRate.toFixed(1)),
        visitFrequencyPerYear: parseFloat(visitFrequencyPerYear.toFixed(1)),
        quarterlyChurnRate: parseFloat(quarterlyChurnRate.toFixed(1)),
        averageReturnTimeDays: averageReturnTimeDays,
    };

    // --- Format Chart Data ---
    const monthlyChartData: z.infer<typeof MonthlyChartDataSchema>[] = [];
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthName = format(monthDate, 'LLL', { locale: es });
        const yearName = format(monthDate, 'yyyy');

        const data = monthlyChartDataMap.get(monthKey) || { newPatients: 0, recurringPatients: 0 };
        monthlyChartData.push({
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            year: yearName,
            newPatients: data.newPatients,
            recurringPatients: data.recurringPatients,
        });
    }

    debugInfo += `--- END getPatientAnalyticsFlow ---\n`;
    return { 
        patients: finalPatientList,
        kpis,
        monthlyChartData,
        debugInfo
    };
  }
);
