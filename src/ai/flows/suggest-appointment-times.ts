'use server';

/**
 * @fileOverview Suggests available appointment times based on doctor availability and appointment duration.
 *
 * - suggestAppointmentTimes - A function that suggests available appointment times.
 * - SuggestAppointmentTimesInput - The input type for the suggestAppointmentTimes function.
 * - SuggestAppointmentTimesOutput - The return type for the suggestAppointmentTimes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAppointmentTimesInputSchema = z.object({
  doctorId: z.string().describe('The ID of the doctor.'),
  appointmentDurationMinutes: z
    .number()
    .describe('The duration of the appointment in minutes.'),
  date: z.string().describe('The date for which to suggest appointment times (YYYY-MM-DD).'),
});
export type SuggestAppointmentTimesInput = z.infer<
  typeof SuggestAppointmentTimesInputSchema
>;

const SuggestAppointmentTimesOutputSchema = z.object({
  availableTimes: z
    .array(z.string())
    .describe('An array of available appointment times (HH:mm).'),
});
export type SuggestAppointmentTimesOutput = z.infer<
  typeof SuggestAppointmentTimesOutputSchema
>;

export async function suggestAppointmentTimes(
  input: SuggestAppointmentTimesInput
): Promise<SuggestAppointmentTimesOutput> {
  return suggestAppointmentTimesFlow(input);
}

const suggestAppointmentTimesPrompt = ai.definePrompt({
  name: 'suggestAppointmentTimesPrompt',
  input: {schema: SuggestAppointmentTimesInputSchema},
  output: {schema: SuggestAppointmentTimesOutputSchema},
  prompt: `Suggest available appointment times for doctor with ID {{doctorId}} on {{date}} for an appointment duration of {{appointmentDurationMinutes}} minutes. Return the available times as an array of HH:mm times. Consider that the doctor works from 9:00 to 17:00 and each time should be available. Also the time slots must be at least 30 minutes apart from each other.`,
});

const suggestAppointmentTimesFlow = ai.defineFlow(
  {
    name: 'suggestAppointmentTimesFlow',
    inputSchema: SuggestAppointmentTimesInputSchema,
    outputSchema: SuggestAppointmentTimesOutputSchema,
  },
  async input => {
    const {output} = await suggestAppointmentTimesPrompt(input);
    return output!;
  }
);
