/**
 * Servicio de Analytics Avanzado para PODOPALERMO
 * Combina datos de Firestore con análisis avanzados del proyecto anterior
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  limit,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  PatientProfile, 
  Appointment, 
  SystemAnalytics,
  LoyaltyTier
} from './firestore-schema';
import { 
  isValid, 
  parseISO, 
  subYears,
  isAfter,
  isBefore,
  differenceInMonths,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  subDays,
  formatDistanceToNow
} from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos avanzados basados en el proyecto anterior
export interface AdvancedPatientProfile extends PatientProfile {
  status: 'Activo' | 'Frecuente' | 'Nuevo' | 'En Riesgo' | 'Inactivo';
  displayName: string;
  primaryPhoneNumber: string | null;
  firstAppointmentDate: string | null;
  nextAppointmentDate: string | null;
}

export interface AdvancedKPIs {
  totalActivePatients: number;
  newPatientsThisMonth: number;
  atRiskPatients: number;
  secondAppointmentRetentionRate: number; // Percentage
  visitFrequencyPerYear: number;
  quarterlyChurnRate: number; // Percentage
  averageReturnTimeDays: number;
  
  // KPIs adicionales del sistema actual
  totalPatients: number;
  totalAppointments: number;
  retentionRate: number;
  growthRate: number;
}

export interface MonthlyChartData {
  name: string;
  year: string;
  newPatients: number;
  recurringPatients: number;
  total: number;
}

export interface SpotlightPatient {
  id: string;
  displayName: string;
  type: 'loyal' | 'newest';
  totalAppointments: number;
  description: string;
}

export interface AdvancedDashboardKPIs {
  // KPIs avanzados
  kpis: AdvancedKPIs;
  
  // Datos de pacientes enriquecidos
  patients: AdvancedPatientProfile[];
  
  // Datos para gráficos
  monthlyChartData: MonthlyChartData[];
  
  // Pacientes destacados
  spotlightPatients: SpotlightPatient[];
  
  // Distribución por estado
  statusDistribution: {
    Activo: number;
    Frecuente: number;
    Nuevo: number;
    'En Riesgo': number;
    Inactivo: number;
  };
  
  // Top performers (del sistema actual)
  topPodologists: {
    name: string;
    totalAppointments: number;
    uniquePatients: number;
    occupancyRate: number;
  }[];
  
  // Horarios pico
  peakHours: { hour: number; count: number; label: string }[];
  peakDays: { day: number; count: number; label: string }[];
  
  // Metadata
  lastUpdated: string;
  debugInfo?: string;
}

export class AdvancedAnalyticsService {
  
  /**
   * Convierte cualquier timestamp a Date
   */
  private ensureDate(date: any): Date {
    if (!date) return new Date();
    
    if (date instanceof Date) return date;
    
    // Si es un timestamp de Firestore
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    
    // Si es un objeto con seconds y nanoseconds (formato Firestore)
    if (date && date.seconds !== undefined) {
      return new Date(date.seconds * 1000);
    }
    
    // Si es un string ISO
    if (typeof date === 'string') {
      return new Date(date);
    }
    
    // Si es un número (timestamp)
    if (typeof date === 'number') {
      return new Date(date);
    }
    
    return new Date();
  }

  /**
   * Determina el estado avanzado de un paciente
   */
  private determineAdvancedPatientStatus(
    pastAppointments: { date: Date }[],
    now: Date
  ): AdvancedPatientProfile['status'] {
    const totalAppointments = pastAppointments.length;
    if (totalAppointments === 0) return 'Nuevo';
    
    pastAppointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    const lastAppointmentDate = pastAppointments[0].date;
    const monthsSinceLastVisit = differenceInMonths(now, lastAppointmentDate);

    if (monthsSinceLastVisit >= 9) return 'Inactivo';
    if (monthsSinceLastVisit >= 4) return 'En Riesgo';

    if (totalAppointments === 1) return 'Nuevo';
    
    const oneYearAgo = subYears(now, 1);
    const appointmentsLastYear = pastAppointments.filter(appt => isAfter(appt.date, oneYearAgo)).length;
    if (appointmentsLastYear >= 5) {
        return 'Frecuente';
    }
    return 'Activo';
  }

  /**
   * Genera KPIs avanzados del dashboard
   */
  async generateAdvancedDashboardKPIs(): Promise<AdvancedDashboardKPIs> {
    console.log('📊 Generando KPIs avanzados del dashboard...');
    
    try {
      const now = new Date();
      
      // Obtener todos los pacientes
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const rawPatients = patientsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: this.ensureDate(data.createdAt),
          lastVisit: this.ensureDate(data.lastVisit),
          firstVisit: this.ensureDate(data.firstVisit),
          updatedAt: this.ensureDate(data.updatedAt)
        } as PatientProfile;
      });
      
      // Obtener todos los turnos
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const appointments = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          startTime: this.ensureDate(data.startTime),
          endTime: this.ensureDate(data.endTime),
          createdAt: this.ensureDate(data.createdAt),
          updatedAt: this.ensureDate(data.updatedAt)
        } as Appointment;
      });
      
      console.log(`📊 Procesando ${rawPatients.length} pacientes y ${appointments.length} turnos...`);
      
      // Crear mapa de turnos por paciente
      const appointmentsByPatient = new Map<string, Appointment[]>();
      appointments.forEach(apt => {
        const patientKey = apt.patientPhone || apt.id;
        if (!appointmentsByPatient.has(patientKey)) {
          appointmentsByPatient.set(patientKey, []);
        }
        appointmentsByPatient.get(patientKey)!.push(apt);
      });
      
      // Enriquecer pacientes con análisis avanzado
      const enrichedPatients: AdvancedPatientProfile[] = rawPatients.map(patient => {
        const patientAppointments = appointmentsByPatient.get(patient.phoneNumber || patient.id) || [];
        const pastAppointments = patientAppointments
          .filter(apt => apt.startTime <= now)
          .map(apt => ({ date: apt.startTime }));
        
        const futureAppointments = patientAppointments
          .filter(apt => apt.startTime > now)
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        const allAppointmentsSorted = patientAppointments
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        const status = this.determineAdvancedPatientStatus(pastAppointments, now);
        
        return {
          ...patient,
          status,
          displayName: patient.name || 'Paciente Desconocido',
          primaryPhoneNumber: patient.phoneNumber,
          firstAppointmentDate: allAppointmentsSorted.length > 0 ? allAppointmentsSorted[0].startTime.toISOString() : null,
          nextAppointmentDate: futureAppointments.length > 0 ? futureAppointments[0].startTime.toISOString() : null,
          totalAppointments: pastAppointments.length
        };
      });
      
      // Calcular KPIs avanzados
      const totalPatients = enrichedPatients.length;
      const totalActivePatients = enrichedPatients.filter(p => p.status !== 'Inactivo').length;
      const atRiskPatients = enrichedPatients.filter(p => p.status === 'En Riesgo').length;
      
      // Pacientes nuevos este mes
      const thisMonthStart = startOfMonth(now);
      const newPatientsThisMonth = enrichedPatients.filter(p => 
        p.firstAppointmentDate && isAfter(parseISO(p.firstAppointmentDate), thisMonthStart)
      ).length;
      
      // Tasa de retención de segunda cita
      const retentionWindowStart = subDays(now, 90);
      const retentionWindowEnd = subDays(now, 60);
      const newPatientsInWindow = enrichedPatients.filter(p => 
        p.firstAppointmentDate && 
        isAfter(parseISO(p.firstAppointmentDate), retentionWindowStart) && 
        isBefore(parseISO(p.firstAppointmentDate), retentionWindowEnd)
      );
      const retainedCount = newPatientsInWindow.filter(p => p.totalAppointments > 1).length;
      const secondAppointmentRetentionRate = newPatientsInWindow.length > 0 ? 
        (retainedCount / newPatientsInWindow.length) * 100 : 0;
      
      // Frecuencia de visitas por año
      const appointmentsInLastYear = enrichedPatients.reduce((sum, p) => sum + p.totalAppointments, 0);
      const visitFrequencyPerYear = totalActivePatients > 0 ? 
        appointmentsInLastYear / totalActivePatients : 0;
      
      // Tasa de abandono trimestral
      const quarterAgo = subDays(now, 90);
      const patientsAtStartOfQuarter = enrichedPatients.filter(p => {
        const lastVisit = p.lastVisit;
        return lastVisit && isAfter(lastVisit, subMonths(quarterAgo, 9)); 
      });
      const newlyInactiveCount = patientsAtStartOfQuarter.filter(p => p.status === 'Inactivo').length;
      const quarterlyChurnRate = patientsAtStartOfQuarter.length > 0 ? 
        (newlyInactiveCount / patientsAtStartOfQuarter.length) * 100 : 0;
      
      // Tiempo promedio de retorno
      let totalTimeBetweenAppointments = 0;
      let numberOfIntervals = 0;
      
      for (const [patientKey, patientAppointments] of appointmentsByPatient.entries()) {
        const pastAppointments = patientAppointments
          .filter(apt => apt.startTime <= now)
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        if (pastAppointments.length > 1) {
          for (let i = 1; i < pastAppointments.length; i++) {
            const timeDiff = pastAppointments[i].startTime.getTime() - pastAppointments[i - 1].startTime.getTime();
            totalTimeBetweenAppointments += timeDiff;
            numberOfIntervals++;
          }
        }
      }
      
      const averageReturnTimeDays = numberOfIntervals > 0
        ? Math.round((totalTimeBetweenAppointments / numberOfIntervals) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Tasa de retención general
      const returningPatients = enrichedPatients.filter(p => p.totalAppointments > 1).length;
      const retentionRate = totalPatients > 0 ? Math.round((returningPatients / totalPatients) * 100) : 0;
      
      // Tasa de crecimiento (simplificada)
      const growthRate = 5; // Placeholder - se calcularía comparando con mes anterior
      
      const kpis: AdvancedKPIs = {
        totalActivePatients,
        newPatientsThisMonth,
        atRiskPatients,
        secondAppointmentRetentionRate: Math.round(secondAppointmentRetentionRate * 10) / 10,
        visitFrequencyPerYear: Math.round(visitFrequencyPerYear * 10) / 10,
        quarterlyChurnRate: Math.round(quarterlyChurnRate * 10) / 10,
        averageReturnTimeDays,
        totalPatients,
        totalAppointments: appointments.length,
        retentionRate,
        growthRate
      };
      
      // Distribución por estado
      const statusDistribution = {
        'Activo': enrichedPatients.filter(p => p.status === 'Activo').length,
        'Frecuente': enrichedPatients.filter(p => p.status === 'Frecuente').length,
        'Nuevo': enrichedPatients.filter(p => p.status === 'Nuevo').length,
        'En Riesgo': enrichedPatients.filter(p => p.status === 'En Riesgo').length,
        'Inactivo': enrichedPatients.filter(p => p.status === 'Inactivo').length,
      };
      
      // Datos para gráfico mensual
      const monthlyChartData = this.calculateMonthlyChartData(appointments, enrichedPatients, now);
      
      // Pacientes destacados
      const spotlightPatients = this.calculateSpotlightPatients(enrichedPatients);
      
      // Top podólogos (del sistema actual)
      const topPodologists = this.calculatePodologistStats(appointments);
      
      // Horarios pico
      const peakHours = this.calculatePeakHours(appointments);
      const peakDays = this.calculatePeakDays(appointments);
      
      const result: AdvancedDashboardKPIs = {
        kpis,
        patients: enrichedPatients.sort((a, b) => {
          const dateA = a.lastVisit ? a.lastVisit.getTime() : 0;
          const dateB = b.lastVisit ? b.lastVisit.getTime() : 0;
          return dateB - dateA;
        }),
        monthlyChartData,
        spotlightPatients,
        statusDistribution,
        topPodologists,
        peakHours,
        peakDays,
        lastUpdated: now.toISOString()
      };
      
      console.log('✅ KPIs avanzados generados exitosamente');
      return result;
      
    } catch (error) {
      console.error('❌ Error generando KPIs avanzados:', error);
      throw error;
    }
  }
  
  private calculateMonthlyChartData(
    appointments: Appointment[], 
    patients: AdvancedPatientProfile[], 
    now: Date
  ): MonthlyChartData[] {
    const monthlyData: MonthlyChartData[] = [];
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthAppointments = appointments.filter(apt => 
        apt.startTime >= monthStart && apt.startTime <= monthEnd
      );
      
      let newPatients = 0;
      let recurringPatients = 0;
      
      monthAppointments.forEach(apt => {
        const patient = patients.find(p => p.phoneNumber === apt.patientPhone);
        if (patient && patient.firstAppointmentDate) {
          const firstAppt = parseISO(patient.firstAppointmentDate);
          const isFirstAppointment = Math.abs(firstAppt.getTime() - apt.startTime.getTime()) < 24 * 60 * 60 * 1000; // Mismo día
          
          if (isFirstAppointment) {
            newPatients++;
          } else {
            recurringPatients++;
          }
        }
      });
      
      monthlyData.push({
        name: format(monthDate, 'LLL', { locale: es }).charAt(0).toUpperCase() + format(monthDate, 'LLL', { locale: es }).slice(1),
        year: format(monthDate, 'yyyy'),
        newPatients,
        recurringPatients,
        total: newPatients + recurringPatients
      });
    }
    
    return monthlyData;
  }
  
  private calculateSpotlightPatients(patients: AdvancedPatientProfile[]): SpotlightPatient[] {
    const spotlight: SpotlightPatient[] = [];
    
    // Paciente más leal
    const mostLoyal = patients
      .filter(p => p.totalAppointments > 1)
      .sort((a, b) => b.totalAppointments - a.totalAppointments)[0];
    
    if (mostLoyal) {
      spotlight.push({
        id: mostLoyal.id,
        displayName: mostLoyal.displayName,
        type: 'loyal',
        totalAppointments: mostLoyal.totalAppointments,
        description: `Nuestro paciente más leal con ${mostLoyal.totalAppointments} visitas. ¡Gracias por tu confianza!`
      });
    }
    
    // Paciente más nuevo
    const newest = patients
      .filter(p => p.status === 'Nuevo' && p.firstAppointmentDate)
      .sort((a, b) => parseISO(b.firstAppointmentDate!).getTime() - parseISO(a.firstAppointmentDate!).getTime())[0];
    
    if (newest) {
      spotlight.push({
        id: newest.id,
        displayName: newest.displayName,
        type: 'newest',
        totalAppointments: newest.totalAppointments,
        description: 'Damos una cálida bienvenida a nuestro más reciente paciente. ¡Estamos aquí para cuidar cada uno de tus pasos!'
      });
    }
    
    return spotlight;
  }
  
  private calculatePodologistStats(appointments: Appointment[]) {
    const stats: Record<string, any> = {};
    
    appointments.forEach(appointment => {
      const key = appointment.podologistKey || 'unknown';
      const name = appointment.podologistName || 'Desconocido';
      
      if (!stats[key]) {
        stats[key] = {
          name,
          totalAppointments: 0,
          uniquePatients: new Set(),
          occupancyRate: 0
        };
      }
      
      stats[key].totalAppointments++;
      if (appointment.patientPhone) {
        stats[key].uniquePatients.add(appointment.patientPhone);
      }
    });
    
    return Object.values(stats)
      .map((stat: any) => ({
        name: stat.name,
        totalAppointments: stat.totalAppointments,
        uniquePatients: stat.uniquePatients.size,
        occupancyRate: Math.min(95, Math.round((stat.totalAppointments / 100) * 100))
      }))
      .sort((a, b) => b.totalAppointments - a.totalAppointments)
      .slice(0, 5);
  }
  
  private calculatePeakHours(appointments: Appointment[]) {
    const hourCounts: Record<number, number> = {};
    
    appointments.forEach(appointment => {
      try {
        const hour = appointment.startTime.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      } catch (e) {
        console.error('Error procesando hora:', e);
      }
    });
    
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        label: `${hour}:00`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }
  
  private calculatePeakDays(appointments: Appointment[]) {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayCounts: Record<number, number> = {};
    
    appointments.forEach(appointment => {
      try {
        const day = appointment.startTime.getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      } catch (e) {
        console.error('Error procesando día:', e);
      }
    });
    
    return Object.entries(dayCounts)
      .map(([day, count]) => ({
        day: parseInt(day),
        count,
        label: dayNames[parseInt(day)]
      }))
      .sort((a, b) => b.count - a.count);
  }
}

// Instancia singleton
export const advancedAnalyticsService = new AdvancedAnalyticsService();