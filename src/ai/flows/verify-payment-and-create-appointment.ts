'use server';
/**
 * Verifica un comprobante de pago usando IA y luego crea la cita
 * Si la verificación es exitosa, sube el comprobante a Firebase Storage
 */

import { z } from 'zod';
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
    // Aquí iría la verificación con IA usando Genkit
    // Por ahora simulamos una verificación exitosa
    const mockVerificationResult = {
      isProofValid: true,
      amountDetected: EXPECTED_PAYMENT_AMOUNT,
      dateDetected: currentDateFormatted,
      isAmountCorrect: true,
      isDateRecent: true,
      recipientMatches: true,
      verificationNotes: "Comprobante válido.",
      errorReadingProof: false,
    };

    debugInfo += `Resultado de verificación IA: ${JSON.stringify(mockVerificationResult)}\n`;

    if (mockVerificationResult.errorReadingProof) {
      debugInfo += `IA indicó error leyendo comprobante: ${mockVerificationResult.verificationNotes}\n`;
      return {
        success: false,
        message: `No pudimos leer tu comprobante: ${mockVerificationResult.verificationNotes}`,
        personalizedMessage: `No pudimos leer tu comprobante: ${mockVerificationResult.verificationNotes}. Asegúrate de que la imagen/PDF sea claro y completo.`,
        debugInfo: debugInfo,
      };
    }

    if (!mockVerificationResult.isProofValid) {
      const errorReasons: string[] = [];
      if (!mockVerificationResult.isAmountCorrect) {
        errorReasons.push(`el monto transferido${mockVerificationResult.amountDetected !== null ? ` ($${mockVerificationResult.amountDetected.toLocaleString()})` : ''} no es el esperado`);
      }
      if (!mockVerificationResult.isDateRecent) {
        errorReasons.push(`la fecha del comprobante${mockVerificationResult.dateDetected ? ` (${mockVerificationResult.dateDetected})` : ''} no es válida`);
      }
      if (paymentAccountDetails && mockVerificationResult.recipientMatches === false) {
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
        mainErrorMessage += `: ${mockVerificationResult.verificationNotes}`;
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