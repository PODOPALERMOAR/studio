/**
 * Esquemas de Firestore para PODOPALERMO
 * Base de datos optimizada para pacientes, turnos y KPIs
 */

export interface PatientProfile {
  // Identificación única por teléfono normalizado
  id: string; // phoneNumber normalizado sin +
  phoneNumber: string; // +541178334452
  
  // Información personal
  name: string; // Mejor nombre unificado
  alternativeNames: string[]; // Todas las variaciones encontradas
  email: string | null; // Si se loguea con Google
  
  // Datos de autenticación
  firebaseUid: string | null; // Si está registrado en la app
  isRegistered: boolean;
  
  // Métricas de lealtad
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  
  // Fechas importantes
  firstVisit: Date;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Clasificación automática
  loyaltyTier: 'NEW' | 'REGULAR' | 'VIP' | 'PLATINUM';
  isActive: boolean; // Tuvo turno en últimos 6 meses
  
  // Preferencias detectadas
  preferredPodologists: string[]; // IDs de podólogos más visitados
  preferredTimeSlots: string[]; // Horarios más frecuentes
  averageMonthlyVisits: number;
  
  // Información médica básica
  lastTreatmentNotes: string | null;
  specialNeeds: string[];
}

export interface Appointment {
  // Identificación
  id: string; // eventId del calendario
  calendarEventId: string;
  calendarId: string;
  
  // Paciente
  patientPhone: string; // Clave foránea a PatientProfile
  patientName: string; // Nombre en el momento del turno
  
  // Podólogo
  podologistKey: string; // SILVIA, NATALIA, etc.
  podologistName: string;
  
  // Fecha y hora
  startTime: Date;
  endTime: Date;
  duration: number; // minutos
  
  // Estado
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  isFromAvailableSlot: boolean; // Si se creó desde un "Ocupar"
  
  // Metadatos
  originalTitle: string;
  confidence: number; // Confianza del parser
  createdAt: Date;
  updatedAt: Date;
  
  // Información adicional extraída
  paymentInfo?: string; // Si había info de pago en el título
  notes?: string;
}

export interface AvailableSlot {
  // Identificación
  id: string; // eventId del calendario
  calendarEventId: string;
  calendarId: string;
  
  // Podólogo
  podologistKey: string;
  podologistName: string;
  
  // Fecha y hora
  startTime: Date;
  duration: number; // minutos
  
  // Estado
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PodologistStats {
  // Identificación
  podologistKey: string;
  podologistName: string;
  calendarId: string;
  
  // Métricas del mes actual
  currentMonth: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    availableSlots: number;
    occupancyRate: number; // %
    revenue: number; // Si tenemos info de pagos
  };
  
  // Métricas históricas (últimos 12 meses)
  historical: {
    monthlyStats: MonthlyStats[];
    totalPatients: number;
    returningPatients: number;
    newPatients: number;
    averageAppointmentsPerDay: number;
  };
  
  // Top pacientes
  topPatients: {
    phone: string;
    name: string;
    totalVisits: number;
    lastVisit: Date;
  }[];
  
  updatedAt: Date;
}

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  newPatients: number;
  returningPatients: number;
  occupancyRate: number;
  revenue: number;
}

export interface SystemAnalytics {
  // Período de análisis
  periodStart: Date;
  periodEnd: Date;
  
  // KPIs generales
  totalPatients: number;
  activePatients: number; // Últimos 6 meses
  newPatientsThisMonth: number;
  totalAppointments: number;
  
  // Distribución por lealtad
  loyaltyDistribution: {
    NEW: number;
    REGULAR: number;
    VIP: number;
    PLATINUM: number;
  };
  
  // Métricas de rendimiento
  averageOccupancyRate: number;
  peakHours: { hour: number; count: number }[];
  peakDays: { dayOfWeek: number; count: number }[];
  
  // Tendencias
  growthRate: number; // % crecimiento mensual
  retentionRate: number; // % pacientes que regresan
  
  // Por podólogo
  podologistPerformance: {
    podologistKey: string;
    totalAppointments: number;
    occupancyRate: number;
    patientSatisfaction?: number;
  }[];
  
  updatedAt: Date;
}

// Tipos de utilidad
export type LoyaltyTier = 'NEW' | 'REGULAR' | 'VIP' | 'PLATINUM';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PodologistKey = 'SILVIA' | 'NATALIA' | 'ELIZABETH' | 'LORENA' | 'MARTIN' | 'DIANA' | 'LUCIANA';

// Funciones de utilidad para clasificación
export function calculateLoyaltyTier(totalAppointments: number): LoyaltyTier {
  if (totalAppointments >= 20) return 'PLATINUM';
  if (totalAppointments >= 10) return 'VIP';
  if (totalAppointments >= 3) return 'REGULAR';
  return 'NEW';
}

export function isActivePatient(lastVisit: Date): boolean {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return lastVisit > sixMonthsAgo;
}

export function calculateOccupancyRate(totalSlots: number, bookedSlots: number): number {
  if (totalSlots === 0) return 0;
  return Math.round((bookedSlots / totalSlots) * 100);
}