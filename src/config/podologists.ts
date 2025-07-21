// Configuración de podólogos para PODOPALERMO

export interface PodologistProfile {
  key: string; // Clave única interna (ej: "silvia", "natalia")
  name: string; // Nombre para mostrar (ej: "Podóloga SILVIA")
  calendarId: string; // ID del calendario de Google
  specialties?: string[]; // Especialidades opcionales
}

// Helper para obtener variables de entorno de forma segura
const getEnvVar = (varName: string, podologistName: string): string => {
  const value = process.env[varName];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  console.warn(`[podologists.ts] ADVERTENCIA: Variable ${varName} para ${podologistName} no definida`);
  return '';
};

export const podologists: PodologistProfile[] = [
  {
    key: 'silvia',
    name: 'Podóloga SILVIA',
    calendarId: getEnvVar('CALENDAR_ID_SILVIA', 'Podóloga SILVIA'),
    specialties: ['Podología general', 'Pie diabético']
  },
  {
    key: 'natalia',
    name: 'Podóloga NATALIA',
    calendarId: getEnvVar('CALENDAR_ID_NATALIA', 'Podóloga NATALIA'),
    specialties: ['Podología deportiva', 'Biomecánica']
  },
  {
    key: 'elizabeth',
    name: 'Podóloga ELIZABETH',
    calendarId: getEnvVar('CALENDAR_ID_ELIZABETH', 'Podóloga ELIZABETH'),
    specialties: ['Podología general', 'Onicocriptosis']
  },
  {
    key: 'lorena',
    name: 'Podóloga LORENA',
    calendarId: getEnvVar('CALENDAR_ID_LORENA', 'Podóloga LORENA'),
    specialties: ['Podología general', 'Verrugas plantares']
  },
  {
    key: 'martin',
    name: 'Podólogo MARTIN',
    calendarId: getEnvVar('CALENDAR_ID_MARTIN', 'Podólogo MARTIN'),
    specialties: ['Podología masculina', 'Deportiva']
  },
  {
    key: 'diana',
    name: 'Podóloga DIANA',
    calendarId: getEnvVar('CALENDAR_ID_DIANA', 'Podóloga DIANA'),
    specialties: ['Podología general', 'Helomas']
  },
  {
    key: 'luciana',
    name: 'Podóloga LUCIANA',
    calendarId: getEnvVar('CALENDAR_ID_LUCIANA', 'Podóloga LUCIANA'),
    specialties: ['Podología general', 'Ortesis']
  },
];

// Helper para encontrar podólogo por clave
export function findPodologistByKey(key: string): PodologistProfile | undefined {
  return podologists.find(p => p.key.toLowerCase() === key.toLowerCase());
}

// Helper para obtener podólogos con calendario configurado
export function getActivePodologists(): PodologistProfile[] {
  return podologists.filter(p => p.calendarId && p.calendarId.trim() !== '');
}