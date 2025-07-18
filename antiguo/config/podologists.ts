
// src/config/podologists.ts

export interface PodologistProfile {
  key: string; // A unique key for internal use (e.g., "silvia", "natalia")
  name: string; // Display name for the UI (e.g., "Podóloga SILVIA")
  calendarId: string; // The Google Calendar ID, sourced from environment variables
}

// Helper function to ensure calendar IDs are strings, even if env var is undefined
const getEnvVar = (varName: string, podologistName: string): string => {
  const value = process.env[varName];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  console.warn(`[podologists.ts] ADVERTENCIA: La variable de entorno ${varName} para ${podologistName} no está definida o está vacía. El calendario no funcionará.`);
  return ''; // Return empty string if not found, to avoid 'undefined'
};

export const podologists: PodologistProfile[] = [
  {
    key: 'silvia',
    name: 'Podóloga SILVIA',
    calendarId: getEnvVar('CALENDAR_ID_SILVIA', 'Podóloga SILVIA'),
  },
  {
    key: 'natalia',
    name: 'Podóloga NATALIA',
    calendarId: getEnvVar('CALENDAR_ID_NATALIA', 'Podóloga NATALIA'),
  },
  {
    key: 'elizabeth',
    name: 'Podóloga ELIZABETH',
    calendarId: getEnvVar('CALENDAR_ID_ELIZABETH', 'Podóloga ELIZABETH'),
  },
  {
    key: 'lorena',
    name: 'Podóloga LORENA',
    calendarId: getEnvVar('CALENDAR_ID_LORENA', 'Podóloga LORENA'),
  },
  {
    key: 'martin',
    name: 'Podólogo MARTIN',
    calendarId: getEnvVar('CALENDAR_ID_MARTIN', 'Podólogo MARTIN'),
  },
  {
    key: 'diana',
    name: 'Podóloga DIANA',
    calendarId: getEnvVar('CALENDAR_ID_DIANA', 'Podóloga DIANA'),
  },
  {
    key: 'luciana',
    name: 'Podóloga LUCIANA',
    calendarId: getEnvVar('CALENDAR_ID_LUCIANA', 'Podóloga LUCIANA'),
  },
];
    
    