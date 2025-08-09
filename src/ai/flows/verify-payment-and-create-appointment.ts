'use server';
/**
 * Verifica un comprobante de pago usando IA y luego crea la cita
 * Si la verificación es exitosa, sube el comprobante a Firebase Storage
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { createAppointment, type CreateAppointmentInput } from './create-appointment';
import { format } from 'date-fns';
import { getPaymentDetailsForPodologist, EXPECTED_PAYMENT_AMOUNT, type PaymentAccountDetails } from '@/config/paymentDetails';

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
  paymentProofDataUri: z.string().describe("Comprobante de pago como data URI. Formato: 'data:<mimetype>;base64,<encoded_data>'."),
});

export type VerifyPaymentAndCreateAppointmentInput = z.infer<typeof VerifyPaymentAndCreateAppointmentInputSchema>;

const VerifyPaymentAndCreateAppointmentOutputSchema = z.object({
  success: z.boolean().describe("Indica si la creación de la cita fue exitosa."),
  message: z.string().describe("Mensaje general sobre el resultado de la operación."),
  createdEventLink: z.string().url().optional().describe("Link directo al evento creado en Google Calendar."),
  personalizedMessage: z.string().optional().describe("Mensaje personalizado de cierre para el paciente."),
  debugInfo: z.string().optional().describe("Información de debug del proceso."),
});

export type VerifyPaymentAndCreateAppointmentOutput = z.infer<typeof VerifyPaymentAndCreateAppointmentOutputSchema>;

const PaymentVerificationOutputSchema = z.object({
  isProofValid: z.boolean().describe("Si el comprobante es válido según los criterios."),
  amountDetected: z.number().nullable().describe("Monto detectado en el comprobante. Null si no se detecta."),
  dateDetected: z.string().nullable().describe("Fecha detectada en el comprobante (YYYY-MM-DD). Null si no se detecta."),
  isAmountCorrect: z.boolean().describe("Si el monto detectado coincide con el esperado."),
  isDateRecent: z.boolean().describe("Si la fecha detectada es reciente (hoy o ayer)."),
  recipientMatches: z.boolean().optional().describe("Si el destinatario coincide con el esperado."),
  verificationNotes: z.string().describe("Notas de verificación en español. Si isProofValid es false, debe describir brevemente el motivo."),
  errorReadingProof: z.boolean().default(false).describe("True si la IA no pudo leer o interpretar el comprobante."),
});

const paymentVerificationPrompt = ai.definePrompt({
    name: "paymentVerificationPrompt",
    input: { schema: z.object({ 
        expectedAmount: z.number(), 
        currentDate: z.string(), 
        accountHolderNameToVerify: z.string(),
        paymentProof: z.string() 
    }) },
    output: { schema: PaymentVerificationOutputSchema },
    prompt: `Sos un asistente experto en analizar comprobantes de transferencia bancaria de Argentina. Tu única tarea es validar la imagen adjunta y extraer la información clave.

Validá el siguiente comprobante de pago:
{{media url=paymentProof}}

Criterios de validación:
1.  **Monto Exacto**: El monto debe ser exactamente {{expectedAmount}} ARS.
2.  **Fecha Reciente**: La fecha debe ser hoy ({{currentDate}}) o el día anterior.
3.  **Destinatario Correcto**: El nombre del destinatario debe ser "{{accountHolderNameToVerify}}". Buscá variaciones o aproximaciones del nombre.
4.  **Legitimidad**: El comprobante debe parecer real y no una captura de pantalla editada o un texto simple.

Respondé en el formato JSON especificado. Si no podés leer el comprobante o está incompleto, marcá 'errorReadingProof' como true y explicá el problema en 'verificationNotes'. Si el comprobante es inválido por otra razón, explicá por qué en 'verificationNotes'.`
});

export async function verifyPaymentAndCreateAppointment(input: VerifyPaymentAndCreateAppointmentInput): Promise<VerifyPaymentAndCreateAppointmentOutput> {
  let debugInfo = `Iniciando verificación de pago. Monto esperado: ${EXPECTED_PAYMENT_AMOUNT}. Podólogo: ${input.podologistKey}\n`;
  const currentDateFormatted = format(new Date(), 'yyyy-MM-dd');

  const paymentAccountDetails = getPaymentDetailsForPodologist(input.podologistKey);
  let paymentDetailsStringForCalendar = "Información de cuenta no disponible.";

  if (paymentAccountDetails) {
    paymentDetailsStringForCalendar = `Cuenta: ${paymentAccountDetails.bankName}, Alias: ${paymentAccountDetails.alias}, Titular: ${paymentAccountDetails.accountHolderName}.`;
    if (paymentAccountDetails.cbu) paymentDetailsStringForCalendar += ` CBU: ${paymentAccountDetails.cbu}.`;
    if (paymentAccountDetails.cvu) paymentDetailsStringForCalendar += ` CVU: ${paymentAccountDetails.cvu}.`;
    if (paymentAccountDetails.cuilCuit) paymentDetailsStringForCalendar += ` CUIT/L: ${paymentAccountDetails.cuilCuit}.`;
  }
  
  debugInfo += `Detalles de pago para evento: ${paymentDetailsStringForCalendar}\n`;

  try {
    const { output: verificationResult } = await paymentVerificationPrompt({
        expectedAmount: EXPECTED_PAYMENT_AMOUNT,
        currentDate: currentDateFormatted,
        accountHolderNameToVerify: paymentAccountDetails?.accountHolderName || "Nombre No Encontrado",
        paymentProof: input.paymentProofDataUri
    });

    if (!verificationResult) {
        throw new Error("La verificación de IA no devolvió un resultado.");
    }

    debugInfo += `Resultado de verificación IA: ${JSON.stringify(verificationResult)}\n`;

    if (verificationResult.errorReadingProof) {
      debugInfo += `IA indicó error leyendo comprobante: ${verificationResult.verificationNotes}\n`;
      return {
        success: false,
        message: `No pudimos leer tu comprobante: ${verificationResult.verificationNotes}`,
        personalizedMessage: `No pudimos leer tu comprobante: ${verificationResult.verificationNotes}. Asegúrate de que la imagen/PDF sea claro y completo.`,
        debugInfo: debugInfo,
      };
    }

    if (!verificationResult.isProofValid) {
      const errorReasons: string[] = [];
      if (!verificationResult.isAmountCorrect) {
        errorReasons.push(`el monto transferido${verificationResult.amountDetected !== null ? ` ($${verificationResult.amountDetected.toLocaleString()})` : ''} no es el esperado`);
      }
      if (!verificationResult.isDateRecent) {
        errorReasons.push(`la fecha del comprobante${verificationResult.dateDetected ? ` (${verificationResult.dateDetected})` : ''} no es válida`);
      }
      if (paymentAccountDetails && verificationResult.recipientMatches === false) {
        errorReasons.push(`el destinatario del pago no es el correcto`);
      }
      
      let mainErrorMessage = "La verificación de tu comprobante de pago falló";
      if (errorReasons.length > 0) {
        if (errorReasons.length === 1) {
          mainErrorMessage += ` porque ${errorReasons[0]}.`;
        } else {
          mainErrorMessage += " por los siguientes motivos:\n- " + errorReasons.join("\n- ") + ".";
        }
      } else {
        mainErrorMessage += `: ${verificationResult.verificationNotes}`;
      }
      
      debugInfo += `Comprobante inválido. Mensaje: "${mainErrorMessage}"\n`;
      
      return {
        success: false,
        message: mainErrorMessage,
        personalizedMessage: mainErrorMessage,
        debugInfo: debugInfo,
      };
    }

    debugInfo += "Comprobante verificado exitosamente. Procediendo a crear la cita.\n";
    
    // Aquí iría la subida a Firebase Storage
    let paymentProofStorageUrl: string | undefined = undefined;
    // Por ahora simulamos una URL
    paymentProofStorageUrl = `https://storage.googleapis.com/podopalermo-bucket/payment_proofs/proof_${Date.now()}.jpg`;
    debugInfo += `Comprobante subido (simulado): ${paymentProofStorageUrl}\n`;

    // Crear la cita
    const appointmentInput: CreateAppointmentInput = {
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
      paymentProofUrl: paymentProofStorageUrl,
    };

    const creationResult = await createAppointment(appointmentInput);

    if (!creationResult) {
      debugInfo += `CRÍTICO: createAppointment retornó undefined\n`;
      return {
        success: false,
        message: "Ocurrió un error interno al crear la cita. Por favor, contacta a soporte.",
        personalizedMessage: "Ocurrió un error interno al crear la cita. Por favor, contacta a soporte.",
        debugInfo: debugInfo
      };
    }

    return {
      ...creationResult,
      debugInfo: `${debugInfo}\n=== Debug de Create Appointment ===\n${creationResult.debugInfo || 'N/A'}`,
    };

  } catch (error: any) {
    console.error('Error en verifyPaymentAndCreateAppointment:', error);
    let errorMessage = "Unknown error";
    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    debugInfo += `Error general durante verificación o creación: ${errorMessage}\n`;
    
    return {
      success: false,
      message: "Ocurrió un error inesperado al procesar tu reserva.",
      personalizedMessage: "Lo siento, un error inesperado impidió completar tu reserva. Por favor, contacta a Cecilia para que pueda ayudarte.",
      debugInfo: debugInfo,
    };
  }
}
