
'use server';
/**
 * @fileOverview Fetches pre-computed patient analytics from the Firestore cache.
 * It reads the main analytics document for KPIs and then assembles the full
 * patient list from multiple sharded documents in a subcollection.
 *
 * - getPatientAnalyticsFromCache - A function that returns cached analytics data.
 * - GetPatientAnalyticsFromCacheOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestoreAdmin } from '@/lib/firebase/admin';
import type { PatientAnalyticsData, PatientProfile } from './getPatientAnalytics';
import { Timestamp } from 'firebase-admin/firestore';

const GetPatientAnalyticsFromCacheOutputSchema = z.object({
  analytics: z.any().describe("The full patient analytics data object, including KPIs and chart data."),
  lastUpdated: z.string().datetime().nullable().describe("ISO string of when the cache was last updated."),
  error: z.string().optional(),
});
export type GetPatientAnalyticsFromCacheOutput = z.infer<typeof GetPatientAnalyticsFromCacheOutputSchema>;

export async function getPatientAnalyticsFromCache(): Promise<GetPatientAnalyticsFromCacheOutput> {
  return getPatientAnalyticsFromCacheFlow({});
}

const getPatientAnalyticsFromCacheFlow = ai.defineFlow(
  {
    name: 'getPatientAnalyticsFromCacheFlow',
    inputSchema: z.object({}), // No input needed
    outputSchema: GetPatientAnalyticsFromCacheOutputSchema,
  },
  async () => {
    try {
      const mainCacheRef = firestoreAdmin.collection('systemCache').doc('patientAnalytics');
      const mainCacheDoc = await mainCacheRef.get();

      if (!mainCacheDoc.exists) {
        return {
          analytics: {
            patients: [],
            kpis: { totalActivePatients: 0, newPatientsThisMonth: 0, atRiskPatients: 0, secondAppointmentRetentionRate: 0, visitFrequencyPerYear: 0, quarterlyChurnRate: 0, averageReturnTimeDays: 0 },
            monthlyChartData: []
          },
          lastUpdated: null,
          error: "Aún no se han analizado los datos de los pacientes. Haz clic en 'Actualizar Ahora' para generar el primer reporte. Este proceso puede tardar unos minutos.",
        };
      }

      const mainCacheData = mainCacheDoc.data()!;
      
      // Fetch all profile shards from the subcollection
      const profilesCollectionRef = mainCacheRef.collection('profiles');
      const profilesSnapshot = await profilesCollectionRef.orderBy('__name__').get();
      
      let allPatients: PatientProfile[] = [];
      profilesSnapshot.forEach(doc => {
        const shardData = doc.data();
        if (shardData.profiles && Array.isArray(shardData.profiles)) {
          allPatients = allPatients.concat(shardData.profiles);
        }
      });
      
      const analyticsData = {
          patients: allPatients,
          kpis: mainCacheData.kpis || { totalActivePatients: 0, newPatientsThisMonth: 0, atRiskPatients: 0, secondAppointmentRetentionRate: 0, visitFrequencyPerYear: 0, quarterlyChurnRate: 0, averageReturnTimeDays: 0 },
          monthlyChartData: mainCacheData.monthlyChartData || []
      } as PatientAnalyticsData;

      const lastUpdatedTimestamp = mainCacheData.lastUpdated as Timestamp | undefined;

      return {
        analytics: analyticsData,
        lastUpdated: lastUpdatedTimestamp ? lastUpdatedTimestamp.toDate().toISOString() : null,
      };

    } catch (error: any) {
      console.error("[getPatientAnalyticsFromCache] Error fetching from cache:", error);
      return {
        analytics: {
            patients: [],
            kpis: { totalActivePatients: 0, newPatientsThisMonth: 0, atRiskPatients: 0, secondAppointmentRetentionRate: 0, visitFrequencyPerYear: 0, quarterlyChurnRate: 0, averageReturnTimeDays: 0 },
            monthlyChartData: []
        },
        lastUpdated: null,
        error: "No se pudo leer el caché de analíticas desde la base de datos.",
      };
    }
  }
);

    
