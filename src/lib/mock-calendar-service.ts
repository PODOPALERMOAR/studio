/**
 * Servicio simulado para Google Calendar en desarrollo
 * Proporciona datos de ejemplo para evitar errores de autenticación
 */

import { CalendarEventType } from '@/ai/flows/get-calendar-availability';
import { addDays, addHours, format } from 'date-fns';

// Función para generar slots de ejemplo para desarrollo
export function generateMockAvailableSlots(podologistKey: string = 'any'): CalendarEventType[] {
  const slots: CalendarEventType[] = [];
  const now = new Date();
  const podologists = [
    { key: 'silvia', name: 'Podóloga SILVIA', calendarId: 'primary' },
    { key: 'natalia', name: 'Podóloga NATALIA', calendarId: 'primary' },
    { key: 'elizabeth', name: 'Podóloga ELIZABETH', calendarId: 'primary' },
    { key: 'lorena', name: 'Podóloga LORENA', calendarId: 'primary' },
    { key: 'martin', name: 'Podólogo MARTIN', calendarId: 'primary' },
  ];
  
  // Filtrar podólogos si se especifica uno
  const podsToUse = podologistKey !== 'any' 
    ? podologists.filter(p => p.key === podologistKey)
    : podologists;
  
  if (podsToUse.length === 0) {
    return slots; // No hay podólogos que coincidan
  }
  
  console.log('🟢 Generando slots simulados para:', podsToUse.map(p => p.name).join(', '));
  console.log('🟢 Fecha actual:', now.toLocaleString('es-AR'));
  console.log('🟢 Fecha actual ISO:', now.toISOString());
  
  // Generar slots específicos y predecibles para los próximos 14 días
  const specificSlots = [
    // Primer slot: mañana temprano para asegurar que siempre haya uno disponible
    { day: 1, hour: 10, minute: 0, podIndex: 1 }, // NATALIA a las 10:00 mañana
    { day: 1, hour: 11, minute: 30, podIndex: 0 }, // SILVIA a las 11:30 mañana
    { day: 1, hour: 14, minute: 0, podIndex: 2 }, // ELIZABETH a las 14:00 mañana
    { day: 1, hour: 16, minute: 30, podIndex: 0 }, // SILVIA a las 16:30 mañana
    
    // Día 2
    { day: 2, hour: 9, minute: 0, podIndex: 1 }, // NATALIA a las 9:00
    { day: 2, hour: 10, minute: 30, podIndex: 0 }, // SILVIA a las 10:30
    { day: 2, hour: 15, minute: 0, podIndex: 2 }, // ELIZABETH a las 15:00
    { day: 2, hour: 17, minute: 0, podIndex: 1 }, // NATALIA a las 17:00
    
    // Día 3
    { day: 3, hour: 9, minute: 30, podIndex: 2 },
    { day: 3, hour: 12, minute: 0, podIndex: 0 },
    { day: 3, hour: 14, minute: 30, podIndex: 1 },
    { day: 3, hour: 16, minute: 0, podIndex: 2 },
    
    // Día 4
    { day: 4, hour: 8, minute: 30, podIndex: 1 },
    { day: 4, hour: 10, minute: 0, podIndex: 0 },
    { day: 4, hour: 13, minute: 30, podIndex: 2 },
    { day: 4, hour: 15, minute: 30, podIndex: 1 },
    
    // Día 5
    { day: 5, hour: 9, minute: 0, podIndex: 2 },
    { day: 5, hour: 11, minute: 0, podIndex: 1 },
    { day: 5, hour: 14, minute: 0, podIndex: 0 },
    { day: 5, hour: 16, minute: 30, podIndex: 2 },
  ];
  
  // Generar slots basados en la configuración específica
  for (const slotConfig of specificSlots) {
    const baseDate = addDays(now, slotConfig.day);
    const slotDate = new Date(baseDate);
    slotDate.setHours(slotConfig.hour, slotConfig.minute, 0, 0);
    
    // Solo agregar si es en el futuro
    if (slotDate > now) {
      const pod = podsToUse[slotConfig.podIndex % podsToUse.length];
      
      slots.push({
        title: 'Ocupar', // Título exacto que busca el sistema
        dateISO: slotDate.toISOString(),
        eventId: `mock-event-${pod.key}-${format(slotDate, 'yyyyMMdd-HHmm')}`,
        podologistKey: pod.key,
        podologistName: pod.name,
        podologistCalendarId: pod.calendarId
      });
    }
  }
  
  // Ordenar por fecha
  const sortedSlots = slots.sort((a, b) => 
    new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime()
  );
  
  console.log('🟢 Slots generados:', sortedSlots.length);
  console.log('🟢 Primer slot:', sortedSlots[0] ? {
    date: new Date(sortedSlots[0].dateISO).toLocaleString('es-AR'),
    podologist: sortedSlots[0].podologistName,
    title: sortedSlots[0].title
  } : 'Ninguno');
  
  return sortedSlots;
}

// Función para simular la creación de una cita
export async function mockCreateAppointment(
  slotEventId: string,
  patientName: string,
  patientPhone: string,
  reason?: string
): Promise<{ success: boolean; message: string; eventId?: string }> {
  // Simular un pequeño retraso
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simular éxito con 95% de probabilidad
  if (Math.random() > 0.05) {
    return {
      success: true,
      message: `Cita creada exitosamente para ${patientName}`,
      eventId: `new-${slotEventId}`
    };
  } else {
    return {
      success: false,
      message: 'Error simulado al crear la cita'
    };
  }
}