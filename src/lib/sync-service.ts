/**
 * Servicio de sincronización principal para PODOPALERMO
 * Coordina la sincronización entre Google Calendar y Firestore
 */

import { 
  getAllPodopalermoEvents, 
  getSyncDateRange, 
  PODOPALERMO_CALENDARS 
} from './google-calendar';
import { 
  processCalendarEvent, 
  unifyPatientsByPhone, 
  getBestPatientName,
  ParsedAppointment,
  AvailableSlot
} from './calendar-parser';
import { 
  PatientProfile, 
  Appointment, 
  AvailableSlot as FirestoreAvailableSlot,
  calculateLoyaltyTier,
  isActivePatient
} from './firestore-schema';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  writeBatch
} from 'firebase/firestore';

export class PodopalermoSyncService {
  
  /**
   * Sincronización completa del sistema
   */
  async fullSync(): Promise<{
    success: boolean;
    stats: {
      totalEvents: number;
      appointmentsParsed: number;
      availableSlots: number;
      patientsUpdated: number;
      errors: number;
    };
    errors: string[];
  }> {
    console.log('🚀 Iniciando sincronización completa PODOPALERMO...');
    
    const stats = {
      totalEvents: 0,
      appointmentsParsed: 0,
      availableSlots: 0,
      patientsUpdated: 0,
      errors: 0
    };
    const errors: string[] = [];
    
    try {
      // 1. Obtener rango de fechas (24 meses)
      const { startDate, endDate } = getSyncDateRange();
      console.log(`📅 Sincronizando desde ${startDate.toISOString()} hasta ${endDate.toISOString()}`);
      
      // 2. Obtener todos los eventos de los 7 calendarios
      const allEvents = await getAllPodopalermoEvents(startDate, endDate);
      stats.totalEvents = allEvents.length;
      console.log(`📊 Total eventos obtenidos: ${stats.totalEvents}`);
      
      // 3. Procesar eventos
      const appointments: ParsedAppointment[] = [];
      const availableSlots: AvailableSlot[] = [];
      
      for (const event of allEvents) {
        try {
          const processed = processCalendarEvent(
            event, 
            event.calendarId, 
            event.podologistName
          );
          
          if (processed) {
            if ('patientName' in processed) {
              appointments.push(processed as ParsedAppointment);
              stats.appointmentsParsed++;
            } else {
              availableSlots.push(processed as AvailableSlot);
              stats.availableSlots++;
            }
          }
        } catch (error) {
          stats.errors++;
          errors.push(`Error procesando evento ${event.id}: ${error}`);
        }
      }
      
      console.log(`✅ Turnos parseados: ${stats.appointmentsParsed}`);
      console.log(`🕐 Slots disponibles: ${stats.availableSlots}`);
      
      // 4. Unificar pacientes por teléfono
      const unifiedPatients = unifyPatientsByPhone(appointments);
      console.log(`👥 Pacientes únicos identificados: ${unifiedPatients.size}`);
      
      // 5. Actualizar base de datos
      await this.updateDatabase(unifiedPatients, appointments, availableSlots);
      stats.patientsUpdated = unifiedPatients.size;
      
      // 6. Generar analytics
      await this.updateAnalytics();
      
      console.log('✅ Sincronización completa exitosa');
      return { success: true, stats, errors };
      
    } catch (error) {
      console.error('❌ Error en sincronización completa:', error);
      errors.push(`Error general: ${error}`);
      return { success: false, stats, errors };
    }
  }
  
  /**
   * Actualiza la base de datos con los datos procesados
   */
  private async updateDatabase(
    unifiedPatients: Map<string, ParsedAppointment[]>,
    allAppointments: ParsedAppointment[],
    availableSlots: AvailableSlot[]
  ) {
    console.log('💾 Iniciando actualización de base de datos...');
    
    try {
      // 1. Actualizar perfiles de pacientes (en lotes pequeños)
      let patientCount = 0;
      for (const [phone, patientAppointments] of unifiedPatients) {
        try {
          const patientProfile = await this.createPatientProfile(phone, patientAppointments);
          const patientId = phone.replace(/[^0-9]/g, ''); // Solo números para el ID
          
          if (patientId.length < 3) {
            console.warn(`⚠️ ID de paciente muy corto: ${patientId} para teléfono ${phone}`);
            continue;
          }
          
          const patientRef = doc(db, 'patients', patientId);
          await setDoc(patientRef, patientProfile);
          patientCount++;
          
          if (patientCount % 50 === 0) {
            console.log(`📊 Procesados ${patientCount} pacientes...`);
          }
        } catch (error) {
          console.error(`❌ Error procesando paciente ${phone}:`, error);
        }
      }
      
      console.log(`✅ ${patientCount} pacientes actualizados`);
      
      // 2. Actualizar turnos (en lotes)
      let appointmentCount = 0;
      const batch = writeBatch(db);
      
      for (const appointment of allAppointments) {
        if (!appointment.isValid) continue;
        
        try {
          const appointmentData: Appointment = {
            id: appointment.eventId,
            calendarEventId: appointment.eventId,
            calendarId: appointment.calendarId,
            patientPhone: appointment.normalizedPhone,
            patientName: appointment.patientName,
            podologistKey: this.getPodologistKey(appointment.calendarId),
            podologistName: appointment.podologistName,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            duration: Math.round((appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60)),
            status: this.determineAppointmentStatus(appointment.startTime),
            isFromAvailableSlot: false,
            originalTitle: appointment.originalTitle,
            confidence: appointment.confidence,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const appointmentRef = doc(db, 'appointments', appointment.eventId);
          batch.set(appointmentRef, appointmentData);
          appointmentCount++;
          
          // Ejecutar batch cada 400 documentos (límite de Firestore es 500)
          if (appointmentCount % 400 === 0) {
            await batch.commit();
            console.log(`📊 Procesados ${appointmentCount} turnos...`);
          }
        } catch (error) {
          console.error(`❌ Error procesando turno ${appointment.eventId}:`, error);
        }
      }
      
      // Ejecutar batch final de turnos
      if (appointmentCount % 400 !== 0) {
        await batch.commit();
      }
      
      console.log(`✅ ${appointmentCount} turnos actualizados`);
      
      // 3. Actualizar slots disponibles
      let slotCount = 0;
      for (const slot of availableSlots) {
        try {
          const slotData: FirestoreAvailableSlot = {
            id: slot.eventId,
            calendarEventId: slot.eventId,
            calendarId: slot.calendarId,
            podologistKey: this.getPodologistKey(slot.calendarId),
            podologistName: slot.podologistName,
            startTime: slot.startTime,
            duration: slot.duration,
            isAvailable: slot.startTime > new Date(), // Solo futuro
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const slotRef = doc(db, 'availableSlots', slot.eventId);
          await setDoc(slotRef, slotData);
          slotCount++;
        } catch (error) {
          console.error(`❌ Error procesando slot ${slot.eventId}:`, error);
        }
      }
      
      console.log(`✅ ${slotCount} slots disponibles actualizados`);
      console.log('💾 Base de datos actualizada exitosamente');
      
    } catch (error) {
      console.error('❌ Error general en actualización de base de datos:', error);
      throw error;
    }
  }
  
  /**
   * Crea un perfil de paciente unificado
   */
  private async createPatientProfile(
    phone: string, 
    appointments: ParsedAppointment[]
  ): Promise<PatientProfile> {
    const bestName = getBestPatientName(appointments);
    const alternativeNames = [...new Set(appointments.map(apt => apt.patientName))];
    
    // Calcular métricas
    const sortedAppointments = appointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const firstVisit = sortedAppointments[0]?.startTime || new Date();
    const lastVisit = sortedAppointments[sortedAppointments.length - 1]?.startTime || new Date();
    
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.startTime < new Date()).length;
    
    // Verificar si ya existe el paciente para mantener datos de registro
    const patientId = phone.replace(/[^0-9]/g, ''); // Solo números para el ID
    const existingPatientRef = doc(db, 'patients', patientId);
    const existingPatient = await getDoc(existingPatientRef);
    const existingData = existingPatient.exists() ? existingPatient.data() as PatientProfile : null;
    
    return {
      id: phone.replace(/[^0-9]/g, ''),
      phoneNumber: phone,
      name: bestName,
      alternativeNames,
      email: existingData?.email || null,
      firebaseUid: existingData?.firebaseUid || null,
      isRegistered: existingData?.isRegistered || false,
      totalAppointments,
      completedAppointments,
      cancelledAppointments: 0, // TODO: Detectar cancelaciones
      noShowAppointments: 0, // TODO: Detectar no-shows
      firstVisit,
      lastVisit,
      createdAt: existingData?.createdAt || new Date(),
      updatedAt: new Date(),
      loyaltyTier: calculateLoyaltyTier(totalAppointments),
      isActive: isActivePatient(lastVisit),
      preferredPodologists: this.calculatePreferredPodologists(appointments),
      preferredTimeSlots: this.calculatePreferredTimeSlots(appointments),
      averageMonthlyVisits: this.calculateAverageMonthlyVisits(appointments),
      lastTreatmentNotes: existingData?.lastTreatmentNotes || null,
      specialNeeds: existingData?.specialNeeds || []
    };
  }
  
  /**
   * Determina el estado de un turno basado en la fecha
   */
  private determineAppointmentStatus(startTime: Date): 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' {
    const now = new Date();
    if (startTime > now) {
      return 'SCHEDULED';
    } else {
      return 'COMPLETED'; // Asumimos completado si ya pasó
    }
  }
  
  /**
   * Obtiene la clave del podólogo por calendar ID
   */
  private getPodologistKey(calendarId: string): string {
    for (const [key, calendar] of Object.entries(PODOPALERMO_CALENDARS)) {
      if (calendar.id === calendarId) {
        return key;
      }
    }
    return 'UNKNOWN';
  }
  
  /**
   * Calcula podólogos preferidos por frecuencia
   */
  private calculatePreferredPodologists(appointments: ParsedAppointment[]): string[] {
    const frequency = new Map<string, number>();
    
    appointments.forEach(apt => {
      const key = this.getPodologistKey(apt.calendarId);
      frequency.set(key, (frequency.get(key) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key);
  }
  
  /**
   * Calcula horarios preferidos
   */
  private calculatePreferredTimeSlots(appointments: ParsedAppointment[]): string[] {
    const timeSlots = new Map<string, number>();
    
    appointments.forEach(apt => {
      const hour = apt.startTime.getHours();
      const timeSlot = `${hour}:00`;
      timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
    });
    
    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slot]) => slot);
  }
  
  /**
   * Calcula promedio de visitas mensuales
   */
  private calculateAverageMonthlyVisits(appointments: ParsedAppointment[]): number {
    if (appointments.length === 0) return 0;
    
    const sortedAppointments = appointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const firstVisit = sortedAppointments[0].startTime;
    const lastVisit = sortedAppointments[sortedAppointments.length - 1].startTime;
    
    const monthsDiff = Math.max(1, 
      (lastVisit.getFullYear() - firstVisit.getFullYear()) * 12 + 
      (lastVisit.getMonth() - firstVisit.getMonth()) + 1
    );
    
    return Math.round((appointments.length / monthsDiff) * 100) / 100;
  }
  
  /**
   * Actualiza analytics del sistema
   */
  private async updateAnalytics() {
    // TODO: Implementar generación de analytics
    console.log('📊 Actualizando analytics...');
  }
  
  /**
   * Obtiene slots disponibles para el asistente
   */
  async getAvailableSlots(
    podologistKey?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FirestoreAvailableSlot[]> {
    let q = query(
      collection(db, 'availableSlots'),
      where('isAvailable', '==', true),
      orderBy('startTime', 'asc')
    );
    
    if (podologistKey) {
      q = query(q, where('podologistKey', '==', podologistKey));
    }
    
    const snapshot = await getDocs(q);
    const slots = snapshot.docs.map(doc => doc.data() as FirestoreAvailableSlot);
    
    // Filtrar por fechas si se especifican
    return slots.filter(slot => {
      if (startDate && slot.startTime < startDate) return false;
      if (endDate && slot.startTime > endDate) return false;
      return true;
    });
  }
}

// Instancia singleton
export const syncService = new PodopalermoSyncService();