
'use server';
/**
 * @fileOverview Verifies a payment proof using AI and then creates an appointment.
 * If verification is successful, uploads the payment proof to Firebase Storage.
 *
 * - verifyPaymentAndCreateAppointment - Handles the payment verification and appointment creation.
 * - VerifyPaymentAndCreateAppointmentInput - Input for the flow.
 * - VerifyPaymentAndCreateAppointmentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createAppointment, type CreateAppointmentInput } from './create-appointment';
import { format } from 'date-fns';
import { getPaymentDetailsForPodologist, type PaymentAccountDetails } from '@/config/paymentDetails';
import { storageAdmin } from '@/lib/firebase/admin'; // Import storageAdmin

const EXPECTED_PAYMENT_AMOUNT = 10000; // ARS

const VerifyPaymentAndCreateAppointmentInputSchema = z.object({
  slotTimestamp: z.string().datetime(),
  slotEventId: z.string(),
  patientFirstName: z.string().min(1),
  patientLastName: z.string().optional(),
  phoneCountryCode: z.string().min(1),
  phoneNumber: z.string().min(1),
  podologistKey: z.string(),
  podologistName: z.string(),
  podologistCalendarId: z.string().min(1),
  bookingReason: z.string().optional(),
  paymentProofDataUri: z.string().describe("The payment proof image or PDF as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type VerifyPaymentAndCreateAppointmentInput = z.infer<typeof VerifyPaymentAndCreateAppointmentInputSchema>;

const CreateAppointmentOutputSchema = z.object({
  success: z.boolean().describe("Indicates if the appointment creation was successful."),
  message: z.string().describe("A general message detailing the outcome of the operation (user-friendly)."),
  createdEventLink: z.string().url().optional().describe("A direct link to the created Google Calendar event, if successful."),
  personalizedMessage: z.string().optional().describe("A personalized closing message for the patient (this should be the primary message on success)."),
  debugInfo: z.string().optional().describe("Debugging information about the process (for internal use, not for UI display)."),
});
export type VerifyPaymentAndCreateAppointmentOutput = z.infer<typeof CreateAppointmentOutputSchema>;


const PaymentVerificationInputSchema = z.object({
  paymentProofDataUri: z.string().describe("The payment proof image or PDF as a data URI."),
  expectedAmount: z.number().describe("The expected payment amount."),
  currentDate: z.string().describe("The current date in YYYY-MM-DD format, for validating the proof's date."),
  accountHolderNameToVerify: z.string().optional().describe("Optional: The expected account holder name to verify against the proof."),
});

const PaymentVerificationOutputSchema = z.object({
  isProofValid: z.boolean().describe("Whether the payment proof is considered valid based on the criteria."),
  amountDetected: z.number().nullable().describe("The payment amount detected in the proof. Null if not detected."),
  dateDetected: z.string().nullable().describe("The date detected on the payment proof (YYYY-MM-DD). Null if not detected."),
  isAmountCorrect: z.boolean().describe("Whether the detected amount matches the expected amount."),
  isDateRecent: z.boolean().describe("Whether the detected date is recent (today or yesterday)."),
  recipientMatches: z.boolean().optional().describe("If accountHolderNameToVerify was provided, indicates if the recipient on the proof matches. Undefined if not determinable."),
  verificationNotes: z.string().describe("Si isProofValid es false, DEBE describir BREVEMENTE y de forma CONCISA en español el/los principal(es) motivo(s) (ej: 'El monto es incorrecto.', 'La fecha no es válida.', 'No se pudo leer la información.'). Si isProofValid es true, puede ser 'Comprobante válido.' o una nota breve y afirmativa. DEBE ESTAR EN ESPAÑOL y ser muy conciso."),
  errorReadingProof: z.boolean().default(false).describe("True if the AI could not read or interpret the proof at all."),
});


const paymentVerificationPrompt = ai.definePrompt({
  name: 'paymentVerificationPrompt',
  input: { schema: PaymentVerificationInputSchema },
  output: { schema: PaymentVerificationOutputSchema },
  prompt: `Eres un asistente experto en analizar comprobantes de transferencia bancaria o de billeteras virtuales (como Mercado Pago) en Argentina.
Analiza la siguiente imagen o documento de comprobante de pago:
{{media url=paymentProofDataUri}}

Tu tarea es verificar los siguientes puntos y responder estrictamente en el formato JSON solicitado:
1.  **Monto Transferido**: Identifica el monto de la transferencia. Debe ser exactamente {{expectedAmount}} ARS.
2.  **Fecha de Transferencia**: Identifica la fecha en que se realizó la transferencia. Compara si esta fecha es igual a la fecha actual ({{currentDate}}) o al día anterior.
3.  **Validez General**: Determina si el documento parece ser un comprobante de pago legítimo.
{{#if accountHolderNameToVerify}}
4.  **Destinatario**: Verifica si el nombre del destinatario en el comprobante coincide (exacta o muy cercanamente) con "{{accountHolderNameToVerify}}". Si no puedes determinar el destinatario, indica esto en verificationNotes y omite el campo recipientMatches o déjalo indefinido/null (tu respuesta JSON debe ser válida según el schema).
{{/if}}

Consideraciones:
- Si no puedes leer el monto o la fecha claramente, indícalo.
- Si el documento no parece un comprobante de pago, márcalo como no válido.
- **Importante: Todas tus notas de verificación y explicaciones (el campo \`verificationNotes\`) DEBEN estar en español.**

Responde con los siguientes campos:
- \`isProofValid\`: \`true\` si el comprobante parece legítimo, el monto es correcto y la fecha es reciente (hoy o ayer). {{#if accountHolderNameToVerify}}Y si el destinatario coincide (si se pudo verificar y \`recipientMatches\` es \`true\`).{{/if}} \`false\` en caso contrario.
- \`amountDetected\`: El monto numérico detectado. Si no se detecta, usa \`null\`.
- \`dateDetected\`: La fecha detectada en formato YYYY-MM-DD. Si no se detecta, usa \`null\`.
- \`isAmountCorrect\`: \`true\` si \`amountDetected\` es igual a {{expectedAmount}}, sino \`false\`.
- \`isDateRecent\`: \`true\` si la \`dateDetected\` es la fecha actual ({{currentDate}}) o el día anterior, sino \`false\`.
{{#if accountHolderNameToVerify}}
- \`recipientMatches\`: \`true\` si el destinatario coincide con "{{accountHolderNameToVerify}}", \`false\` si no coincide. Si no se pudo determinar el destinatario del comprobante, puedes omitir este campo o enviar \`null\` (el schema lo tratará como opcional/undefined).
{{/if}}
- \`verificationNotes\`: Si \`isProofValid\` es \`false\`, DEBE describir BREVEMENTE y de forma CONCISA en español el/los principal(es) motivo(s) (ej: "El monto es incorrecto.", "La fecha no es válida.", "No se pudo leer la información."). Si \`isProofValid\` es \`true\`, puede ser "Comprobante válido." o una nota breve y afirmativa. Este campo DEBE estar en español y ser muy conciso.
- \`errorReadingProof\`: \`true\` si el documento es ilegible o no parece ser un comprobante, sino \`false\`.
`,
  config: {}
});


export async function verifyPaymentAndCreateAppointment(input: VerifyPaymentAndCreateAppointmentInput): Promise<VerifyPaymentAndCreateAppointmentOutput> {
  return verifyPaymentAndCreateAppointmentFlow(input);
}

const verifyPaymentAndCreateAppointmentFlow = ai.defineFlow(
  {
    name: 'verifyPaymentAndCreateAppointmentFlow',
    inputSchema: VerifyPaymentAndCreateAppointmentInputSchema,
    outputSchema: CreateAppointmentOutputSchema,
  },
  async (input) => {
    let debugInfo = `Starting payment verification. Amount: ${EXPECTED_PAYMENT_AMOUNT}. Podologist Key: ${input.podologistKey}\n`;
    const currentDateFormatted = format(new Date(), 'yyyy-MM-dd');

    const paymentAccountDetails: PaymentAccountDetails | undefined = getPaymentDetailsForPodologist(input.podologistKey);
    let paymentDetailsStringForCalendar = "Información de cuenta no disponible.";

    if (paymentAccountDetails) {
      paymentDetailsStringForCalendar = `Cuenta: ${paymentAccountDetails.bankName}, Alias: ${paymentAccountDetails.alias}, Titular: ${paymentAccountDetails.accountHolderName}.`;
      if (paymentAccountDetails.cbu) paymentDetailsStringForCalendar += ` CBU: ${paymentAccountDetails.cbu}.`;
      if (paymentAccountDetails.cvu) paymentDetailsStringForCalendar += ` CVU: ${paymentAccountDetails.cvu}.`;
      if (paymentAccountDetails.cuilCuit) paymentDetailsStringForCalendar += ` CUIT/L: ${paymentAccountDetails.cuilCuit}.`;
    }
    debugInfo += `Payment details for calendar event: ${paymentDetailsStringForCalendar}\n`;

    try {
      debugInfo += `Calling paymentVerificationPrompt with currentDate: ${currentDateFormatted}, expectedAmount: ${EXPECTED_PAYMENT_AMOUNT}, accountHolder: ${paymentAccountDetails?.accountHolderName || 'N/A'}\n`;
      const verificationResponse = await paymentVerificationPrompt({
        paymentProofDataUri: input.paymentProofDataUri,
        expectedAmount: EXPECTED_PAYMENT_AMOUNT,
        currentDate: currentDateFormatted,
        accountHolderNameToVerify: paymentAccountDetails?.accountHolderName,
      });
      
      const verificationResult = verificationResponse.output;
      debugInfo += `AI Verification output (parsed by Zod): ${verificationResult ? JSON.stringify(verificationResult) : 'null/undefined'}\n`;

      if (!verificationResult) {
        debugInfo += "AI verification returned null or undefined output object from prompt response.\n";
        return {
          success: false,
          message: "No pudimos procesar tu comprobante en este momento (respuesta inesperada de IA).",
          personalizedMessage: "Lo siento, hubo un problema al analizar tu comprobante. Por favor, asegúrate de que sea claro e inténtalo de nuevo.",
          debugInfo: debugInfo,
        };
      }
      
      if (verificationResult.errorReadingProof) {
        debugInfo += `AI indicated error reading proof: ${verificationResult.verificationNotes}\n`;
        return {
          success: false,
          message: `No pudimos leer tu comprobante: ${verificationResult.verificationNotes || 'El archivo podría ser ilegible o no ser un comprobante válido.'}`,
          personalizedMessage: `No pudimos leer tu comprobante: ${verificationResult.verificationNotes || 'El archivo podría ser ilegible o no ser un comprobante válido.'}. Asegúrate de que la imagen/PDF sea claro y completo.`,
          debugInfo: debugInfo,
        };
      }

      if (!verificationResult.isProofValid) {
        const errorReasons: string[] = [];
        if (!verificationResult.isAmountCorrect) {
          errorReasons.push(`el monto transferido${verificationResult.amountDetected !== null && verificationResult.amountDetected !== undefined ? ` (${verificationResult.amountDetected.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })})` : ''} no es el esperado para la reserva`);
        }
        if (!verificationResult.isDateRecent) {
          errorReasons.push(`la fecha del comprobante${verificationResult.dateDetected ? ` (${verificationResult.dateDetected})` : ''} no es válida para esta reserva`);
        }
        if (paymentAccountDetails && verificationResult.accountHolderNameToVerify && verificationResult.recipientMatches === false) {
          errorReasons.push(`el destinatario del pago en el comprobante no es el correcto`);
        }
        
        let mainErrorMessage = "La verificación de tu comprobante de pago falló";
        if (errorReasons.length > 0) {
            if (errorReasons.length === 1) {
                mainErrorMessage += ` porque ${errorReasons[0]}.`;
            } else {
                mainErrorMessage += " por los siguientes motivos:\n- " + errorReasons.join("\n- ") + ".";
            }
        } else if (verificationResult.verificationNotes && verificationResult.verificationNotes.trim() !== '' && verificationResult.verificationNotes.toLowerCase() !== "comprobante válido.") {
             mainErrorMessage += `: ${verificationResult.verificationNotes.trim()}.`;
        } else {
            mainErrorMessage += ". Por favor, revisa el comprobante e intenta de nuevo.";
        }
        
        debugInfo += `Payment proof invalid. User message: "${mainErrorMessage}". AI Verification Output: ${JSON.stringify(verificationResult)}.\n`;
        
        return {
          success: false,
          message: mainErrorMessage, 
          personalizedMessage: mainErrorMessage, 
          debugInfo: debugInfo,
        };
      }

      debugInfo += "Comprobante verificado exitosamente por IA. Procediendo a subir comprobante y crear la cita.\n";
      
      let paymentProofStorageUrl: string | undefined = undefined;
      if (input.paymentProofDataUri) {
        try {
          debugInfo += 'Intentando subir comprobante de pago a Firebase Storage.\n';
          const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
          if (!bucketName) {
            throw new Error('El nombre del bucket de Firebase Storage no está configurado (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).');
          }
          const bucket = storageAdmin.bucket(bucketName);

          const matches = input.paymentProofDataUri.match(/^data:(.+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            throw new Error('Formato de Data URI inválido para el comprobante.');
          }
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const extension = mimeType.split('/')[1] || 'bin';
          const uniqueId = Math.random().toString(36).substring(2, 10);
          const fileName = `payment_proofs/appointment_${Date.now()}_${uniqueId}.${extension}`;
          
          const file = bucket.file(fileName);
          await file.save(buffer, {
            metadata: { contentType: mimeType },
            // Consider making it resumable for larger files if needed, though proofs are usually small
          });
          
          // Hacer el archivo públicamente legible para obtener la URL pública.
          // Esto requiere que las reglas de Storage lo permitan o que el bucket sea público.
          await file.makePublic(); 
          paymentProofStorageUrl = file.publicUrl(); // Formato: https://storage.googleapis.com/BUCKET_NAME/FILE_PATH
          debugInfo += `Comprobante subido exitosamente: ${paymentProofStorageUrl}\n`;

        } catch (storageError: any) {
          console.error('Error al subir comprobante a Firebase Storage:', storageError);
          debugInfo += `Error al subir comprobante: ${storageError.message || storageError.toString()}. La cita se creará sin la URL del comprobante.\n`;
          // No detenemos la creación de la cita, pero no habrá URL del comprobante.
          // El usuario ya fue notificado del éxito de la verificación de pago.
          // Se podría registrar este fallo para revisión manual.
        }
      }


      const appointmentInputForCreation: CreateAppointmentInput = {
        slotTimestamp: input.slotTimestamp,
        slotEventId: input.slotEventId,
        patientFirstName: input.patientFirstName,
        patientLastName: input.patientLastName,
        phoneCountryCode: input.phoneCountryCode,
        phoneNumber: input.phoneNumber,
        podologistKey: input.podologistKey,
        podologistName: input.podologistName,
        podologistCalendarId: input.podologistCalendarId,
        bookingReason: input.bookingReason,
        paymentDetailsString: paymentDetailsStringForCalendar,
        paymentProofUrl: paymentProofStorageUrl, // Pasar la URL del comprobante
      };

      const creationResult = await createAppointment(appointmentInputForCreation);

      if (!creationResult) {
        debugInfo += `CRITICAL: The createAppointment flow returned an undefined result.\n`;
        return {
          success: false,
          message: "Ocurrió un error interno al crear la cita (código: CA_UNDEFINED). Por favor, contacta a soporte.",
          personalizedMessage: "Ocurrió un error interno al crear la cita (código: CA_UNDEFINED). Por favor, contacta a soporte.",
          debugInfo: debugInfo
        };
      }

      return {
        ...creationResult,
        debugInfo: `${debugInfo}\n=== Create Appointment Debug Info ===\n${creationResult.debugInfo || 'N/A'}`,
      };

    } catch (error: any) {
      console.error('Error en verifyPaymentAndCreateAppointmentFlow (catch general):', error);
      let errorMessageForDebug = "Unknown error";
      if (error.message) {
        errorMessageForDebug = error.message;
      } else if (typeof error === 'string') {
        errorMessageForDebug = error;
      }
      
      debugInfo += `Error general durante la verificación o creación: ${errorMessageForDebug}. (Full error object: ${String(error)})`;
      if (error.stack) {
        debugInfo += `\nStack: ${error.stack}`;
      }
      if ((error as any).details) { 
        try {
          debugInfo += `\nError Details (JSON): ${JSON.stringify((error as any).details)}`;
        } catch (stringifyError) {
          debugInfo += `\nError Details (could not stringify): ${String((error as any).details)}`;
        }
      }
      
      return {
        success: false,
        message: "Ocurrió un error inesperado al procesar tu reserva.",
        personalizedMessage: "Lo siento, un error inesperado impidió completar tu reserva. Por favor, contacta a Cecilia para que pueda ayudarte.",
        debugInfo: debugInfo,
      };
    }
  }
);
    
    
