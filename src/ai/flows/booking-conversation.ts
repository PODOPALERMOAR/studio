/**
 * Sistema de conversación inteligente para reservas de PODOPALERMO
 * Integra con Google Calendar y verificación de pagos con IA
 */

import { startBookingConversation } from './start-booking-conversation';
import { findNextAvailableSlot } from './find-next-available-slot';
import { verifyPaymentAndCreateAppointment } from './verify-payment-and-create-appointment';
import { getActivePodologists } from '@/config/podologists';
import { getPaymentDetailsForPodologist, EXPECTED_PAYMENT_AMOUNT, CECILIA_WHATSAPP_NUMBER } from '@/config/paymentDetails';

export interface BookingConversationInput {
  action: string;
  message?: string;
  metadata?: Record<string, any>;
  userInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    countryCode?: string;
    reason?: string;
  };
  paymentProof?: string; // Data URI del comprobante
}

export interface BookingConversationOutput {
  response: string;
  options?: Array<{
    label: string;
    action: string;
    metadata?: Record<string, any>;
  }>;
  needsInput?: boolean;
  inputType?: 'text' | 'file';
  inputPlaceholder?: string;
  debugInfo?: string;
}

export async function bookingConversation(input: BookingConversationInput): Promise<BookingConversationOutput> {
  const { action, metadata, userInfo, paymentProof } = input;
  
  try {
    switch (action) {
      case 'start':
      case 'goHome':
        const welcomeResult = await startBookingConversation();
        return {
          response: welcomeResult.welcomeMessage,
          options: welcomeResult.initialOptions,
        };

      case 'choosePodologist':
        const activePodologists = getActivePodologists();
        return {
          response: "¿Con qué podólogo te gustaría agendar tu turno?",
          options: [
            ...activePodologists.map(p => ({
              label: `${p.name}${p.specialties ? ` - ${p.specialties[0]}` : ''}`,
              action: 'findNext',
              metadata: { podologistKey: p.key }
            })),
            { label: "Cualquier podólogo disponible", action: 'findNext', metadata: { podologistKey: 'any' } },
            { label: "Volver al menú", action: 'goHome' }
          ],
        };

      case 'findNext':
        const slotResult = await findNextAvailableSlot({
          podologistKey: metadata?.podologistKey,
          previousSlotTimestamp: metadata?.previousSlotTimestamp,
        });
        
        return {
          response: slotResult.message,
          options: slotResult.options,
          debugInfo: slotResult.debugInfo,
        };

      case 'confirmSlot':
        if (!metadata?.slotId || !metadata?.slotTimestamp || !metadata?.podologistKey) {
          return {
            response: "Error: Información del slot incompleta. Por favor, selecciona un turno nuevamente.",
            options: [{ label: "Buscar turnos", action: 'findNext', metadata: { podologistKey: 'any' } }],
          };
        }

        return {
          response: "¡Perfecto! Para confirmar tu turno, necesito algunos datos. Empecemos con tu nombre:",
          needsInput: true,
          inputType: 'text',
          inputPlaceholder: 'Escribe tu nombre completo...',
          options: [
            { 
              label: "Continuar con datos", 
              action: 'collectUserInfo', 
              metadata: { 
                ...metadata,
                step: 'firstName' 
              } 
            }
          ],
        };

      case 'collectUserInfo':
        return handleUserInfoCollection(input);

      case 'showPaymentInfo':
        return handlePaymentInfo(input);

      case 'verifyPayment':
        if (!paymentProof) {
          return {
            response: "Por favor, sube tu comprobante de pago para verificarlo.",
            needsInput: true,
            inputType: 'file',
            inputPlaceholder: 'Selecciona tu comprobante de pago...',
          };
        }

        return await handlePaymentVerification(input);

      case 'contactCecilia':
        return {
          response: `Para contactar directamente con Cecilia, puedes escribirle por WhatsApp al ${CECILIA_WHATSAPP_NUMBER}. Ella te ayudará con cualquier consulta o problema.`,
          options: [
            { label: "Empezar de nuevo", action: 'start' }
          ],
        };

      default:
        return {
          response: "No entendí esa acción. ¿Te gustaría empezar de nuevo?",
          options: [{ label: "Empezar de nuevo", action: 'start' }],
        };
    }
  } catch (error: any) {
    console.error('Error en bookingConversation:', error);
    return {
      response: "Lo siento, ocurrió un error inesperado. ¿Te gustaría intentar de nuevo?",
      options: [
        { label: "Intentar de nuevo", action: 'start' },
        { label: `Contactar a Cecilia`, action: 'contactCecilia' }
      ],
      debugInfo: error.message,
    };
  }
}

function handleUserInfoCollection(input: BookingConversationInput): BookingConversationOutput {
  const { metadata, userInfo, message } = input;
  const step = metadata?.step || 'firstName';

  switch (step) {
    case 'firstName':
      if (!message || message.trim().length < 2) {
        return {
          response: "Por favor, ingresa un nombre válido:",
          needsInput: true,
          inputType: 'text',
          inputPlaceholder: 'Tu nombre completo...',
        };
      }

      const nameParts = message.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      return {
        response: `Gracias ${firstName}. Ahora necesito tu número de teléfono (incluye el código de país, ej: +54911234567):`,
        needsInput: true,
        inputType: 'text',
        inputPlaceholder: '+54911234567',
        options: [
          {
            label: "Continuar",
            action: 'collectUserInfo',
            metadata: {
              ...metadata,
              step: 'phone',
              firstName,
              lastName: lastName || undefined,
            }
          }
        ],
      };

    case 'phone':
      if (!message || !message.match(/^\+\d{10,15}$/)) {
        return {
          response: "Por favor, ingresa un número de teléfono válido con código de país (ej: +54911234567):",
          needsInput: true,
          inputType: 'text',
          inputPlaceholder: '+54911234567',
        };
      }

      const phoneMatch = message.match(/^\+(\d{1,4})(.+)$/);
      const countryCode = phoneMatch?.[1] || '54';
      const phoneNumber = phoneMatch?.[2] || message.replace(/^\+/, '');

      return {
        response: `Perfecto ${metadata?.firstName}. ¿Hay algún motivo específico para tu consulta? (opcional)`,
        needsInput: true,
        inputType: 'text',
        inputPlaceholder: 'Ej: dolor en el talón, uña encarnada, etc. (opcional)',
        options: [
          {
            label: "Continuar",
            action: 'collectUserInfo',
            metadata: {
              ...metadata,
              step: 'reason',
              phoneNumber,
              countryCode,
            }
          },
          {
            label: "Omitir motivo",
            action: 'showPaymentInfo',
            metadata: {
              ...metadata,
              phoneNumber,
              countryCode,
              reason: undefined,
            }
          }
        ],
      };

    case 'reason':
      return {
        response: "¡Excelente! Ahora necesito que realices el pago para confirmar tu turno.",
        options: [
          {
            label: "Ver datos de pago",
            action: 'showPaymentInfo',
            metadata: {
              ...metadata,
              reason: message?.trim() || undefined,
            }
          }
        ],
      };

    default:
      return {
        response: "Error en el flujo de recolección de datos. Empecemos de nuevo.",
        options: [{ label: "Empezar de nuevo", action: 'start' }],
      };
  }
}

function handlePaymentInfo(input: BookingConversationInput): BookingConversationOutput {
  const { metadata } = input;
  
  if (!metadata?.podologistKey) {
    return {
      response: "Error: Información del podólogo no encontrada. Por favor, selecciona un turno nuevamente.",
      options: [{ label: "Buscar turnos", action: 'findNext', metadata: { podologistKey: 'any' } }],
    };
  }

  const paymentDetails = getPaymentDetailsForPodologist(metadata.podologistKey);
  
  if (!paymentDetails) {
    return {
      response: "Error: No se encontraron datos de pago para este podólogo. Por favor, contacta a Cecilia.",
      options: [{ label: `Contactar a Cecilia`, action: 'contactCecilia' }],
    };
  }

  let paymentMessage = `💰 **Datos para transferencia**\n\n`;
  paymentMessage += `**Monto:** $${EXPECTED_PAYMENT_AMOUNT.toLocaleString()}\n`;
  paymentMessage += `**Banco:** ${paymentDetails.bankName}\n`;
  paymentMessage += `**Titular:** ${paymentDetails.accountHolderName}\n`;
  paymentMessage += `**Alias:** ${paymentDetails.alias}\n`;
  
  if (paymentDetails.cbu) {
    paymentMessage += `**CBU:** ${paymentDetails.cbu}\n`;
  }
  if (paymentDetails.cvu) {
    paymentMessage += `**CVU:** ${paymentDetails.cvu}\n`;
  }
  if (paymentDetails.cuilCuit) {
    paymentMessage += `**CUIT/L:** ${paymentDetails.cuilCuit}\n`;
  }
  
  paymentMessage += `\n📱 Una vez realizada la transferencia, sube tu comprobante para verificar el pago automáticamente.`;

  return {
    response: paymentMessage,
    options: [
      {
        label: "Subir comprobante",
        action: 'verifyPayment',
        metadata: metadata
      },
      {
        label: "Volver atrás",
        action: 'confirmSlot',
        metadata: {
          slotId: metadata?.slotId,
          slotTimestamp: metadata?.slotTimestamp,
          podologistKey: metadata?.podologistKey,
          podologistName: metadata?.podologistName,
          podologistCalendarId: metadata?.podologistCalendarId,
        }
      }
    ],
    needsInput: true,
    inputType: 'file',
    inputPlaceholder: 'Selecciona tu comprobante de pago...',
  };
}

async function handlePaymentVerification(input: BookingConversationInput): Promise<BookingConversationOutput> {
  const { metadata, paymentProof } = input;
  
  if (!paymentProof) {
    return {
      response: "No se recibió el comprobante. Por favor, sube tu comprobante de pago:",
      needsInput: true,
      inputType: 'file',
      inputPlaceholder: 'Selecciona tu comprobante de pago...',
    };
  }

  if (!metadata?.slotId || !metadata?.firstName || !metadata?.phoneNumber) {
    return {
      response: "Error: Información incompleta para crear la cita. Por favor, empezar de nuevo.",
      options: [{ label: "Empezar de nuevo", action: 'start' }],
    };
  }

  try {
    const verificationResult = await verifyPaymentAndCreateAppointment({
      slotTimestamp: metadata.slotTimestamp,
      slotEventId: metadata.slotId,
      patientFirstName: metadata.firstName,
      patientLastName: metadata.lastName,
      phoneCountryCode: metadata.countryCode || '54',
      phoneNumber: metadata.phoneNumber,
      podologistKey: metadata.podologistKey,
      podologistName: metadata.podologistName,
      podologistCalendarId: metadata.podologistCalendarId,
      bookingReason: metadata.reason,
      paymentProofDataUri: paymentProof,
    });

    if (verificationResult.success) {
      return {
        response: verificationResult.personalizedMessage || verificationResult.message,
        options: [
          { label: "Agendar otro turno", action: 'start' },
          { label: `Contactar a Cecilia`, action: 'contactCecilia' }
        ],
        debugInfo: verificationResult.debugInfo,
      };
    } else {
      return {
        response: verificationResult.personalizedMessage || verificationResult.message,
        options: [
          {
            label: "Subir otro comprobante",
            action: 'verifyPayment',
            metadata: metadata
          },
          { label: `Contactar a Cecilia`, action: 'contactCecilia' },
          { label: "Empezar de nuevo", action: 'start' }
        ],
        debugInfo: verificationResult.debugInfo,
      };
    }
  } catch (error: any) {
    return {
      response: "Error verificando el pago. Por favor, intenta de nuevo o contacta a Cecilia.",
      options: [
        {
          label: "Intentar de nuevo",
          action: 'verifyPayment',
          metadata: metadata
        },
        { label: `Contactar a Cecilia`, action: 'contactCecilia' }
      ],
      debugInfo: error.message,
    };
  }
}