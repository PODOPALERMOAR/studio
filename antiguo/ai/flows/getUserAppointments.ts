
'use server';
/**
 * @fileOverview Fetches a user's upcoming confirmed appointments from Firestore.
 *
 * - getUserAppointments - A function that returns a user's upcoming appointments.
 * - GetUserAppointmentsInput - Input for the flow.
 * - GetUserAppointmentsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestoreAdmin } from '@/lib/firebase/admin';
import { format } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TIMEZONE_BA = 'America/Argentina/Buenos_Aires';

const GetUserAppointmentsInputSchema = z.object({
  phoneNumber: z.string().describe("The E.164 formatted phone number of the user to check."),
});
export type GetUserAppointmentsInput = z.infer<typeof GetUserAppointmentsInputSchema>;


const OptionSchema = z.object({
  label: z.string().describe("The text displayed on the button for the user."),
  action: z.string().describe("An identifier for the action this option triggers."),
});

const GetUserAppointmentsOutputSchema = z.object({
  message: z.string().describe("The introductory message from the AI assistant."),
  appointments: z.array(z.string()).optional().describe("An array of strings, each representing an appointment."),
  options: z.array(OptionSchema).optional().describe("An array of choices presented to the user as buttons."),
  error: z.string().optional().describe("Error message if fetching failed."),
});
export type GetUserAppointmentsOutput = z.infer<typeof GetUserAppointmentsOutputSchema>;

export async function getUserAppointments(input: GetUserAppointmentsInput): Promise<GetUserAppointmentsOutput> {
  return getUserAppointmentsFlow(input);
}

const getUserAppointmentsFlow = ai.defineFlow(
  {
    name: 'getUserAppointmentsFlow',
    inputSchema: GetUserAppointmentsInputSchema,
    outputSchema: GetUserAppointmentsOutputSchema,
  },
  async ({ phoneNumber }) => {
    if (!phoneNumber) {
      return {
        message: "No se proporcionó un número de teléfono para buscar turnos.",
        appointments: [],
        error: "Número de teléfono no especificado.",
      };
    }

    try {
      const now = new Date().toISOString();
      const appointmentsRef = firestoreAdmin.collection('confirmedAppointments');
      const q = appointmentsRef
        .where('patientPhoneNumber', '==', phoneNumber)
        .where('appointmentTimestamp', '>=', now)
        .orderBy('appointmentTimestamp', 'asc');

      const querySnapshot = await q.get();

      const options = [
        { label: "Agendar un nuevo turno", action: "userBookNewFromPanel" },
        { label: "Volver al menú principal del panel", action: "panelGoHome" },
      ];
      
      if (querySnapshot.empty) {
        return {
          message: "No encontré turnos próximos agendados. ¿Te gustaría agendar uno nuevo?",
          appointments: [],
          options: options,
        };
      }
      
      const appointmentsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const appointmentDate = new Date(data.appointmentTimestamp);
        const formattedDate = format(appointmentDate, "EEEE, d 'de' MMMM 'a las' HH:mm 'hs'", {
            timeZone: TIMEZONE_BA,
            locale: es
        });
        return `- Turno con ${data.podologistName} el ${formattedDate}.`;
      });

      return {
        message: "¡Claro! Encontré tus siguientes turnos agendados:",
        appointments: appointmentsList,
        options: options,
      };

    } catch (error: any) {
      console.error("[getUserAppointmentsFlow] Error fetching appointments from Firestore:", error);
      return {
        message: "Lo siento, tuve un problema al buscar tus turnos en este momento. Por favor, intenta de nuevo más tarde.",
        appointments: [],
        error: "Error de base de datos al buscar turnos.",
        options: [
           { label: "Intentar de nuevo", action: "panelViewAppointments" },
           { label: "Volver", action: "panelGoHome" },
        ],
      };
    }
  }
);
