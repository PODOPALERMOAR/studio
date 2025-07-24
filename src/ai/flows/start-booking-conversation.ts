'use server';
/**
 * Inicia la conversación de reserva con mensaje de bienvenida y opciones iniciales
 */

import { z } from 'zod';

const OptionSchema = z.object({
  label: z.string().describe("Texto mostrado en el botón para el usuario."),
  action: z.string().describe("Identificador de la acción que dispara esta opción."),
  metadata: z.record(z.string(), z.any()).optional().describe("Datos adicionales asociados con la opción."),
});

const StartBookingConversationOutputSchema = z.object({
  welcomeMessage: z.string().describe("Mensaje inicial de bienvenida del asistente."),
  initialOptions: z.array(OptionSchema).describe("Array de opciones iniciales presentadas al usuario como botones."),
});

export type StartBookingConversationOutput = z.infer<typeof StartBookingConversationOutputSchema>;

export async function startBookingConversation(): Promise<StartBookingConversationOutput> {
  return {
    welcomeMessage: "¡Hola! Soy tu asistente virtual de PODOPALERMO. Estoy aquí para ayudarte a encontrar y reservar tu próximo turno.",
    initialOptions: [
      { 
        label: "Buscar próximo turno disponible", 
        action: "findNext",
        metadata: { podologistKey: 'any' }
      },
      { 
        label: "Elegir un podólogo específico", 
        action: "choosePodologist" 
      },
    ],
  };
}
