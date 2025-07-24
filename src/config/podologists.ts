'use server';
// Configuración de podólogos para PODOPALERMO

export interface PodologistProfile {
  key: string; // Clave única interna (ej: "silvia", "natalia")
  name: string; // Nombre para mostrar (ej: "Podóloga SILVIA")
  calendarId: string; // ID del calendario de Google
  specialties?: string[]; // Especialidades opcionales
}

export const podologists: PodologistProfile[] = [
  {
    key: 'silvia',
    name: 'Podóloga SILVIA',
    calendarId: '6f9ede745ce9d3277a7759b8eb7d85328322e7f471d4d576e7371c298b861caa@group.calendar.google.com',
    specialties: ['Podología general', 'Pie diabético']
  },
  {
    key: 'natalia',
    name: 'Podóloga NATALIA',
    calendarId: '81a0f190b31be19110d69ef0b20e07f5f0d1041d370427e623c51fbe2a47326b@group.calendar.google.com',
    specialties: ['Podología deportiva', 'Biomecánica']
  },
  {
    key: 'elizabeth',
    name: 'Podóloga ELIZABETH',
    calendarId: '296768970b6f1a4c738ce0cf3d7f0bcece6159f8c9fb9d6609cb17aee189c8c7@group.calendar.google.com',
    specialties: ['Podología general', 'Onicocriptosis']
  },
  {
    key: 'lorena',
    name: 'Podóloga LORENA',
    calendarId: 'c43f26136a6884b6de70e89b41bc214a3302b7ac504680ae62e1ff27f41419b7@group.calendar.google.com',
    specialties: ['Podología general', 'Verrugas plantares']
  },
  {
    key: 'martin',
    name: 'Podólogo MARTIN',
    calendarId: 'cb98de7b1dc8027f82bdc74f02761a71e681bfc7634756a27ee820e822d05b23@group.calendar.google.com',
    specialties: ['Podología masculina', 'Deportiva']
  },
  {
    key: 'diana',
    name: 'Podóloga DIANA',
    calendarId: '4db06585d67cfad764d8a3be208e128581aae5372ee60a8d078459889855f72e@group.calendar.google.com',
    specialties: ['Podología general', 'Helomas']
  },
  {
    key: 'luciana',
    name: 'Podóloga LUCIANA',
    calendarId: 'f5c1fff48d572ef52eddd337fdc4fb8897a4dbb4c35ed4a44192cadc7d063f36@group.calendar.google.com',
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
