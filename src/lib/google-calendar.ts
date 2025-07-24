/**
 * Google Calendar API integration for PODOPALERMO
 * Maneja la sincronización bidireccional con los 7 calendarios de podólogos
 */

import { google } from 'googleapis';
import { podologists as podologistConfig } from '@/config/podologists';

export const PODOPALERMO_CALENDARS = podologistConfig.reduce((acc, p) => {
  acc[p.key.toUpperCase() as keyof typeof acc] = { id: p.calendarId, name: p.name };
  return acc;
}, {} as Record<string, { id: string; name: string }>);

export type PodologistKey = keyof typeof PODOPALERMO_CALENDARS;

/**
 * Inicializa el cliente de Google Calendar
 */
export function initializeCalendarClient() {
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || '')}`,
    universe_domain: "googleapis.com"
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
  });

  return google.calendar({ version: 'v3', auth });
}

/**
 * Obtiene eventos de un calendario en un rango de fechas
 */
export async function getCalendarEvents(
  calendarId: string,
  startDate: Date,
  endDate: Date
) {
  const calendar = initializeCalendarClient();
  
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500
    });

    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching events from calendar ${calendarId}:`, error);
    throw error;
  }
}

/**
 * Obtiene eventos de todos los calendarios de PODOPALERMO
 */
export async function getAllPodopalermoEvents(
  startDate: Date,
  endDate: Date
) {
  console.log('📅 Obteniendo eventos de todos los calendarios PODOPALERMO...');
  const allEvents = [];
  
  for (const p of podologistConfig) {
    try {
      console.log(`🔍 Procesando ${p.name} (${p.key})...`);
      const events = await getCalendarEvents(p.calendarId, startDate, endDate);
      console.log(`✅ ${p.name}: ${events.length} eventos encontrados`);
      
      const eventsWithMetadata = events.map(event => ({
        ...event,
        podologistKey: p.key,
        podologistName: p.name,
        calendarId: p.calendarId
      }));
      
      allEvents.push(...eventsWithMetadata);
    } catch (error) {
      console.error(`❌ Error fetching events for ${p.name}:`, error);
    }
  }
  
  console.log(`🎯 Total eventos obtenidos: ${allEvents.length}`);
  return allEvents;
}

/**
 * Crea un nuevo evento en un calendario específico
 */
export async function createCalendarEvent(
  calendarId: string,
  eventData: {
    summary: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    description?: string;
  }
) {
  const calendar = initializeCalendarClient();
  
  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventData
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error creating event in calendar ${calendarId}:`, error);
    throw error;
  }
}

/**
 * Actualiza un evento existente
 */
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  eventData: any
) {
  const calendar = initializeCalendarClient();
  
  try {
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: eventData
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating event ${eventId} in calendar ${calendarId}:`, error);
    throw error;
  }
}

/**
 * Elimina un evento
 */
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
) {
  const calendar = initializeCalendarClient();
  
  try {
    await calendar.events.delete({
      calendarId,
      eventId
    });
    
    return true;
  } catch (error) {
    console.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error);
    throw error;
  }
}

/**
 * Convierte un slot "Ocupar" en un turno con paciente
 */
export async function bookAvailableSlot(
  calendarId: string,
  eventId: string,
  patientName: string,
  phoneNumber: string
) {
  const newTitle = `N: ${patientName} T: ${phoneNumber}`;
  
  return await updateCalendarEvent(calendarId, eventId, {
    summary: newTitle
  });
}

/**
 * Obtiene el rango de fechas para sincronización (12 meses atrás + 12 adelante)
 */
export function getSyncDateRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  const startDate = new Date(now);
  startDate.setMonth(now.getMonth() - 12);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(now);
  endDate.setMonth(now.getMonth() + 12);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}
