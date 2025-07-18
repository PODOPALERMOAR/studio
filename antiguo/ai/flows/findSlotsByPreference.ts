
'use server';
/**
 * @fileOverview Allows users to find appointment slots based on preferences.
 * The main screen shows time filters and an option to select a specific podologist.
 * If no podologist is selected, searches are for "any available".
 *
 * - findSlotsByPreference - Handles the preference-based slot finding process.
 * - FindSlotsByPreferenceInput - Input for the flow.
 * - FindSlotsByPreferenceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getCalendarAvailability, type CalendarEventType } from './get-calendar-availability';
import { podologists, type PodologistProfile } from '@/config/podologists';
import {
  isWithinInterval,
  startOfDay,
  endOfDay,
  addDays,
  getHours,
  isAfter,
} from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TIMEZONE = 'America/Argentina/Buenos_Aires';

const OptionSchema = z.object({
  label: z.string().describe("The text displayed on the button for the user."),
  action: z.string().describe("An identifier for the action this option triggers."),
  metadata: z.record(z.string(), z.any()).optional().describe("Any additional data associated with the option"),
});
export type Option = z.infer<typeof OptionSchema>;

const FindSlotsByPreferenceInputSchema = z.object({
  actionRequest: z.enum(['request_podologist_selection', 'perform_search']).optional().describe("Specific action user wants to take or implies."),
  selectedPodologistKey: z.string().optional().describe("The key of the podologist selected by the user (or 'any'). If undefined, defaults to 'any'."),
  selectedFilterType: z.string().optional().describe("The type of time filter to apply (e.g., 'morning', 'afternoon', 'from15days'). Only present if actionRequest is 'perform_search'."),
  previousSlotTimestamp: z.string().datetime().optional().describe("An ISO string timestamp (UTC) of the previously suggested slot for this filter/podologist, to search after this date."),
});
export type FindSlotsByPreferenceInput = z.infer<typeof FindSlotsByPreferenceInputSchema>;

const SlotSuggestionSchema = z.object({
  display: z.string().describe("Formatted string for display to user, e.g., 'Lunes, 10 de Junio a las 10:00 hs'"),
  timestamp: z.string().datetime().describe("ISO string timestamp (UTC) of the slot"),
  eventId: z.string().describe("Google Calendar event ID of the slot"),
  podologistKey: z.string().describe("Key of the podologist for this slot."),
  podologistName: z.string().describe("Name of the podologist for this slot."),
  podologistCalendarId: z.string().describe("Calendar ID of the podologist for this slot."),
});


const AppliedPodologistInfoSchema = z.object({
    key: z.string().optional(),
    name: z.string().optional(),
}).describe("Information about the podologist whose schedule was actually searched or is the current context.");


const FindSlotsByPreferenceOutputSchema = z.object({
  message: z.string().describe("The message from the AI assistant."),
  slotsFound: z.boolean().describe("Indicates if any matching slots were found for the current filter iteration (only relevant if a search was performed)."),
  suggestedSlot: SlotSuggestionSchema.optional().describe("The next suggested appointment slot matching the criteria, if any."),
  options: z.array(OptionSchema).optional().describe("An array of choices presented to the user as buttons."),
  debugInfo: z.string().optional().describe("Debugging information."),
  appliedPodologistInfo: AppliedPodologistInfoSchema,
  actionRequest: FindSlotsByPreferenceInputSchema.shape.actionRequest,
  appliedFilterType: z.string().optional().describe("The time filter type that was applied for the search, if any."),
});
export type FindSlotsByPreferenceOutput = z.infer<typeof FindSlotsByPreferenceOutputSchema>;

export async function findSlotsByPreference(input: FindSlotsByPreferenceInput): Promise<FindSlotsByPreferenceOutput> {
  return findSlotsByPreferenceFlow(input);
}

const findSlotsByPreferenceFlow = ai.defineFlow(
  {
    name: 'findSlotsByPreferenceFlow',
    inputSchema: FindSlotsByPreferenceInputSchema,
    outputSchema: FindSlotsByPreferenceOutputSchema,
  },
  async (input) => {
    const {
        actionRequest,
        selectedPodologistKey: inputPodologistKey,
        selectedFilterType,
        previousSlotTimestamp
    } = input;

    let debugInfo = `Starting findSlotsByPreferenceFlow. Input: ${JSON.stringify(input)}\n`;

    const effectivePodologistKey = inputPodologistKey === 'any' ? undefined : inputPodologistKey;
    let podologistDisplayName = "cualquiera disponible";
    let currentPodologistProfile: PodologistProfile | undefined = undefined;
    let appliedPodologistInfo: z.infer<typeof AppliedPodologistInfoSchema> = { key: undefined, name: "cualquiera disponible"};


    if (effectivePodologistKey) {
        currentPodologistProfile = podologists.find(p => p.key === effectivePodologistKey);
        if (currentPodologistProfile) {
            podologistDisplayName = currentPodologistProfile.name;
            appliedPodologistInfo = { key: currentPodologistProfile.key, name: currentPodologistProfile.name };
        } else {
            debugInfo += `Warning: Podologist key ${effectivePodologistKey} not found. Defaulting to 'any'.\n`;
            appliedPodologistInfo = { key: undefined, name: "cualquiera disponible"};
        }
    }
    debugInfo += `Context: Podólogo efectivo: ${podologistDisplayName} (key: ${effectivePodologistKey || 'any'}). Filtro: ${selectedFilterType}. Acción: ${actionRequest}\n`;

    if (actionRequest === 'request_podologist_selection') {
      debugInfo += "Presentando lista de podólogos para selección.\n";
      const podologistChoiceOptions: Option[] = podologists.map(p => ({
        label: p.name,
        action: "findByPreference",
        metadata: { selectedPodologistKey: p.key } // This will take user to filter screen with podo selected
      }));
      podologistChoiceOptions.push({
        label: "Con Cualquiera Disponible",
        action: "findByPreference",
        metadata: { selectedPodologistKey: 'any' } // This will take user to filter screen with 'any' selected
      });
      podologistChoiceOptions.push({
        label: "Cancelar selección", // Takes back to filter screen with previous podo context (whatever was before clicking "elegir podologo")
        action: "findByPreference",
        metadata: { selectedPodologistKey: input.selectedPodologistKey } // Use the key that was active when "Elegir podólogo/a" was clicked
      });

      return {
        message: "¿Con qué podólogo/a te gustaría atenderte?",
        slotsFound: false,
        options: podologistChoiceOptions,
        debugInfo,
        appliedPodologistInfo: appliedPodologistInfo,
        actionRequest: 'request_podologist_selection',
      };
    }

    if (actionRequest === 'perform_search' && selectedFilterType) {
      debugInfo += `Realizando búsqueda. Podólogo: ${podologistDisplayName}, Filtro: ${selectedFilterType}, Desde: ${previousSlotTimestamp || 'Ahora'}\n`;

      const availabilityResult = await getCalendarAvailability({
        podologistKey: effectivePodologistKey
      });
      debugInfo += `Disponibilidad obtenida. Debug: ${availabilityResult.debugInfo || 'N/A'}\n`;

      if (availabilityResult.error || !availabilityResult.availableSlots) {
        debugInfo += `Error al obtener disponibilidad o no hay array de slots: ${availabilityResult.error || 'No hay array de slots'}\n`;
        return {
          message: "Lo siento, no pude consultar la agenda en este momento. Por favor, intenta más tarde.",
          slotsFound: false,
          options: [
            { label: "Otro filtro de tiempo", action: "findByPreference", metadata: { selectedPodologistKey: effectivePodologistKey || 'any' } },
            { label: "Cambiar podólogo/a", action: "findByPreference", metadata: { actionRequest: 'request_podologist_selection', selectedPodologistKey: effectivePodologistKey || 'any' } },
            { label: "Volver al inicio", action: "goHome" }
          ],
          debugInfo,
          appliedPodologistInfo: appliedPodologistInfo,
          actionRequest: 'perform_search',
          appliedFilterType: selectedFilterType
        };
      }
      
      const noSlotsForPodologistMessage = !effectivePodologistKey
        ? `Lo siento, no hay turnos cargados en la agenda online en este momento. Por favor, intentalo más tarde o contacta a Cecilia.`
        : `Lo siento, ${podologistDisplayName} no tiene turnos cargados en la agenda en este momento.`;

      const noSlotsForPodologistOptions: Option[] = [
          { label: "Buscar con cualquier podólogo/a", action: "findByPreference", metadata: { actionRequest: 'perform_search', selectedPodologistKey: 'any', selectedFilterType: selectedFilterType } },
          { label: "Elegir otro/a podólogo/a", action: "findByPreference", metadata: { actionRequest: 'request_podologist_selection', selectedPodologistKey: 'any' } }, // Go to podo selection screen, starting with 'any'
          { label: "Volver al menú principal", action: "goHome" }
        ];

      if (availabilityResult.availableSlots.length === 0) {
         debugInfo += `No hay slots 'Ocupar' para ${podologistDisplayName} antes de filtrar por tiempo.\n`;
         return {
          message: noSlotsForPodologistMessage,
          slotsFound: false,
          options: noSlotsForPodologistOptions,
          debugInfo,
          appliedPodologistInfo: appliedPodologistInfo,
          actionRequest: 'perform_search',
          appliedFilterType: selectedFilterType
        };
      }

      const nowInBA = toZonedTime(new Date(), TIMEZONE);
      let searchFromDateUtc = previousSlotTimestamp ? new Date(new Date(previousSlotTimestamp).getTime() + 1000) : new Date();

      const allAvailableOcuparSlots = availabilityResult.availableSlots
          .map(slot => ({ ...slot, dateObj: new Date(slot.dateISO) }))
          .filter(slot => slot.dateObj >= searchFromDateUtc)
          .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      debugInfo += `Encontrados ${allAvailableOcuparSlots.length} slots 'Ocupar' para ${podologistDisplayName} después de filtro de tiempo inicial.\n`;

      let filteredSlotsByTime: CalendarEventType[] = [];
      const todayInBA = startOfDay(nowInBA);

      switch (selectedFilterType) {
        case 'morning':
          const morningStartHour = 9; const morningEndHour = 11; // 9:00 to 11:59
          filteredSlotsByTime = allAvailableOcuparSlots.filter(slot => {
            const slotInBA = toZonedTime(slot.dateObj, TIMEZONE);
            const hourInBA = getHours(slotInBA);
            return hourInBA >= morningStartHour && hourInBA <= morningEndHour && slotInBA >= nowInBA;
          });
          break;
        case 'afternoon':
          const afternoonStartHour = 13; const afternoonEndHour = 17; // 13:00 to 17:59
          filteredSlotsByTime = allAvailableOcuparSlots.filter(slot => {
            const slotInBA = toZonedTime(slot.dateObj, TIMEZONE);
            const hourInBA = getHours(slotInBA);
            return hourInBA >= afternoonStartHour && hourInBA <= afternoonEndHour && slotInBA >= nowInBA;
          });
          break;
        case 'next7days':
          const sevenDaysLater = endOfDay(addDays(todayInBA, 6)); // From now up to end of 6th day from today
          filteredSlotsByTime = allAvailableOcuparSlots.filter(slot => {
              const slotInBA = toZonedTime(slot.dateObj, TIMEZONE);
              return isWithinInterval(slotInBA, { start: nowInBA, end: sevenDaysLater });
          });
          break;
        case 'from15days':
          const fifteenDaysFromTodayStart = startOfDay(addDays(todayInBA, 15));
          filteredSlotsByTime = allAvailableOcuparSlots.filter(slot => {
              const slotInBA = toZonedTime(slot.dateObj, TIMEZONE);
              // Ensure it's on or after the start of the 15th day from today, AND also after 'nowInBA' (in case 15th day is today and time has passed)
              return (isAfter(slotInBA, fifteenDaysFromTodayStart) || slotInBA.getTime() === fifteenDaysFromTodayStart.getTime()) && slotInBA >= nowInBA;
          });
          break;
        default: // 'anytime' (removed from UI, but logic kept for safety) or unknown filter
          debugInfo += `Tipo de filtro desconocido o 'anytime' (no UI): ${selectedFilterType}. No se aplica filtro de rango de tiempo específico.\n`;
          filteredSlotsByTime = allAvailableOcuparSlots.filter(slot => toZonedTime(slot.dateObj, TIMEZONE) >= nowInBA);
      }
      debugInfo += `Filtrados por '${selectedFilterType}': ${filteredSlotsByTime.length} slots para ${podologistDisplayName}.\n`;

      if (filteredSlotsByTime.length > 0) {
        const suggestedSlotData = filteredSlotsByTime[0];
        const slotDateUtc = new Date(suggestedSlotData.dateISO);
        const displayString = formatInTimeZone(slotDateUtc, TIMEZONE, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", { locale: es });

        let filterFriendlyName = selectedFilterType;
        if (selectedFilterType === 'morning') filterFriendlyName = 'mañanas';
        else if (selectedFilterType === 'afternoon') filterFriendlyName = 'tardes';
        else if (selectedFilterType === 'next7days') filterFriendlyName = 'próximos 7 días';
        else if (selectedFilterType === 'from15days') filterFriendlyName = '15 días en adelante';
        // Removed 'anytime' friendly name as it's not a UI option

        const slotPodologistInfo = {
            key: suggestedSlotData.podologistKey,
            name: suggestedSlotData.podologistName,
            calendarId: suggestedSlotData.podologistCalendarId
        };
        const message = `Encontré este turno ${!effectivePodologistKey || appliedPodologistInfo.key !== slotPodologistInfo.key ? `con ${slotPodologistInfo.name} ` : ''}para tu preferencia de ${filterFriendlyName}: ${displayString}. ¿Te gustaría reservarlo?`;
        debugInfo += `Ofreciendo slot: ${displayString} (UTC: ${slotDateUtc.toISOString()}) con ${slotPodologistInfo.name}. Event ID: ${suggestedSlotData.eventId}\n`;

        const nextSlotOptions: Option[] = [
          {
            label: "Sí, reservar este horario",
            action: "confirmSlot",
            metadata: {
              slotId: suggestedSlotData.eventId,
              slotTimestamp: slotDateUtc.toISOString(),
              podologistKey: slotPodologistInfo.key,
              podologistName: slotPodologistInfo.name,
              podologistCalendarId: slotPodologistInfo.calendarId,
            }
          },
        ];

        if (filteredSlotsByTime.length > 1) {
          nextSlotOptions.push({
            label: "Buscar siguiente (mismo filtro)",
            action: "findByPreference",
            metadata: {
              actionRequest: 'perform_search',
              selectedPodologistKey: effectivePodologistKey || 'any',
              selectedFilterType: selectedFilterType,
              previousSlotTimestamp: slotDateUtc.toISOString()
            }
          });
        }

        nextSlotOptions.push(
          { label: "Otro filtro de tiempo", action: "findByPreference", metadata: { selectedPodologistKey: effectivePodologistKey || 'any' } },
          { label: "Cambiar podólogo/a", action: "findByPreference", metadata: { actionRequest: 'request_podologist_selection', selectedPodologistKey: effectivePodologistKey || 'any' } },
          { label: "Volver al menú principal", action: "goHome" }
        );

        return {
          message: message,
          slotsFound: true,
          suggestedSlot: {
            display: displayString,
            timestamp: slotDateUtc.toISOString(),
            eventId: suggestedSlotData.eventId!,
            podologistKey: slotPodologistInfo.key,
            podologistName: slotPodologistInfo.name,
            podologistCalendarId: slotPodologistInfo.calendarId,
          },
          options: nextSlotOptions,
          debugInfo,
          appliedPodologistInfo: slotPodologistInfo, // Update appliedPodologistInfo to the one for the slot found
          actionRequest: 'perform_search',
          appliedFilterType: selectedFilterType
        };
      } else { // No slots found for the specific time filter
        let userFriendlyFilterName = selectedFilterType;
        if (selectedFilterType === 'morning') userFriendlyFilterName = 'las mañanas';
        else if (selectedFilterType === 'afternoon') userFriendlyFilterName = 'las tardes';
        else if (selectedFilterType === 'next7days') userFriendlyFilterName = 'los próximos 7 días';
        else if (selectedFilterType === 'from15days') userFriendlyFilterName = '15 días en adelante';
        // Removed 'anytime' friendly name

        let noSlotsMessage = `Lo siento, no encontré más turnos disponibles para ${podologistDisplayName} en ${userFriendlyFilterName}.`;
        const noSlotsOptions: Option[] = [];

        if (effectivePodologistKey) { 
          noSlotsMessage += ` ¿Te gustaría que busque en ${userFriendlyFilterName} con cualquiera, o probar otro filtro para ${podologistDisplayName}?`;
          noSlotsOptions.push({
            label: `Buscar cualquiera (en ${userFriendlyFilterName})`,
            action: "findByPreference",
            metadata: {
              actionRequest: 'perform_search',
              selectedPodologistKey: 'any', 
              selectedFilterType: selectedFilterType 
            }
          });
          noSlotsOptions.push({
            label: `Otro filtro (con ${podologistDisplayName})`,
            action: "findByPreference",
            metadata: {
              selectedPodologistKey: effectivePodologistKey 
            }
          });
        } else { 
           noSlotsMessage += ` ¿Te gustaría probar otro filtro de tiempo?`;
           noSlotsOptions.push({
            label: "Otro filtro de tiempo",
            action: "findByPreference",
            metadata: {
              selectedPodologistKey: 'any' 
            }
          });
        }
        
        noSlotsOptions.push({ label: "Volver al menú principal", action: "goHome" });

        debugInfo += `No se encontraron slots para ${podologistDisplayName} que coincidan con el filtro '${selectedFilterType}'.\n`;
        return {
          message: noSlotsMessage,
          slotsFound: false,
          options: noSlotsOptions,
          debugInfo,
          appliedPodologistInfo: appliedPodologistInfo,
          actionRequest: 'perform_search',
          appliedFilterType: selectedFilterType
        };
      }
    }

    // Default state: present time filters and podologist selection
    debugInfo += "Presentando pantalla principal de preferencias (filtros de tiempo y opción de podólogo).\n";
    const timeFilterOptions: Option[] = [
      // { label: "Cualquier momento", action: "findByPreference", metadata: { actionRequest: 'perform_search', selectedPodologistKey: effectivePodologistKey || 'any', selectedFilterType: 'anytime' } }, // Removed
      { label: "Mañanas (ej. 9-12hs)", action: "findByPreference", metadata: { actionRequest: 'perform_search', selectedPodologistKey: effectivePodologistKey || 'any', selectedFilterType: 'morning' } },
      { label: "Tardes (ej. 13-18hs)", action: "findByPreference", metadata: { actionRequest: 'perform_search', selectedPodologistKey: effectivePodologistKey || 'any', selectedFilterType: 'afternoon' } },
      { label: "Próximos 7 días", action: "findByPreference", metadata: { actionRequest: 'perform_search', selectedPodologistKey: effectivePodologistKey || 'any', selectedFilterType: 'next7days' } },
      { label: "15 días en adelante", action: "findByPreference", metadata: { actionRequest: 'perform_search', selectedPodologistKey: effectivePodologistKey || 'any', selectedFilterType: 'from15days' } },
    ];

    const managementOptions: Option[] = [
      {
        label: effectivePodologistKey ? `Cambiar podólogo/a (actual: ${podologistDisplayName})` : "Elegir podólogo/a",
        action: "findByPreference",
        metadata: { actionRequest: 'request_podologist_selection', selectedPodologistKey: effectivePodologistKey || 'any' }
      },
      {
        label: "Buscar próximo turno directo",
        action: "findNext",
        metadata: { podologistKey: effectivePodologistKey || 'any' }
      },
      { label: "Volver al menú principal", action: "goHome" },
    ];

    let message = `Buscando para ${podologistDisplayName}. Elige un filtro de tiempo o ajusta tu preferencia de podólogo/a.`;
    if (!inputPodologistKey && !effectivePodologistKey) { 
        message = "Puedes elegir un filtro de tiempo, seleccionar un/a podólogo/a específico/a, o buscar el próximo turno directo.";
    }


    return {
      message: message,
      slotsFound: false, 
      options: [...timeFilterOptions, ...managementOptions],
      debugInfo,
      appliedPodologistInfo: appliedPodologistInfo,
      actionRequest: undefined, // This is the main preference screen, not a sub-action
    };
  }
);
    
 
      
