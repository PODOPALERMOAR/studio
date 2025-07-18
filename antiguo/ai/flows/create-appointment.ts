
'use server';
/**
 * @fileOverview Creates a new appointment in Google Calendar and attempts to delete the original "Ocupar" slot.
 * Generates a personalized closing message for the patient.
 * Saves confirmed appointment details to Firestore, including an optional payment proof URL.
 * Sends an email notification to the admin upon successful creation.
 *
 * - createAppointment - A function that handles the appointment creation process.
 * - CreateAppointmentInput - The input type for the createAppointment function.
 * - CreateAppointmentOutput - The return type for the createAppointment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { isSameDay, addDays, format } from 'date-fns';
import { firestoreAdmin } from '@/lib/firebase/admin';
import * as nodemailer from 'nodemailer';


const CECILIA_WHATSAPP_NUMBER = "1167437969";

const CreateAppointmentInputSchema = z.object({
  slotTimestamp: z.string().datetime().describe("The ISO string UTC timestamp of the chosen 'Ocupar' slot start time."),
  slotEventId: z.string().describe("The Google Calendar event ID of the 'Ocupar' slot to be deleted/modified."),
  patientFirstName: z.string().min(1).describe("The first name of the patient for the appointment."),
  patientLastName: z.string().optional().describe("The last name of the patient for the appointment."),
  phoneCountryCode: z.string().min(1).describe("The phone country code for the patient (e.g., '54' for Argentina)."),
  phoneNumber: z.string().min(1).describe("The phone number of the patient."),
  podologistKey: z.string().describe("The key of the podologist for this appointment."),
  podologistName: z.string().describe("The name of the podologist for this appointment."),
  podologistCalendarId: z.string().min(1).describe("The Google Calendar ID of the podologist where the appointment will be created."),
  bookingReason: z.string().optional().describe("Optional reason for the booking provided by the patient."),
  paymentDetailsString: z.string().optional().describe("A string summarizing the payment account details used for the booking, e.g., 'Cuenta: Banco Galicia, Alias: mi.alias'"),
  paymentProofUrl: z.string().url().optional().describe("Optional URL of the uploaded payment proof in Firebase Storage."),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentInputSchema>;

const CreateAppointmentOutputSchema = z.object({
  success: z.boolean().describe("Indicates if the appointment creation was successful."),
  message: z.string().describe("A general message detailing the outcome of the operation (user-friendly)."),
  createdEventLink: z.string().url().optional().describe("A direct link to the created Google Calendar event, if successful."),
  personalizedMessage: z.string().optional().describe("A personalized closing message for the patient (this should be the primary message on success)."),
  debugInfo: z.string().optional().describe("Debugging information about the process (for internal use, not for UI display)."),
});
export type CreateAppointmentOutput = z.infer<typeof CreateAppointmentOutputSchema>;


function generateSlotUnavailableErrorOutput(debugInfoToAdd: string, existingDebugInfo: string): CreateAppointmentOutput {
  const errorMessage = "¡No te preocupes! Parece que el turno que seleccionaste justo acaba de ser tomado o modificado. Para asegurar tu cita, Cecilia lo gestionará manually contigo por WhatsApp. Por favor, busca el botón para contactarla en el chat.";
  return {
    success: false,
    message: errorMessage,
    personalizedMessage: errorMessage,
    debugInfo: existingDebugInfo + debugInfoToAdd,
  };
}

export async function createAppointment(input: CreateAppointmentInput): Promise<CreateAppointmentOutput> {
  return createAppointmentFlow(input);
}


async function sendAppointmentNotificationEmail(details: {
  patientFullName: string;
  appointmentTime: Date;
  podologistName: string;
  bookingReason?: string;
  paymentProofUrl?: string | null;
  googleCalendarEventLink?: string | null;
}): Promise<string> {
  const {
    patientFullName,
    appointmentTime,
    podologistName,
    bookingReason,
    paymentProofUrl,
    googleCalendarEventLink,
  } = details;

  const toEmail = "podopalermo@gmail.com";
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    return "Email notification skipped: SMTP environment variables are not fully configured.\n";
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const formattedDateTime = formatInTimeZone(appointmentTime, 'America/Argentina/Buenos_Aires', "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", { locale: es });

  let subject: string;
  let htmlBody: string;

  if (paymentProofUrl) {
    // Template for new reservation with payment proof
    subject = `✅ Nueva Reserva Pagada: ${patientFullName} con ${podologistName}`;
    htmlBody = `
      <h1>Nueva Reserva Confirmada con Comprobante</h1>
      <p>Se ha registrado un nuevo turno pagado a través del asistente virtual.</p>
      <ul>
        <li><strong>Paciente:</strong> ${patientFullName}</li>
        <li><strong>Podólogo/a:</strong> ${podologistName}</li>
        <li><strong>Fecha y Hora:</strong> ${formattedDateTime}</li>
        ${bookingReason ? `<li><strong>Motivo:</strong> ${bookingReason}</li>` : ''}
      </ul>
      <p><strong>El comprobante de pago fue subido y verificado por la IA.</strong></p>
      <p><a href="${paymentProofUrl}" target="_blank" rel="noopener noreferrer">Ver Comprobante de Pago</a></p>
      ${googleCalendarEventLink ? `<p><a href="${googleCalendarEventLink}" target="_blank" rel="noopener noreferrer">Ver Evento en Google Calendar</a></p>`: ''}
      <hr>
      <p><em>Este es un email automático.</em></p>
    `;
  } else {
    // Template for reservation from user panel (or any other case without payment proof)
    subject = `🗓️ Nueva Reserva desde Panel: ${patientFullName} con ${podologistName}`;
    htmlBody = `
      <h1>Nueva Reserva desde el Panel de Paciente</h1>
      <p>Un paciente registrado ha agendado un nuevo turno desde su panel personal.</p>
      <ul>
        <li><strong>Paciente:</strong> ${patientFullName} (Usuario registrado)</li>
        <li><strong>Podólogo/a:</strong> ${podologistName}</li>
        <li><strong>Fecha y Hora:</strong> ${formattedDateTime}</li>
        ${bookingReason ? `<li><strong>Motivo:</strong> ${bookingReason}</li>` : ''}
      </ul>
      <p><strong>Nota:</strong> Esta reserva no requirió un comprobante de pago en el momento de ser creada, ya que fue hecha por un usuario con sesión iniciada.</p>
      ${googleCalendarEventLink ? `<p><a href="${googleCalendarEventLink}" target="_blank" rel="noopener noreferrer">Ver Evento en Google Calendar</a></p>`: ''}
      <hr>
      <p><em>Este es un email automático.</em></p>
    `;
  }

  const mailOptions = {
    from: `"Asistente Podopalermo" <${smtpUser}>`,
    to: toEmail,
    subject: subject,
    html: htmlBody,
  };

  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    return `Email notification sent successfully. Message ID: ${info.messageId}\n`;
  } catch (error: any) {
    console.error(`[Email Send Error] Failed to send notification email: ${error.message}`);
    return `ERROR sending email notification: ${error.message}\n`;
  }
}

const createAppointmentFlow = ai.defineFlow(
  {
    name: 'createAppointmentFlow',
    inputSchema: CreateAppointmentInputSchema,
    outputSchema: CreateAppointmentOutputSchema,
  },
  async ({
    slotTimestamp,
    slotEventId,
    patientFirstName,
    patientLastName,
    phoneCountryCode,
    phoneNumber,
    podologistKey,
    podologistName,
    podologistCalendarId,
    bookingReason,
    paymentDetailsString,
    paymentProofUrl,
  }) => {
    let debugInfo = `Starting createAppointmentFlow. Input: ${JSON.stringify({ slotTimestamp, slotEventId, patientFirstName, patientLastName, phoneCountryCode, phoneNumber, podologistKey, podologistName, podologistCalendarId, bookingReason, paymentDetailsString, paymentProofUrl })}\n`;

    if (!podologistCalendarId) {
      debugInfo += "CRITICAL: podologistCalendarId is not provided.\n";
      console.error(debugInfo);
      return {
        success: false,
        message: "Error de configuración interna. Por favor, contacta a soporte.",
        personalizedMessage: "Hubo un problema de configuración y no pudimos agendar tu turno. Por favor, intenta más tarde o contacta a Cecilia.",
        debugInfo: debugInfo
      };
    }
    
    try {
      // Use Application Default Credentials
      const auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      const authClient = await auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: authClient });
      debugInfo += "Auth client and calendar instance obtained via ADC.\n";


      debugInfo += `Revalidating slot 'Ocupar' original (ID: ${slotEventId}) in calendar ${podologistCalendarId}.\n`;
      try {
        const originalSlotEvent = await calendar.events.get({
          calendarId: podologistCalendarId,
          eventId: slotEventId,
        });

        if (
            !originalSlotEvent.data ||
            originalSlotEvent.data.status === 'cancelled' ||
            (originalSlotEvent.data.summary && originalSlotEvent.data.summary.trim().toLowerCase() !== 'ocupar')
           ) {
          const reason = !originalSlotEvent.data ? "no data" : originalSlotEvent.data.status === 'cancelled' ? "status cancelled" : "summary not 'ocupar'";
          debugInfo += `El slot 'Ocupar' original (ID: ${slotEventId}) ya no está disponible o su estado/título cambió (Razón: ${reason}. Actual Summary: "${originalSlotEvent.data?.summary}", Actual Status: "${originalSlotEvent.data?.status}"). Posiblemente tomado por otro usuario.\n`;
          return generateSlotUnavailableErrorOutput(`Slot ${slotEventId} no válido (razón: ${reason}).\n`, debugInfo);
        }
        debugInfo += `Slot 'Ocupar' original (ID: ${slotEventId}) todavía disponible y válido (Status: ${originalSlotEvent.data.status}, Summary: ${originalSlotEvent.data.summary}).\n`;
      } catch (getErr: any) {
        let errorDetail = `Error al intentar obtener el slot 'Ocupar' original (ID: ${slotEventId}): ${getErr.message || getErr.toString()}. Código: ${getErr.code || 'N/A'}.\n`;
        debugInfo += errorDetail;
        console.warn(`[createAppointmentFlow] Error al revalidar slot ${slotEventId}: ${getErr.message || getErr.toString()}`);
        return generateSlotUnavailableErrorOutput(`Fallo al obtener/validar slot ${slotEventId}: ${getErr.code || 'desconocido'}.\n`, debugInfo);
      }

      const appointmentStartTime = new Date(slotTimestamp);
      const appointmentEndTime = new Date(appointmentStartTime.getTime() + 60 * 60 * 1000);

      const patientFullName = `${patientFirstName}${patientLastName ? ' ' + patientLastName : ''}`;
      const cleanedPhoneNumber = phoneNumber.replace(/[\s-]/g, '');
      const cleanedCountryCode = phoneCountryCode.replace(/\+/g, '');
      const fullE164PhoneNumber = `+${cleanedCountryCode}${cleanedPhoneNumber}`;

      const eventTitle = `N: ${patientFullName} T: ${fullE164PhoneNumber}`;
      let eventDescription = `Turno reservado para ${patientFullName} (Tel: ${fullE164PhoneNumber}) con ${podologistName} a través del asistente virtual de PODOPALERMO.\n\nPago Verificado.`;

      if (paymentDetailsString) {
        eventDescription += `\nDetalles del Pago: ${paymentDetailsString}`;
      }
      if (paymentProofUrl) {
        eventDescription += `\nComprobante: ${paymentProofUrl}`;
      }
      if (bookingReason && bookingReason.trim() !== "") {
        eventDescription += `\nMotivo de la consulta: ${bookingReason.trim()}`;
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

      debugInfo += `Intentando crear nuevo evento en calendario ${podologistCalendarId}: ${JSON.stringify(newEvent)}\n`;
      const createdEventResponse = await calendar.events.insert({
        calendarId: podologistCalendarId,
        requestBody: newEvent,
        sendUpdates: 'none', 
      });
      debugInfo += `Respuesta de creación de nuevo evento: estado ${createdEventResponse.status}\n`;

      if (createdEventResponse.status !== 200 || !createdEventResponse.data.id) {
        debugInfo += `Falló la creación del nuevo evento. Respuesta: ${JSON.stringify(createdEventResponse.data)}\n`;
        return {
            success: false,
            message: "No pudimos crear tu turno en la agenda en este momento. Inténtalo de nuevo o contacta a Cecilia.",
            personalizedMessage: "No pudimos crear tu turno en la agenda en este momento. Inténtalo de nuevo o contacta a Cecilia.",
            debugInfo
        };
      }
      const createdEventLink = createdEventResponse.data.htmlLink || undefined;
      const createdEventId = createdEventResponse.data.id;
      debugInfo += `Evento nuevo creado con ID: ${createdEventId}. Link: ${createdEventLink}\n`;

      let firestoreSaveSuccessful = false;
      try {
        const appointmentData = {
          patientFullName: patientFullName,
          patientPhoneNumber: fullE164PhoneNumber,
          patientPhoneCountryCode: cleanedCountryCode,
          patientRawPhoneNumber: cleanedPhoneNumber,
          podologistKey: podologistKey,
          podologistName: podologistName,
          podologistCalendarId: podologistCalendarId,
          appointmentTimestamp: appointmentStartTime.toISOString(),
          googleCalendarEventId: createdEventId,
          googleCalendarEventLink: createdEventLink || null,
          bookingReason: bookingReason?.trim() || null,
          paymentDetailsString: paymentDetailsString || null,
          paymentProofUrl: paymentProofUrl || null,
          status: "confirmed",
          createdAt: new Date().toISOString(),
        };
        debugInfo += `Intentando guardar en Firestore, colección 'confirmedAppointments', datos: ${JSON.stringify(appointmentData)}\n`;
        const docRef = await firestoreAdmin.collection('confirmedAppointments').add(appointmentData);
        debugInfo += `Cita guardada en Firestore con ID: ${docRef.id}\n`;
        firestoreSaveSuccessful = true;
      } catch (firestoreError: any) {
        console.error('🔴 ERROR CRÍTICO guardando cita en Firestore:', firestoreError);
        let detailedErrorMsg = `🔴 ERROR CRÍTICO guardando cita en Firestore: ${firestoreError.message || String(firestoreError)}.`;
        if (firestoreError.code) {
            detailedErrorMsg += ` Code: ${firestoreError.code}.`;
        }
        if ((firestoreError as any).details) {
            try {
                const detailsString = JSON.stringify((firestoreError as any).details);
                detailedErrorMsg += ` Details (JSON): ${detailsString}.`;
            } catch (stringifyError) {
                detailedErrorMsg += ` Details (raw): ${String((firestoreError as any).details)}.`;
            }
        }
        if (firestoreError.stack && process.env.NODE_ENV === 'development') {
             console.error(`Stack: ${firestoreError.stack}`);
        }
        console.error(`[Server Log] Full Firestore error object:`, firestoreError);
        debugInfo += `${detailedErrorMsg}\n`;
      }
      
      if (firestoreSaveSuccessful) {
        debugInfo += "Attempting to send email notification...\n";
        try {
          const emailInput = {
            patientFullName,
            appointmentTime: appointmentStartTime,
            podologistName,
            bookingReason,
            paymentProofUrl,
            googleCalendarEventLink: createdEventLink,
          };
          const emailDebugInfo = await sendAppointmentNotificationEmail(emailInput);
          debugInfo += emailDebugInfo;
        } catch (emailErr: any) {
          const emailErrorMsg = `Warning: Email notification failed to send: ${emailErr.message}\n`;
          console.warn(emailErrorMsg);
          debugInfo += emailErrorMsg;
        }
      }

      debugInfo += `Intentando eliminar evento original 'Ocupar' con ID: ${slotEventId} del calendario ${podologistCalendarId}\n`;
      try {
        const deleteResponse = await calendar.events.delete({
          calendarId: podologistCalendarId,
          eventId: slotEventId,
          sendUpdates: 'none', 
        });
        debugInfo += `Respuesta de eliminación del evento 'Ocupar' original: estado ${deleteResponse.status}\n`;
        if (deleteResponse.status !== 204 && deleteResponse.status !== 200) {
          debugInfo += `Advertencia: Falló la eliminación del evento 'Ocupar' original (ID: ${slotEventId}). Podría necesitar eliminación manual. Estado: ${deleteResponse.status}\n`;
          console.warn(`[createAppointmentFlow] Ocupar slot ${slotEventId} could not be deleted automatically. Status: ${deleteResponse.status}`);
        } else {
          debugInfo += `Evento 'Ocupar' original (ID: ${slotEventId}) eliminado exitosamente.\n`;
        }
      } catch (deleteErr: any) {
        debugInfo += `Error al intentar eliminar evento 'Ocupar' original (ID: ${slotEventId}): ${deleteErr.message || deleteErr.toString()}. Esto es normal si el slot ya fue tomado/eliminado.\n`;
        console.warn(`[createAppointmentFlow] Ocupar slot ${slotEventId} could not be deleted (error caught, likely already gone): ${deleteErr.message || deleteErr.toString()}`);
      }

      const TIMEZONE_BA = 'America/Argentina/Buenos_Aires';
      const formattedDateTime = formatInTimeZone(appointmentStartTime, TIMEZONE_BA, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", { locale: es });
      
      const nowInBA = toZonedTime(new Date(), TIMEZONE_BA);
      const appointmentDateInBA = toZonedTime(appointmentStartTime, TIMEZONE_BA);
      const isToday = isSameDay(nowInBA, appointmentDateInBA);
      const isTomorrow = isSameDay(addDays(nowInBA, 1), appointmentDateInBA);
      const appointmentTimeOnly = format(appointmentDateInBA, "HH:mm 'hs'", { locale: es });
      
      let relativeTimeDescriptionForPrompt: string;
      if (isToday) {
        relativeTimeDescriptionForPrompt = `hoy a las ${appointmentTimeOnly}`;
      } else if (isTomorrow) {
        relativeTimeDescriptionForPrompt = `mañana a las ${appointmentTimeOnly}`;
      } else {
        relativeTimeDescriptionForPrompt = `el ${formatInTimeZone(appointmentStartTime, TIMEZONE_BA, "EEEE d 'de' MMMM 'a las' HH:mm 'hs'", { locale: es })}`;
      }
      debugInfo += `Relative time description for AI prompt: "${relativeTimeDescriptionForPrompt}"\n`;

      let personalizedAiPart = "";
      try {
        debugInfo += `Intentando generar PARTE personalizada del mensaje para ${patientFirstName}.\n`;
        const personalizedResponse = await ai.generate({
          prompt: `Eres el asistente virtual de PODOPALERMO. El paciente ${patientFirstName} acaba de confirmar su turno con el/la podólogo/a ${podologistName}. El turno es ${relativeTimeDescriptionForPrompt}. El pago ha sido verificado.
${bookingReason && bookingReason.trim() !== "" ? `El motivo que indicó es: "${bookingReason.trim()}". Considera esto sutilmente si es relevante para una frase alentadora o práctica, pero no lo repitas textualmente si es muy personal.` : ""}

Genera una frase de cierre MUY CORTA y AMABLE (1-2 frases MÁXIMO) para ${patientFirstName}.
  - NO incluyas saludos como "Hola ${patientFirstName}" o "¡Excelente!". Ve directo al mensaje.
  - Enfócate en consejos prácticos para la visita (ej: "Intenta llegar unos minutos antes.") o frases alentadoras sutiles (ej: "Nos vemos pronto en el consultorio.", "¡Qué bueno que ya tengas tu cita! Te esperamos.", "Será un gusto atenderte.").
  - NO repitas el nombre del/la podólogo/a ni la fecha/hora del turno, ya que esa información ya se da en el mensaje principal. Tu frase debe ser un complemento, no un resumen del turno. Por ejemplo: "Te esperamos." o "Llega con unos minutos de antelación si puedes."
  - NO menciones explícitamente "${relativeTimeDescriptionForPrompt}" a menos que sea natural para un consejo (e.g., "Como tu turno es hoy..."). El objetivo es evitar que digas "Nos vemos ${relativeTimeDescriptionForPrompt}".
  - Evita terminología como "clínica" o "doctor/a". Usa "consultorio" y "podólogo/a".
  - NO sugieras NADA que suene a completar formularios, traer documentos, ni preparativos complejos.
  - El mensaje debe ser conciso y profesional. Varía las frases en cada generación.
  - NO incluyas la dirección ni la información de contacto de Cecilia. Eso se añadirá después.
  - SOLO devuelve esta frase personalizada. Nada más.`,
          model: 'googleai/gemini-2.0-flash-001',
        });
        const generatedText = personalizedResponse.text;

        if (generatedText && generatedText.trim() !== '') {
          personalizedAiPart = generatedText.trim();
          debugInfo += `Parte personalizada generada por IA: "${personalizedAiPart}"\n`;
        } else {
          debugInfo += `Parte personalizada generada vacía o con espacios. Usando fallback genérico.\n`;
          personalizedAiPart = `¡Todo listo para tu visita, ${patientFirstName}! Te esperamos.`;
        }
      } catch (genError: any) {
        console.error('Falló la generación de la parte personalizada del mensaje:', genError);
        debugInfo += `Falló la generación de la parte personalizada. Error: ${genError.message || genError.toString()}. Usando fallback genérico.\n`;
        personalizedAiPart = `¡Nos vemos pronto, ${patientFirstName}! Tu turno está agendado. ✨👣`;
      }

      const locationInfo = `Nuestro consultorio está en Av. Sta. Fe 3288, Planta Baja "C" (C1425, CABA), es un edificio frente al Alto Palermo Shopping.`;
      const ceciliaContactInfo = `Recuerda que si necesitas algo o tienes alguna consulta, puedes comunicarte con Cecilia por WhatsApp al ${CECILIA_WHATSAPP_NUMBER}.`;

      const basePersonalizedMessage = `${patientFullName}, ¡tu turno con ${podologistName} para el ${formattedDateTime} está confirmado! ${personalizedAiPart}\n\n${locationInfo}\n\n${ceciliaContactInfo}`;
      const baseMessage = `¡Turno confirmado para ${patientFullName} con ${podologistName} el ${formattedDateTime}!`;
      
      let systemWarning = "";
      if (!firestoreSaveSuccessful) {
        systemWarning = "\n\nIMPORTANTE: Su turno FUE AGENDADO en el calendario, pero hubo un inconveniente al guardar los detalles completos en nuestro sistema de respaldo. Por favor, contacte a Podopalermo para asegurar que todos sus datos fueron registrados correctamente.";
      }
      
      debugInfo += `Mensaje final ensamblado (antes de warning): "${basePersonalizedMessage}"\n`;
      if(systemWarning) debugInfo += `Advertencia del sistema añadida: "${systemWarning}"\n`;

      return {
        success: true,
        message: `${baseMessage}${systemWarning}`,
        personalizedMessage: `${basePersonalizedMessage}${systemWarning}`,
        createdEventLink,
        debugInfo,
      };

    } catch (err: any) {
      console.error('Error en createAppointmentFlow (general):', err);
      const userErrorMessage = "Lo siento, no pudimos crear tu turno en este momento debido a un error inesperado. Por favor, intenta de nuevo o contacta a Cecilia por WhatsApp.";

      debugInfo += `Error general: ${err.message || err.toString()}\n`;
      if ((err as any).response?.data?.error?.message) {
        debugInfo += `Google API Error (general): ${(err as any).response.data.error.message}\n`;
      }

      return {
        success: false,
        message: userErrorMessage,
        personalizedMessage: userErrorMessage,
        debugInfo: debugInfo,
      };
    }
  }
);
    
    





