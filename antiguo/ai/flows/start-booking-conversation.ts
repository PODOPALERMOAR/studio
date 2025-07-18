
'use server';
/**
 * @fileOverview Initiates the booking conversation with a welcome message and initial options.
 *
 * - startBookingConversation - A function that returns the initial state for the booking chat.
 * - StartBookingConversationOutput - The return type for the startBookingConversation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptionSchema = z.object({
  label: z.string().describe("The text displayed on the button for the user."),
  action: z.string().describe("An identifier for the action this option triggers."),
});

const StartBookingConversationOutputSchema = z.object({
  welcomeMessage: z.string().describe("The initial welcome message from the AI assistant."),
  initialOptions: z.array(OptionSchema).describe("An array of initial choices представленные to the user as buttons."),
});
export type StartBookingConversationOutput = z.infer<typeof StartBookingConversationOutputSchema>;

// This is the exported function the frontend will call.
export async function startBookingConversation(): Promise<StartBookingConversationOutput> {
  return startBookingConversationFlow({}); // No input needed for this initial flow
}

const startBookingConversationFlow = ai.defineFlow(
  {
    name: 'startBookingConversationFlow',
    inputSchema: z.object({}).optional(), // No specific input needed for this flow yet
    outputSchema: StartBookingConversationOutputSchema,
  },
  async () => {
    // The welcome message could be dynamic or personalized in a real scenario.
    return {
      welcomeMessage: "¡Hola! Soy tu asistente virtual de PODOPALERMO. Estoy aquí para ayudarte a encontrar y reservar tu próximo turno. ¿Qué te gustaría hacer?",
      initialOptions: [
        { label: "Buscar próximo turno disponible", action: "findNext" },
        { label: "Buscar un turno por mis preferencias", action: "findByPreference" },
      ],
    };
  }
);
