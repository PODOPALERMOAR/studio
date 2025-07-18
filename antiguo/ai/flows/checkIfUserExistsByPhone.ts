
'use server';
/**
 * @fileOverview Checks if a user exists in Firestore based on their phone number
 * using the Firebase Admin SDK for server-side execution. Also returns first name if found.
 *
 * - checkIfUserExistsByPhone - A function that checks user existence.
 * - CheckIfUserExistsByPhoneInput - Input for the flow.
 * - CheckIfUserExistsByPhoneOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestoreAdmin } from '@/lib/firebase/admin';

const CheckIfUserExistsByPhoneInputSchema = z.object({
  phoneNumber: z.string().describe("The E.164 formatted phone number to check (e.g., '+5491123456789')."),
});
export type CheckIfUserExistsByPhoneInput = z.infer<typeof CheckIfUserExistsByPhoneInputSchema>;

const CheckIfUserExistsByPhoneOutputSchema = z.object({
  exists: z.boolean().describe("True if a user exists with this phone number, false otherwise."),
  firstName: z.string().optional().describe("The first name of the user, if they exist."),
});
export type CheckIfUserExistsByPhoneOutput = z.infer<typeof CheckIfUserExistsByPhoneOutputSchema>;

export async function checkIfUserExistsByPhone(input: CheckIfUserExistsByPhoneInput): Promise<CheckIfUserExistsByPhoneOutput> {
  return checkIfUserExistsByPhoneFlow(input);
}

const checkIfUserExistsByPhoneFlow = ai.defineFlow(
  {
    name: 'checkIfUserExistsByPhoneFlow',
    inputSchema: CheckIfUserExistsByPhoneInputSchema,
    outputSchema: CheckIfUserExistsByPhoneOutputSchema,
  },
  async ({ phoneNumber }) => {
    if (!phoneNumber) {
      console.warn("[checkIfUserExistsByPhoneFlow] Received empty or undefined phoneNumber.");
      return { exists: false };
    }
    try {
      const usersRef = firestoreAdmin.collection('users');
      const q = usersRef.where('phoneNumber', '==', phoneNumber).limit(1);
      const querySnapshot = await q.get();

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const firstName = userData.firstName || undefined;
        console.log(`[checkIfUserExistsByPhoneFlow] User found for phone number: ${phoneNumber}. Name: ${firstName}`);
        return { exists: true, firstName: firstName };
      } else {
        console.log(`[checkIfUserExistsByPhoneFlow] No user found for phone number: ${phoneNumber}`);
        return { exists: false };
      }
    } catch (error: any) {
      console.error(`[checkIfUserExistsByPhoneFlow] Error checking user existence for phone ${phoneNumber}:`, error);
      // In case of a database error, we should probably assume the user doesn't exist
      // to avoid blocking a potential registration, but we log the error.
      return { exists: false };
    }
  }
);
