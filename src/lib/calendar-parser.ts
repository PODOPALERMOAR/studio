/**
 * Parser inteligente para turnos de PODOPALERMO
 * Extrae información de eventos con formato N: nombre T: telefono
 */

export interface ParsedAppointment {
  // Datos extraídos
  patientName: string;
  phoneNumber: string;
  normalizedPhone: string;
  
  // Metadatos del evento
  eventId: string;
  calendarId: string;
  podologistName: string;
  startTime: Date;
  endTime: Date;
  originalTitle: string;
  
  // Validación
  isValid: boolean;
  confidence: number;
}

export interface AvailableSlot {
  eventId: string;
  calendarId: string;
  podologistName: string;
  startTime: Date;
  duration: number; // en minutos
  originalTitle: string;
}

/**
 * Extrae nombre y teléfono de títulos con formato N: ... T: ...
 */
export function parseAppointmentTitle(title: string): { name: string; phone: string } | null {
  // Regex para capturar N: y T: con contenido flexible
  const regex = /N:\s*([^T]+?)\s+T:\s*([^\s]+)/i;
  const match = title.match(regex);
  
  if (!match) {
    return null;
  }
  
  const name = match[1].trim();
  const phone = match[2].trim();
  
  // Validar que tengamos datos válidos
  if (!name || !phone || name.length < 2 || phone.length < 8) {
    return null;
  }
  
  return { name, phone };
}

/**
 * Normaliza números de teléfono argentinos a formato internacional
 */
export function normalizePhoneNumber(phone: string): string {
  // Remover todos los caracteres no numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Si empieza con 0, removerlo (formato nacional argentino)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si empieza con 15, removerlo (celular argentino viejo)
  if (cleaned.startsWith('15')) {
    cleaned = cleaned.substring(2);
  }
  
  // Si ya tiene código de país 54, mantenerlo
  if (cleaned.startsWith('54')) {
    return '+' + cleaned;
  }
  
  // Si es un número argentino típico (10-11 dígitos), agregar código de país
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    return '+54' + cleaned;
  }
  
  // Para números internacionales, agregar + si no lo tiene
  if (cleaned.length > 11) {
    return '+' + cleaned;
  }
  
  // Si no podemos normalizar, devolver el original con +
  return '+' + cleaned;
}

/**
 * Calcula confianza en el parsing basado en varios factores
 */
export function calculateConfidence(name: string, phone: string): number {
  let confidence = 1.0;
  
  // Penalizar nombres muy cortos o con números
  if (name.length < 3) confidence -= 0.3;
  if (/\d/.test(name)) confidence -= 0.2;
  
  // Penalizar teléfonos muy cortos o muy largos
  const normalizedPhone = normalizePhoneNumber(phone);
  if (normalizedPhone.length < 12) confidence -= 0.3;
  if (normalizedPhone.length > 16) confidence -= 0.2;
  
  // Bonus por patrones típicos argentinos
  if (normalizedPhone.startsWith('+5411')) confidence += 0.1;
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Detecta si un evento es un slot disponible ("Ocupar")
 */
export function isAvailableSlot(title: string): boolean {
  const normalizedTitle = title.toLowerCase().trim();
  return normalizedTitle === 'ocupar';
}

/**
 * Procesa un evento de Google Calendar
 */
export function processCalendarEvent(
  event: any,
  calendarId: string,
  podologistName: string
): ParsedAppointment | AvailableSlot | null {
  const title = event.summary || '';
  const startTime = new Date(event.start?.dateTime || event.start?.date);
  const endTime = new Date(event.end?.dateTime || event.end?.date);
  
  // Verificar si es un slot disponible
  if (isAvailableSlot(title)) {
    return {
      eventId: event.id,
      calendarId,
      podologistName,
      startTime,
      duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
      originalTitle: title
    } as AvailableSlot;
  }
  
  // Intentar parsear como turno con paciente
  const parsed = parseAppointmentTitle(title);
  if (!parsed) {
    return null; // No es un formato válido, ignorar
  }
  
  const normalizedPhone = normalizePhoneNumber(parsed.phone);
  const confidence = calculateConfidence(parsed.name, parsed.phone);
  
  return {
    patientName: parsed.name,
    phoneNumber: parsed.phone,
    normalizedPhone,
    eventId: event.id,
    calendarId,
    podologistName,
    startTime,
    endTime,
    originalTitle: title,
    isValid: confidence > 0.5,
    confidence
  } as ParsedAppointment;
}

/**
 * Unifica pacientes por teléfono normalizado
 */
export function unifyPatientsByPhone(appointments: ParsedAppointment[]): Map<string, ParsedAppointment[]> {
  const unified = new Map<string, ParsedAppointment[]>();
  
  appointments.forEach(appointment => {
    if (!appointment.isValid) return;
    
    const phone = appointment.normalizedPhone;
    if (!unified.has(phone)) {
      unified.set(phone, []);
    }
    unified.get(phone)!.push(appointment);
  });
  
  return unified;
}

/**
 * Selecciona el mejor nombre para un paciente basado en frecuencia y calidad
 */
export function getBestPatientName(appointments: ParsedAppointment[]): string {
  const nameFrequency = new Map<string, number>();
  const nameConfidence = new Map<string, number>();
  
  appointments.forEach(apt => {
    const name = apt.patientName.trim();
    nameFrequency.set(name, (nameFrequency.get(name) || 0) + 1);
    nameConfidence.set(name, Math.max(nameConfidence.get(name) || 0, apt.confidence));
  });
  
  // Seleccionar nombre con mejor combinación de frecuencia y confianza
  let bestName = '';
  let bestScore = 0;
  
  nameFrequency.forEach((frequency, name) => {
    const confidence = nameConfidence.get(name) || 0;
    const score = frequency * confidence;
    
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  });
  
  return bestName || appointments[0]?.patientName || 'Paciente';
}