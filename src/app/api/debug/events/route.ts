import { NextRequest, NextResponse } from 'next/server';
import { initializeCalendarClient } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    
    const calendar = initializeCalendarClient();
    
    // Obtener eventos de los próximos 7 días
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const events = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50
    });
    
    const eventList = events.data.items?.map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      description: event.description,
      creator: event.creator
    })) || [];
    
    return NextResponse.json({
      success: true,
      calendarId,
      events: eventList,
      total: eventList.length
    });
    
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}