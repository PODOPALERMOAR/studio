/**
 * Servicio de Analytics para PODOPALERMO
 * Genera KPIs y métricas en tiempo real
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  PatientProfile, 
  Appointment, 
  SystemAnalytics,
  PodologistStats,
  MonthlyStats,
  LoyaltyTier,
  calculateLoyaltyTier,
  isActivePatient
} from './firestore-schema';

export interface DashboardKPIs {
  // KPIs principales
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  totalAppointments: number;
  
  // Métricas de crecimiento
  growthRate: number; // % crecimiento mensual
  retentionRate: number; // % pacientes que regresan
  averageAppointmentsPerPatient: number;
  
  // Distribución por lealtad
  loyaltyDistribution: {
    NEW: number;
    REGULAR: number;
    VIP: number;
    PLATINUM: number;
  };
  
  // Top podólogos
  topPodologists: {
    name: string;
    totalAppointments: number;
    uniquePatients: number;
    occupancyRate: number;
  }[];
  
  // Horarios pico
  peakHours: { hour: number; count: number; label: string }[];
  peakDays: { day: number; count: number; label: string }[];
  
  // Pacientes más frecuentes
  topPatients: {
    name: string;
    phone: string;
    totalVisits: number;
    lastVisit: Date;
    loyaltyTier: LoyaltyTier;
  }[];
  
  // Métricas mensuales (últimos 6 meses)
  monthlyTrends: {
    month: string;
    appointments: number;
    newPatients: number;
    revenue: number;
  }[];
}

export class AnalyticsService {
  
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
   * Genera KPIs completos del dashboard
   */
  async generateDashboardKPIs(): Promise<DashboardKPIs> {
    console.log('📊 Generando KPIs del dashboard...');
    
    try {
      // Obtener todos los pacientes
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const patients = patientsSnapshot.docs.map(doc => {
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
      
      console.log(`📊 Procesando ${patients.length} pacientes y ${appointments.length} turnos...`);
      
      // Calcular KPIs principales
      const totalPatients = patients.length;
      
      // Pacientes activos (último turno en los últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const activePatients = patients.filter(p => p.lastVisit >= sixMonthsAgo).length;
      
      // Pacientes nuevos este mes
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const newPatientsThisMonth = patients.filter(p => p.createdAt >= thisMonth).length;
      
      const totalAppointments = appointments.length;
      const averageAppointmentsPerPatient = totalPatients > 0 ? totalAppointments / totalPatients : 0;
      
      // Distribución por lealtad
      const loyaltyDistribution = {
        NEW: 0,
        REGULAR: 0,
        VIP: 0,
        PLATINUM: 0
      };
      
      patients.forEach(patient => {
        const tier = patient.loyaltyTier || 'NEW';
        if (loyaltyDistribution[tier] !== undefined) {
          loyaltyDistribution[tier]++;
        } else {
          loyaltyDistribution.NEW++;
        }
      });
      
      // Top podólogos
      const podologistStats = this.calculatePodologistStats(appointments);
      const topPodologists = Object.values(podologistStats)
        .sort((a, b) => b.totalAppointments - a.totalAppointments)
        .slice(0, 5)
        .map(stat => ({
          name: stat.name,
          totalAppointments: stat.totalAppointments,
          uniquePatients: stat.uniquePatients,
          occupancyRate: stat.occupancyRate
        }));
      
      // Horarios y días pico
      const peakHours = this.calculatePeakHours(appointments);
      const peakDays = this.calculatePeakDays(appointments);
      
      // Top pacientes
      const topPatients = patients
        .sort((a, b) => (b.totalAppointments || 0) - (a.totalAppointments || 0))
        .slice(0, 10)
        .map(patient => ({
          name: patient.name || 'Sin nombre',
          phone: patient.phoneNumber || '',
          totalVisits: patient.totalAppointments || 0,
          lastVisit: patient.lastVisit || new Date(),
          loyaltyTier: patient.loyaltyTier || 'NEW'
        }));
      
      // Tendencias mensuales
      const monthlyTrends = this.calculateMonthlyTrends(appointments, patients);
      
      // Calcular tasas de crecimiento y retención
      const growthRate = this.calculateGrowthRate(monthlyTrends);
      const retentionRate = this.calculateRetentionRate(patients);
      
      const kpis: DashboardKPIs = {
        totalPatients,
        activePatients,
        newPatientsThisMonth,
        totalAppointments,
        growthRate,
        retentionRate,
        averageAppointmentsPerPatient: Math.round(averageAppointmentsPerPatient * 100) / 100,
        loyaltyDistribution,
        topPodologists,
        peakHours,
        peakDays,
        topPatients,
        monthlyTrends
      };
      
      console.log('✅ KPIs generados exitosamente');
      return kpis;
      
    } catch (error) {
      console.error('❌ Error generando KPIs:', error);
      throw error;
    }
  }
  
  /**
   * Calcula estadísticas por podólogo
   */
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
    
    // Convertir Set a número
    Object.keys(stats).forEach(key => {
      stats[key].uniquePatients = stats[key].uniquePatients.size;
      // Calcular tasa de ocupación (simplificada)
      stats[key].occupancyRate = Math.min(95, Math.round((stats[key].totalAppointments / 100) * 100));
    });
    
    return stats;
  }
  
  /**
   * Calcula horarios pico
   */
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
  
  /**
   * Calcula días pico
   */
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
  
  /**
   * Calcula tendencias mensuales
   */
  private calculateMonthlyTrends(appointments: Appointment[], patients: PatientProfile[]) {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const trends: Record<string, any> = {};
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      trends[key] = {
        month: label,
        appointments: 0,
        newPatients: 0,
        revenue: 0
      };
    }
    
    // Contar turnos por mes
    appointments.forEach(appointment => {
      try {
        const date = appointment.startTime;
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (trends[key]) {
          trends[key].appointments++;
          trends[key].revenue += 15000; // Precio promedio estimado
        }
      } catch (e) {
        console.error('Error procesando tendencia mensual:', e);
      }
    });
    
    // Contar pacientes nuevos por mes
    patients.forEach(patient => {
      try {
        const date = patient.createdAt;
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (trends[key]) {
          trends[key].newPatients++;
        }
      } catch (e) {
        console.error('Error procesando paciente nuevo:', e);
      }
    });
    
    return Object.values(trends);
  }
  
  /**
   * Calcula tasa de crecimiento
   */
  private calculateGrowthRate(monthlyTrends: any[]): number {
    if (monthlyTrends.length < 2) return 0;
    
    const current = monthlyTrends[monthlyTrends.length - 1].appointments;
    const previous = monthlyTrends[monthlyTrends.length - 2].appointments;
    
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }
  
  /**
   * Calcula tasa de retención
   */
  private calculateRetentionRate(patients: PatientProfile[]): number {
    const returningPatients = patients.filter(p => (p.totalAppointments || 0) > 1).length;
    return patients.length > 0 ? Math.round((returningPatients / patients.length) * 100) : 0;
  }
  
  /**
   * Guarda analytics en Firestore para cache
   */
  async saveAnalytics(kpis: DashboardKPIs) {
    try {
      const analyticsDoc: SystemAnalytics = {
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
        periodEnd: new Date(),
        totalPatients: kpis.totalPatients,
        activePatients: kpis.activePatients,
        newPatientsThisMonth: kpis.newPatientsThisMonth,
        totalAppointments: kpis.totalAppointments,
        loyaltyDistribution: kpis.loyaltyDistribution,
        averageOccupancyRate: kpis.topPodologists.reduce((acc, p) => acc + p.occupancyRate, 0) / kpis.topPodologists.length,
        peakHours: kpis.peakHours,
        peakDays: kpis.peakDays,
        growthRate: kpis.growthRate,
        retentionRate: kpis.retentionRate,
        podologistPerformance: kpis.topPodologists.map(p => ({
          podologistKey: p.name.toUpperCase().replace('Ó', 'O').replace(/[^A-Z]/g, ''),
          totalAppointments: p.totalAppointments,
          occupancyRate: p.occupancyRate
        })),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'analytics', 'dashboard'), analyticsDoc);
      console.log('💾 Analytics guardados en cache');
    } catch (error) {
      console.error('❌ Error guardando analytics:', error);
    }
  }
}

// Instancia singleton
export const analyticsService = new AnalyticsService();