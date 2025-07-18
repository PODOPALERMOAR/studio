
'use server';
/**
 * @fileOverview Runs getPatientAnalytics, then saves the results to Firestore,
 * sharding the large patient profile list into multiple documents to avoid
 * the 1MB document size limit.
 *
 * - updatePatientAnalyticsCache - A function to trigger the update.
 * - UpdatePatientAnalyticsCacheOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { firestoreAdmin } from '@/lib/firebase/admin';
import { getPatientAnalytics } from './getPatientAnalytics';
import { Timestamp } from 'firebase-admin/firestore';

const UpdatePatientAnalyticsCacheOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  updatedAt: z.string().datetime().optional(),
  error: z.string().optional(),
  analyticsDebugInfo: z.string().optional(),
});
export type UpdatePatientAnalyticsCacheOutput = z.infer<typeof UpdatePatientAnalyticsCacheOutputSchema>;

export async function updatePatientAnalyticsCache(): Promise<UpdatePatientAnalyticsCacheOutput> {
  return updatePatientAnalyticsCacheFlow({});
}

const updatePatientAnalyticsCacheFlow = ai.defineFlow(
  {
    name: 'updatePatientAnalyticsCacheFlow',
    inputSchema: z.object({}), // No input needed
    outputSchema: UpdatePatientAnalyticsCacheOutputSchema,
  },
  async () => {
    try {
      console.log("[Cache Update] Starting getPatientAnalytics flow...");
      const analyticsResult = await getPatientAnalytics();
      console.log("[Cache Update] getPatientAnalytics flow finished.");

      if (analyticsResult.error) {
        throw new Error(`Analytics generation failed: ${analyticsResult.error}`);
      }
      
      const mainCacheRef = firestoreAdmin.collection('systemCache').doc('patientAnalytics');
      const profilesCollectionRef = mainCacheRef.collection('profiles');
      const updatedTimestamp = Timestamp.now();
      
      // 1. Delete old profile shards before writing new ones
      const oldShardsSnapshot = await profilesCollectionRef.get();
      if (!oldShardsSnapshot.empty) {
        const deleteBatch = firestoreAdmin.batch();
        oldShardsSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        console.log(`[Cache Update] Deleted ${oldShardsSnapshot.size} old profile shards.`);
      }

      // 2. Shard the new profiles and write them in batches
      const allProfiles = analyticsResult.patients;
      const CHUNK_SIZE = 400; // Keep it safely under the 1MB limit
      const profileChunks = [];
      for (let i = 0; i < allProfiles.length; i += CHUNK_SIZE) {
        profileChunks.push(allProfiles.slice(i, i + CHUNK_SIZE));
      }

      if (profileChunks.length > 0) {
        const writeBatch = firestoreAdmin.batch();
        profileChunks.forEach((chunk, index) => {
          const shardRef = profilesCollectionRef.doc(`shard_${String(index).padStart(3, '0')}`);
          writeBatch.set(shardRef, { profiles: chunk });
        });
        await writeBatch.commit();
        console.log(`[Cache Update] Wrote ${profileChunks.length} new profile shards.`);
      }

      // 3. Prepare and write the main document with aggregated data only
      const mainCacheData = {
        kpis: analyticsResult.kpis,
        monthlyChartData: analyticsResult.monthlyChartData,
        lastUpdated: updatedTimestamp,
        patientCount: analyticsResult.patients.length,
        shardCount: profileChunks.length,
      };
      await mainCacheRef.set(mainCacheData);

      const successMessage = `Caché de analíticas actualizado exitosamente. ${analyticsResult.patients.length} perfiles de pacientes guardados en ${profileChunks.length} fragmentos.`;
      console.log(`[Cache Update] ${successMessage}`);

      return {
        success: true,
        message: successMessage,
        updatedAt: updatedTimestamp.toDate().toISOString(),
        analyticsDebugInfo: analyticsResult.debugInfo,
      };

    } catch (error: any) {
      console.error("[Cache Update] CRITICAL ERROR updating patient analytics cache:", error);
      return {
        success: false,
        message: "Falló la actualización del caché de analíticas.",
        error: error.message || "Unknown error occurred.",
      };
    }
  }
);

    