'use server';
/**
 * Crea una nueva cita en Google Calendar y elimina el slot "Ocupar" original
 * Genera mensaje personalizado para el paciente y envía notificación por email
 */

import { z } from 'zod';
import { google } from 'googleapis';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { isSameDay, addDays, format } from 'date-fns';
import { CECILIA_WHATSAPP_NUMBER } from '@/config/paymentDetails';
import { mockCreateAppointment } from '@/lib/mock-calendar-service';

const CreateAppointmentInputSchema = z.object({
  slotTimestamp: z.string().datetime().describe("Timestamp ISO UTC del slot 'Ocupar' elegido."),
  slotEventId: z.string().describe("ID del evento 'Ocupar' en Google Calendar a eliminar/modificar."),
  patientFirstName: z.string().min(1).describe("Nombre del paciente."),
  patientLastName: z.string().optional().describe("Apellido del paciente."),
  phoneCountryCode: z.string().min(1).describe("Código de país del teléfono (ej: '54' para Argentina)."),
  phoneNumber: z.string().min(1).describe("Número de teléfono del paciente."),
  podologistKey: z.string().describe("Clave del podólogo para esta cita."),
  podologistName: z.string().describe("Nombre del podólogo para esta cita."),
  podologistCalendarId: z.string().min(1).describe("ID del calendario de Google del podólogo."),
  bookingReason: z.string().optional().describe("Motivo opcional de la consulta."),
  paymentDetailsString: z.string().optional().describe("Resumen de detalles de cuenta de pago."),
  paymentProofUrl: z.string().url().optional().describe("URL opcional del comprobante de pago en Firebase Storage."),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentInputSchema>;

const CreateAppointmentOutputSchema = z.object({
  success: z.boolean().describe("Indica si la creación de la cita fue exitosa."),
  message: z.string().describe("Mensaje general sobre el resultado de la operación."),
  createdEventLink: z.string().url().optional().describe("Link directo al evento creado en Google Calendar."),
  personalizedMessage: z.string().optional().describe("Mensaje personalizado de cierre para el paciente."),
  debugInfo: z.string().optional().describe("Información de debug del proceso."),
});

export type CreateAppointmentOutput = z.infer<typeof CreateAppointmentOutputSchema>;

function generateSlotUnavailableErrorOutput(debugInfoToAdd: string, existingDebugInfo: string): CreateAppointmentOutput {
  const errorMessage = "¡No te preocupes! Parece que el turno que seleccionaste justo acaba de ser tomado o modificado. Para asegurar tu cita, Cecilia lo gestionará contigo por WhatsApp. Por favor, busca el botón para contactarla en el chat.";
  return {
    success: false,
    message: errorMessage,
    personalizedMessage: errorMessage,
    debugInfo: existingDebugInfo + debugInfoToAdd,
  };
}

export async function createAppointment(input: CreateAppointmentInput): Promise<CreateAppointmentOutput> {
  let debugInfo = `Iniciando createAppointment. Input: ${JSON.stringify(input)}\n`;

  if (!input.podologistCalendarId) {
    debugInfo += "CRÍTICO: podologistCalendarId no proporcionado\n";
    return {
      success: false,
      message: "Error de configuración interna. Por favor, contacta a soporte.",
      personalizedMessage: "Hubo un problema de configuración y no pudimos agendar tu turno. Por favor, intenta más tarde o contacta a Cecilia.",
      debugInfo: debugInfo
    };
  }
  
  try {
    // En desarrollo, usar datos simulados para evitar errores de autenticación
    if (process.env.NODE_ENV !== 'production') {
      debugInfo += "Usando servicio simulado para desarrollo\n";
      
      const mockResult = await mockCreateAppointment(
        input.slotEventId,
        `${input.patientFirstName} ${input.patientLastName || ''}`.trim(),
        `+${input.phoneCountryCode}${input.phoneNumber}`,
        input.bookingReason
      );
      
      if (!mockResult.success) {
        return {
          success: false,
          message: "Error simulado: No se pudo crear la cita",
          personalizedMessage: "Lo sentimos, hubo un problema al crear tu cita. Por favor, intenta de nuevo.",
          debugInfo: debugInfo + "Error simulado en desarrollo\n"
        };
      }
      
      // Generar mensaje personalizado
      const appointmentStartTime = new Date(input.slotTimestamp);
      const TIMEZONE_BA = 'America/Argentina/Buenos_Aires';
      const formattedDateTime = formatInTimeZone(
        appointmentStartTime, 
        TIMEZONE_BA, 
        "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", 
        { locale: es }
      );
      
      const patientFullName = `${input.patientFirstName}${input.patientLastName ? ' ' + input.patientLastName : ''}`;
      const personalizedMessage = `${patientFullName}, ¡tu turno con ${input.podologistName} para el ${formattedDateTime} está confirmado! Te esperamos en nuestro consultorio en Av. Sta. Fe 3288, Planta Baja "C" (C1425, CABA).`;
      
      return {
        success: true,
        message: `¡Turno confirmado para ${patientFullName} con ${input.podologistName}!`,
        personalizedMessage,
        debugInfo: debugInfo + "Cita creada con éxito en modo desarrollo\n"
      };
    }
    
    // Autenticación con Google Calendar (solo en producción)
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    debugInfo += "Cliente de autenticación y calendario obtenidos\n";

    // Revalidar que el slot "Ocupar" original sigue disponible
    debugInfo += `Revalidando slot 'Ocupar' original (ID: ${input.slotEventId}) en calendario ${input.podologistCalendarId}\n`;
    
    try {
      const originalSlotEvent = await calendar.events.get({
        calendarId: input.podologistCalendarId,
        eventId: input.slotEventId,
      });

      if (
        !originalSlotEvent.data ||
        originalSlotEvent.data.status === 'cancelled' ||
        (originalSlotEvent.data.summary && originalSlotEvent.data.summary.trim().toLowerCase() !== 'ocupar')
      ) {
        const reason = !originalSlotEvent.data ? "no data" : 
                     originalSlotEvent.data.status === 'cancelled' ? "status cancelled" : 
                     "summary not 'ocupar'";
        debugInfo += `El slot 'Ocupar' original ya no está disponible (Razón: ${reason})\n`;
        return generateSlotUnavailableErrorOutput(`Slot ${input.slotEventId} no válido (razón: ${reason})\n`, debugInfo);
      }
      
      debugInfo += `Slot 'Ocupar' original todavía disponible y válido\n`;
    } catch (getErr: any) {
      debugInfo += `Error al obtener el slot 'Ocupar' original: ${getErr.message || getErr.toString()}\n`;
      return generateSlotUnavailableErrorOutput(`Fallo al obtener/validar slot ${input.slotEventId}\n`, debugInfo);
    }

    // Preparar datos de la cita
    const appointmentStartTime = new Date(input.slotTimestamp);
    const appointmentEndTime = new Date(appointmentStartTime.getTime() + 60 * 60 * 1000); // 1 hora

    const patientFullName = `${input.patientFirstName}${input.patientLastName ? ' ' + input.patientLastName : ''}`;
    const cleanedPhoneNumber = input.phoneNumber.replace(/[\s-]/g, '');
    const cleanedCountryCode = input.phoneCountryCode.replace(/\+/g, '');
    const fullE164PhoneNumber = `+${cleanedCountryCode}${cleanedPhoneNumber}`;

    // Crear título y descripción del evento
    const eventTitle = `N: ${patientFullName} T: ${fullE164PhoneNumber}`;
    let eventDescription = `Turno reservado para ${patientFullName} (Tel: ${fullE164PhoneNumber}) con ${input.podologistName} a través del asistente virtual de PODOPALERMO.\n\nPago Verificado.`;

    if (input.paymentDetailsString) {
      eventDescription += `\nDetalles del Pago: ${input.paymentDetailsString}`;
    }
    if (input.paymentProofUrl) {
      eventDescription += `\nComprobante: ${input.paymentProofUrl}`;
    }
    if (input.bookingReason && input.bookingReason.trim() !== "") {
      eventDescription += `\nMotivo de la consulta: ${input.bookingReason.trim()}`;
    }

    const newEvent = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: appointmentStartTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointmentEndTime.toISOString(),
        timeZone: 'UTC',
      },
    };

    // Crear el nuevo evento
    debugInfo += `Creando nuevo evento en calendario ${input.podologistCalendarId}\n`;
    const createdEventResponse = await calendar.events.insert({
      calendarId: input.podologistCalendarId,
      requestBody: newEvent,
      sendUpdates: 'none',
    });

    if (createdEventResponse.status !== 200 || !createdEventResponse.data.id) {
      debugInfo += `Falló la creación del nuevo evento\n`;
      return {
        success: false,
        message: "No pudimos crear tu turno en la agenda en este momento. Inténtalo de nuevo o contacta a Cecilia.",
        personalizedMessage: "No pudimos crear tu turno en la agenda en este momento. Inténtalo de nuevo o contacta a Cecilia.",
        debugInfo
      };
    }

    const createdEventLink = createdEventResponse.data.htmlLink || undefined;
    const createdEventId = createdEventResponse.data.id;
    debugInfo += `Evento nuevo creado con ID: ${createdEventId}\n`;

    // Guardar en Firestore (simplificado para este ejemplo)
    try {
      // Aquí iría la lógica para guardar en Firestore
      // Por ahora solo logueamos
      debugInfo += `Datos de cita para guardar: ${JSON.stringify({
        patientFullName,
        patientPhoneNumber: fullE164PhoneNumber,
        podologistKey: input.podologistKey,
        podologistName: input.podologistName,
        appointmentTimestamp: appointmentStartTime.toISOString(),
        googleCalendarEventId: createdEventId,
        status: "confirmed"
      })}\n`;
    } catch (firestoreError: any) {
      debugInfo += `Error guardando en Firestore: ${firestoreError.message}\n`;
    }

    // Eliminar el evento "Ocupar" original
    debugInfo += `Eliminando evento original 'Ocupar' con ID: ${input.slotEventId}\n`;
    try {
      const deleteResponse = await calendar.events.delete({
        calendarId: input.podologistCalendarId,
        eventId: input.slotEventId,
        sendUpdates: 'none',
      });
      
      if (deleteResponse.status === 204 || deleteResponse.status === 200) {
        debugInfo += `Evento 'Ocupar' original eliminado exitosamente\n`;
      } else {
        debugInfo += `Advertencia: No se pudo eliminar el evento 'Ocupar' original\n`;
      }
    } catch (deleteErr: any) {
      debugInfo += `Error eliminando evento 'Ocupar' original: ${deleteErr.message}\n`;
    }

    // Generar mensaje personalizado
    const TIMEZONE_BA = 'America/Argentina/Buenos_Aires';
    const formattedDateTime = formatInTimeZone(
      appointmentStartTime, 
      TIMEZONE_BA, 
      "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", 
      { locale: es }
    );
    
    const nowInBA = toZonedTime(new Date(), TIMEZONE_BA);
    const appointmentDateInBA = toZonedTime(appointmentStartTime, TIMEZONE_BA);
    const isToday = isSameDay(nowInBA, appointmentDateInBA);
    const isTomorrow = isSameDay(addDays(nowInBA, 1), appointmentDateInBA);
    const appointmentTimeOnly = format(appointmentDateInBA, "HH:mm 'hs'", { locale: es });
    
    let relativeTimeDescription: string;
    if (isToday) {
      relativeTimeDescription = `hoy a las ${appointmentTimeOnly}`;
    } else if (isTomorrow) {
      relativeTimeDescription = `mañana a las ${appointmentTimeOnly}`;
    } else {
      relativeTimeDescription = `el ${formatInTimeZone(appointmentStartTime, TIMEZONE_BA, "EEEE d 'de' MMMM 'a las' HH:mm 'hs'", { locale: es })}`;
    }

    // Mensaje personalizado simple (sin IA por ahora)
    const personalizedClosing = `¡Todo listo para tu visita, ${input.patientFirstName}! Te esperamos.`;

    const locationInfo = `Nuestro consultorio está en Av. Sta. Fe 3288, Planta Baja "C" (C1425, CABA), es un edificio frente al Alto Palermo Shopping.`;
    const ceciliaContactInfo = `Recuerda que si necesitas algo o tienes alguna consulta, puedes comunicarte con Cecilia por WhatsApp al ${CECILIA_WHATSAPP_NUMBER}.`;

    const personalizedMessage = `${patientFullName}, ¡tu turno con ${input.podologistName} para el ${formattedDateTime} está confirmado! ${personalizedClosing}\n\n${locationInfo}\n\n${ceciliaContactInfo}`;
    const baseMessage = `¡Turno confirmado para ${patientFullName} con ${input.podologistName} el ${formattedDateTime}!`;
    
    return {
      success: true,
      message: baseMessage,
      personalizedMessage: personalizedMessage,
      createdEventLink,
      debugInfo,
    };

  } catch (err: any) {
    console.error('Error en createAppointment:', err);
    const userErrorMessage = "Lo siento, no pudimos crear tu turno en este momento debido a un error inesperado. Por favor, intenta de nuevo o contacta a Cecilia por WhatsApp.";

    debugInfo += `Error general: ${err.message || err.toString()}\n`;
    if ((err as any).response?.data?.error?.message) {
      debugInfo += `Error de Google API: ${(err as any).response.data.error.message}\n`;
    }

    return {
      success: false,
      message: userErrorMessage,
      personalizedMessage: userErrorMessage,
      debugInfo: debugInfo,
    };
  }
}