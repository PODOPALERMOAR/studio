'use server';
/**
 * Obtiene disponibilidad de calendarios de Google
 * Busca eventos con título "Ocupar" para determinar slots disponibles
 */

import { z } from 'zod';
import { google } from 'googleapis';
import { podologists, getActivePodologists, findPodologistByKey } from '@/config/podologists';
import { generateMockAvailableSlots } from '@/lib/mock-calendar-service';

const GetCalendarAvailabilityInputSchema = z.object({
  podologistKey: z.string().optional().describe("Clave del podólogo específico. Si se omite o es 'any', busca en todos."),
}).optional();

export type GetCalendarAvailabilityInput = z.infer<typeof GetCalendarAvailabilityInputSchema>;

const CalendarEventSchema = z.object({
  title: z.string().describe("Título del evento del calendario."),
  dateISO: z.string().datetime().describe("Fecha y hora del evento en formato ISO UTC."),
  eventId: z.string().optional().describe("ID del evento en Google Calendar."),
  podologistKey: z.string().describe("Clave del podólogo para este slot."),
  podologistName: z.string().describe("Nombre del podólogo para este slot."),
  podologistCalendarId: z.string().describe("ID del calendario de Google del podólogo."),
});

export type CalendarEventType = z.infer<typeof CalendarEventSchema>;

const GetCalendarAvailabilityOutputSchema = z.object({
  availableSlots: z.array(CalendarEventSchema).describe("Array de slots disponibles (eventos 'Ocupar')."),
  error: z.string().optional().describe("Mensaje de error amigable si falló la consulta."),
  debugInfo: z.string().optional().describe("Información de debug sobre la consulta."),
});

export type GetCalendarAvailabilityOutput = z.infer<typeof GetCalendarAvailabilityOutputSchema>;

export async function getCalendarAvailability(input?: GetCalendarAvailabilityInput): Promise<GetCalendarAvailabilityOutput> {
  let debugInfo = `Iniciando getCalendarAvailability. Input: ${JSON.stringify(input)}\n`;
  const allFetchedSlots: CalendarEventType[] = [];

  let calendarsToQuery = getActivePodologists();

  // Filtrar por podólogo específico si se solicita
  if (input?.podologistKey && input.podologistKey !== 'any') {
    const targetPodologist = findPodologistByKey(input.podologistKey);
    if (targetPodologist && targetPodologist.calendarId) {
      calendarsToQuery = [targetPodologist];
      debugInfo += `Podólogo específico solicitado: ${targetPodologist.name}\n`;
    } else {
      debugInfo += `Podólogo "${input.podologistKey}" no encontrado o sin calendario configurado\n`;
      return { 
        availableSlots: [], 
        error: `El podólogo solicitado no está disponible.`,
        debugInfo 
      };
    }
  }

  if (calendarsToQuery.length === 0) {
    debugInfo += "No hay calendarios configurados correctamente\n";
    return { 
      availableSlots: [], 
      error: "No hay calendarios configurados para buscar disponibilidad.",
      debugInfo 
    };
  }

  debugInfo += `Consultando ${calendarsToQuery.length} calendario(s): ${calendarsToQuery.map(p=>p.name).join(', ')}\n`;

  try {
    // Usar Google Calendar real 
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    debugInfo += "Autenticación con Google Calendar exitosa\n";

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString(); // 90 días adelante

    // Consultar cada calendario
    for (const podologist of calendarsToQuery) {
      debugInfo += `Consultando eventos para ${podologist.name} (${podologist.calendarId})\n`;
      
      try {
        const response = await calendar.events.list({
          calendarId: podologist.calendarId,
          timeMin: timeMin,
          timeMax: timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        });

        debugInfo += `Respuesta API para ${podologist.name}: status ${response.status}\n`;

        const events = response.data.items;
        if (events && events.length > 0) {
          debugInfo += `Encontrados ${events.length} eventos totales para ${podologist.name}\n`;
          
          // Filtrar solo eventos "Ocupar"
          const ocuparSlots = events
            .filter(event => {
              const title = (event.summary || "").trim().toLowerCase();
              const hasStartDate = !!(event.start?.dateTime || event.start?.date);
              // Acepta cualquier variación de "ocupar"
              const isOcupar = title.includes('ocupar');
              
              if (!isOcupar && title.includes('ocupar')) {
                debugInfo += `    Posible error de tipeo: "${event.summary}" no es exactamente "ocupar"\n`;
              }
              
              return isOcupar && hasStartDate;
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
                podologistKey: podologist.key,
                podologistName: podologist.name,
                podologistCalendarId: podologist.calendarId,
              };
            });

          allFetchedSlots.push(...ocuparSlots);
          debugInfo += `Agregados ${ocuparSlots.length} slots "Ocupar" para ${podologist.name}\n`;
        } else {
          debugInfo += `No se encontraron eventos para ${podologist.name}\n`;
        }
      } catch (fetchErr: any) {
        debugInfo += `Error consultando calendario de ${podologist.name}: ${fetchErr.message}\n`;
        // Continuar con otros calendarios
      }
    }

    // Ordenar slots por fecha
    allFetchedSlots.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
    debugInfo += `Total de slots "Ocupar" encontrados: ${allFetchedSlots.length}\n`;

    return { availableSlots: allFetchedSlots, debugInfo };

  } catch (err: any) {
    console.error('Error en getCalendarAvailability:', err);
    const userFriendlyError = "No pudimos consultar la disponibilidad en este momento. Por favor, intenta más tarde.";
    
    debugInfo += `Error general: ${err.message || err.toString()}\n`;
    if ((err as any).response?.data?.error?.message) {
      debugInfo += `Error de Google API: ${(err as any).response.data.error.message}\n`;
    }
    
    return { availableSlots: [], error: userFriendlyError, debugInfo };
  }
}
