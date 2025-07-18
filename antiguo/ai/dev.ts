
// This file imports all flows to be available in development.

import '@/ai/flows/get-calendar-availability.ts';
import '@/ai/flows/start-booking-conversation.ts';
import '@/ai/flows/findNextAvailableSlot.ts';
import '@/ai/flows/create-appointment.ts';
import '@/ai/flows/findSlotsByPreference.ts';
import '@/ai/flows/getUserAppointments.ts';
import '@/ai/flows/checkIfUserExistsByPhone.ts';
import '@/ai/flows/verify-payment-and-create-appointment.ts';
import '@/ai/flows/getPatientAnalytics.ts';
import '@/ai/flows/updatePatientAnalyticsCache.ts';
import '@/ai/flows/getPatientAnalyticsFromCache.ts';
import '@/ai/flows/getPatientAppointmentDetails.ts';
// The following flows are deprecated or have been removed as part of the architecture optimization.
// import '@/ai/flows/checkIfFrequentPatient.ts';
// import '@/ai/flows/getConfirmedAppointmentsForAdmin.ts'; 
// import '@/ai/flows/getPatientLoyaltyAnalysis.ts'; 
