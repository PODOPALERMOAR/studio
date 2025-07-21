import { NextRequest, NextResponse } from 'next/server';
import { initializeCalendarClient } from '@/lib/google-calendar';

export async function GET() {
  try {
    console.log('🔍 Probando acceso directo a calendarios específicos...');
    
    const calendar = initializeCalendarClient();
    
    // IDs de los calendarios según tu documentación
    const calendarIds = [
      '6f9ede745ce9d3277a7759b8eb7d85328322e7f471d4d576e7371c298b861caa@group.calendar.google.com', // SILVIA
      'c43f26136a6884b6de70e89b41bc214a3302b7ac504680ae62e1ff27f41419b7@group.calendar.google.com', // LORENA
      'cb98de7b1dc8027f82bdc74f02761a71e681bfc7634756a27ee820e822d05b23@group.calendar.google.com', // MARTIN
    ];
    
    const results = [];
    
    for (const calendarId of calendarIds) {
      try {
        console.log(`📅 Probando calendario: ${calendarId}`);
        
        // Intentar obtener información del calendario
        const calendarInfo = await calendar.calendars.get({
          calendarId: calendarId
        });
        
        console.log(`✅ Calendario encontrado: ${calendarInfo.data.summary}`);
        
        // Intentar obtener eventos
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        
        const events = await calendar.events.list({
          calendarId: calendarId,
          timeMin: now.toISOString(),
          timeMax: nextWeek.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 10
        });
        
        results.push({
          calendarId,
          name: calendarInfo.data.summary,
          success: true,
          eventsCount: events.data.items?.length || 0,
          events: events.data.items?.map(event => ({
            id: event.id,
            summary: event.summary,
            start: event.start,
            end: event.end
          })) || []
        });
        
      } catch (error) {
        console.error(`❌ Error con calendario ${calendarId}:`, error);
        results.push({
          calendarId,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      totalTested: calendarIds.length
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}