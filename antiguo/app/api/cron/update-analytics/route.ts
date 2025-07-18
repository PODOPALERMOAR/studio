
import { NextResponse } from 'next/server';
import { updatePatientAnalyticsCache } from '@/ai/flows/updatePatientAnalyticsCache';

export async function GET(request: Request) {
  // IMPORTANT: This header is set by Google Cloud Scheduler and is used to
  // verify that the request is a legitimate cron job.
  const isCron = request.headers.get('X-Appengine-Cron') === 'true';

  // In local development, this header won't be present.
  // We allow the cron to run if we're not in a production environment.
  if (process.env.NODE_ENV !== 'production' || isCron) {
    try {
      console.log('Cron job /api/cron/update-analytics started.');
      const result = await updatePatientAnalyticsCache();
      
      if (!result.success) {
        console.error('Cron job failed:', result.message, 'Error:', result.error);
        return NextResponse.json(
          { success: false, message: 'Cron job execution failed.', error: result.error },
          { status: 500 }
        );
      }

      console.log('Cron job /api/cron/update-analytics finished successfully.');
      return NextResponse.json({ success: true, message: result.message });
      
    } catch (error: any) {
      console.error('Cron job threw an unhandled exception:', error);
      return NextResponse.json(
        { success: false, message: 'An unexpected error occurred during cron execution.', error: error.message },
        { status: 500 }
      );
    }
  }

  // If the request is not from a cron job and we are in production, deny access.
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}
