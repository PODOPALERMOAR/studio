/**
 * Google Calendar API integration for PODOPALERMO
 * Maneja la sincronización bidireccional con los 7 calendarios de podólogos
 */

import { google } from 'googleapis';

// Configuración de calendarios de PODOPALERMO
export const PODOPALERMO_CALENDARS = {
  SILVIA: {
    id: '6f9ede745ce9d3277a7759b8eb7d85328322e7f471d4d576e7371c298b861caa@group.calendar.google.com',
    name: 'Podóloga SILVIA'
  },
  NATALIA: {
    id: '81a0f190b31be19110d69ef0b20e07f5f0d1041d370427e623c51fbe2a47326b@group.calendar.google.com',
    name: 'Podóloga NATALIA'
  },
  ELIZABETH: {
    id: '296768970b6f1a4c738ce0cf3d7f0bcece6159f8c9fb9d6609cb17aee189c8c7@group.calendar.google.com',
    name: 'Podóloga ELIZABETH'
  },
  LORENA: {
    id: 'c43f26136a6884b6de70e89b41bc214a3302b7ac504680ae62e1ff27f41419b7@group.calendar.google.com',
    name: 'Podóloga LORENA'
  },
  MARTIN: {
    id: 'cb98de7b1dc8027f82bdc74f02761a71e681bfc7634756a27ee820e822d05b23@group.calendar.google.com',
    name: 'Podólogo MARTIN'
  },
  DIANA: {
    id: '4db06585d67cfad764d8a3be208e128581aae5372ee60a8d078459889855f72e@group.calendar.google.com',
    name: 'Podóloga DIANA'
  },
  LUCIANA: {
    id: 'f5c1fff48d572ef52eddd337fdc4fb8897a4dbb4c35ed4a44192cadc7d063f36@group.calendar.google.com',
    name: 'Podóloga LUCIANA'
  }
} as const;

export type PodologistKey = keyof typeof PODOPALERMO_CALENDARS;

/**
 * Inicializa el cliente de Google Calendar
 */
export function initializeCalendarClient() {
  // Usar variables de entorno para evitar problemas de parsing
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Convertir \n literales a saltos de línea
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
      maxResults: 2500 // Suficiente para 24 meses de datos
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
  
  for (const [key, calendar] of Object.entries(PODOPALERMO_CALENDARS)) {
    try {
      console.log(`🔍 Procesando ${calendar.name} (${key})...`);
      const events = await getCalendarEvents(calendar.id, startDate, endDate);
      console.log(`✅ ${calendar.name}: ${events.length} eventos encontrados`);
      
      // Agregar metadatos a cada evento
      const eventsWithMetadata = events.map(event => ({
        ...event,
        podologistKey: key as PodologistKey,
        podologistName: calendar.name,
        calendarId: calendar.id
      }));
      
      allEvents.push(...eventsWithMetadata);
    } catch (error) {
      console.error(`❌ Error fetching events for ${calendar.name}:`, error);
      // Continuar con otros calendarios aunque uno falle
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
  
  // 12 meses atrás
  const startDate = new Date(now);
  startDate.setMonth(now.getMonth() - 12);
  startDate.setHours(0, 0, 0, 0);
  
  // 12 meses adelante
  const endDate = new Date(now);
  endDate.setMonth(now.getMonth() + 12);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}