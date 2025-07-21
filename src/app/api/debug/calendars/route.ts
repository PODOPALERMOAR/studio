import { NextRequest, NextResponse } from 'next/server';
import { initializeCalendarClient } from '@/lib/google-calendar';

export async function GET() {
  try {
    console.log('🔍 Iniciando debug de calendarios...');
    console.log('📋 Variables de entorno:');
    console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID);
    console.log('- GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL);
    console.log('- GOOGLE_PRIVATE_KEY_ID:', process.env.GOOGLE_PRIVATE_KEY_ID);
    console.log('- GOOGLE_PRIVATE_KEY existe:', !!process.env.GOOGLE_PRIVATE_KEY);
    
    const calendar = initializeCalendarClient();
    console.log('✅ Cliente de calendario inicializado');
    
    // Obtener lista de calendarios
    console.log('📅 Obteniendo lista de calendarios...');
    const calendarList = await calendar.calendarList.list();
    console.log('📊 Respuesta de Google Calendar:', calendarList.data);
    
    const calendars = calendarList.data.items?.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary,
      accessRole: cal.accessRole
    })) || [];
    
    console.log(`✅ ${calendars.length} calendarios encontrados`);
    
    return NextResponse.json({
      success: true,
      calendars,
      total: calendars.length,
      debug: {
        hasCredentials: !!process.env.GOOGLE_PRIVATE_KEY,
        projectId: process.env.GOOGLE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo calendarios:', error);
    
    // Log más detallado del error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null
    }, { status: 500 });
  }
}