'use server';
/**
 * Encuentra el próximo slot disponible consultando eventos "Ocupar"
 * Puede filtrar por podólogo específico o buscar en todos
 */

import { z } from 'zod';
import { getCalendarAvailability, type CalendarEventType } from './get-calendar-availability';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { findPodologistByKey } from '@/config/podologists';

const FindNextAvailableSlotInputSchema = z.object({
  previousSlotTimestamp: z.string().datetime().optional().describe("Timestamp ISO UTC del slot anterior sugerido, para buscar después de esta fecha."),
  podologistKey: z.string().optional().describe("Clave del podólogo a buscar. Si es 'any' o undefined, busca en todos."),
});

export type FindNextAvailableSlotInput = z.infer<typeof FindNextAvailableSlotInputSchema>;

const OptionSchema = z.object({
  label: z.string().describe("Texto mostrado en el botón para el usuario."),
  action: z.string().describe("Identificador de la acción que dispara esta opción."),
  metadata: z.record(z.string(), z.any()).optional().describe("Datos adicionales asociados con la opción."),
});

const FindNextAvailableSlotOutputSchema = z.object({
  message: z.string().describe("Mensaje del asistente sobre el slot encontrado."),
  slotFound: z.boolean().describe("Indica si se encontró un slot."),
  suggestedSlotTimestamp: z.string().datetime().optional().describe("Timestamp ISO UTC del slot sugerido."),
  options: z.array(OptionSchema).optional().describe("Array de opciones presentadas al usuario como botones."),
  debugInfo: z.string().optional().describe("Información de debug sobre la búsqueda."),
  eventId: z.string().optional().describe("ID del evento de Google Calendar del slot sugerido."),
  podologistInfo: z.object({
    key: z.string(),
    name: z.string(),
    calendarId: z.string(),
  }).optional().describe("Información del podólogo para el slot sugerido."),
});

export type FindNextAvailableSlotOutput = z.infer<typeof FindNextAvailableSlotOutputSchema>;

export async function findNextAvailableSlot(input?: FindNextAvailableSlotInput): Promise<FindNextAvailableSlotOutput> {
  let debugInfo = `Iniciando findNextAvailableSlot. Input: ${JSON.stringify(input)}\n`;
  
  const effectivePodologistKey = input?.podologistKey === 'any' ? undefined : input?.podologistKey;
  let searchingForPodologistName = "cualquier podólogo disponible";
  
  if (effectivePodologistKey) {
    const profile = findPodologistByKey(effectivePodologistKey);
    if (profile) {
      searchingForPodologistName = profile.name;
    }
  }
  
  debugInfo += `Buscando slots para: ${searchingForPodologistName}\n`;

  // Obtener disponibilidad de calendarios
  const availabilityResult = await getCalendarAvailability({ podologistKey: effectivePodologistKey });

  if (availabilityResult.error) {
    debugInfo += `Error obteniendo disponibilidad: ${availabilityResult.error}\n`;
    debugInfo += `Debug de getCalendarAvailability: ${availabilityResult.debugInfo || 'N/A'}\n`;
    
    return {
      message: `Lo siento, tuve un problema al consultar la agenda para ${searchingForPodologistName}. Por favor, intenta más tarde o contacta a Cecilia.`,
      slotFound: false,
      options: [{ label: "Volver al menú principal", action: "goHome" }],
      debugInfo,
    };
  }
  
  debugInfo += `Debug de getCalendarAvailability: ${availabilityResult.debugInfo || 'N/A'}\n`;

  if (!availabilityResult.availableSlots || availabilityResult.availableSlots.length === 0) {
    debugInfo += `No se encontraron slots "Ocupar" para ${searchingForPodologistName}\n`;
    
    let noSlotsMessage = `En este momento no encuentro turnos disponibles para ${searchingForPodologistName}.`;
    if (!effectivePodologistKey) {
      noSlotsMessage += " Te sugiero consultar nuevamente más tarde o contactar directamente a Cecilia por WhatsApp al 1167437969.";
    }

    return {
      message: noSlotsMessage,
      slotFound: false,
      options: [
        { label: "Buscar cualquier podólogo", action: "findNext", metadata: { podologistKey: 'any' } },
        { label: "Volver al menú principal", action: "goHome" },
      ],
      debugInfo,
    };
  }
  
  const allAvailableSlots: CalendarEventType[] = availabilityResult.availableSlots;
  debugInfo += `Recibidos ${allAvailableSlots.length} slots "Ocupar"\n`;

  // Determinar fecha de búsqueda
  let searchFromDate: Date;
  const now = new Date();

  if (input?.previousSlotTimestamp) {
    const prevSlotDate = new Date(input.previousSlotTimestamp);
    searchFromDate = new Date(prevSlotDate.getTime() + 1); // 1ms después
    debugInfo += `Buscando slots después de: ${searchFromDate.toISOString()}\n`;
  } else {
    searchFromDate = now;
    debugInfo += `Buscando slots desde ahora: ${searchFromDate.toISOString()}\n`;
  }
  
  // Filtrar y ordenar slots
  const sortedAndFilteredSlots = allAvailableSlots
    .map(slot => ({ ...slot, dateObj: new Date(slot.dateISO) }))
    .filter(slot => slot.dateObj >= searchFromDate)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  debugInfo += `Slots disponibles después del filtro: ${sortedAndFilteredSlots.length}\n`;
  
  // Log detallado de los slots filtrados
  if (sortedAndFilteredSlots.length > 0) {
    debugInfo += `Primeros 3 slots filtrados:\n`;
    sortedAndFilteredSlots.slice(0, 3).forEach((slot, index) => {
      debugInfo += `  ${index + 1}. ${slot.title} - ${slot.dateObj.toLocaleString('es-AR')} - ${slot.podologistName}\n`;
    });
  }
  
  if (sortedAndFilteredSlots.length > 0) {
    const suggestedSlot = sortedAndFilteredSlots[0];
    const finalSuggestedDateUtc = suggestedSlot.dateObj;

    // Formatear fecha para mostrar en zona horaria de Buenos Aires
    const TIMEZONE_BA = 'America/Argentina/Buenos_Aires';
    const formattedDateTime = formatInTimeZone(
      finalSuggestedDateUtc, 
      TIMEZONE_BA, 
      "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", 
      { locale: es }
    );
    
    const message = `¡Perfecto! El próximo turno disponible es el ${formattedDateTime} con ${suggestedSlot.podologistName}. ¿Te gustaría reservarlo?`;
    
    debugInfo += `Ofreciendo slot: ${suggestedSlot.dateISO} -> ${formattedDateTime} con ${suggestedSlot.podologistName}\n`;
    
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
          label: "Ver siguiente turno disponible", 
          action: "findNext", 
          metadata: { 
            podologistKey: 'any', 
            previousSlotTimestamp: finalSuggestedDateUtc.toISOString() 
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
    debugInfo += `No se encontraron slots adecuados después del filtro\n`;
    
    let noMoreSlotsMessage: string;
    if (input?.previousSlotTimestamp) {
      noMoreSlotsMessage = `Lo siento, no encontré más turnos disponibles para ${searchingForPodologistName} después de la fecha indicada.`;
    } else {
      noMoreSlotsMessage = `Lo siento, no hay turnos disponibles para ${searchingForPodologistName} en este momento.`;
    }
    
    return {
      message: noMoreSlotsMessage,
      slotFound: false,
      options: [
        { label: "Buscar cualquier podólogo", action: "findNext", metadata: { podologistKey: 'any' } },
        { label: "Volver al menú principal", action: "goHome" },
      ],
      debugInfo,
    };
  }
}