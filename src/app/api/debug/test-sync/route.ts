import { NextRequest, NextResponse } from 'next/server';
import { getAllPodopalermoEvents, getSyncDateRange } from '@/lib/google-calendar';

export async function GET() {
  try {
    console.log('🚀 Iniciando prueba de sincronización...');
    
    // Obtener rango de fechas (próximos 7 días para prueba)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    console.log(`📅 Rango: ${now.toISOString()} - ${nextWeek.toISOString()}`);
    
    // Obtener todos los eventos
    const allEvents = await getAllPodopalermoEvents(now, nextWeek);
    
    // Agrupar por podólogo
    const eventsByPodologist = allEvents.reduce((acc, event) => {
      const key = event.podologistKey || 'UNKNOWN';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        podologistName: event.podologistName
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    // Identificar tipos de eventos
    const occupySlots = allEvents.filter(event => 
      event.summary?.toLowerCase().includes('ocupar')
    );
    
    const appointments = allEvents.filter(event => 
      event.summary?.includes('N:') && event.summary?.includes('T:')
    );
    
    const payments = allEvents.filter(event => 
      event.summary?.toLowerCase().includes('pago')
    );
    
    return NextResponse.json({
      success: true,
      summary: {
        totalEvents: allEvents.length,
        occupySlots: occupySlots.length,
        appointments: appointments.length,
        payments: payments.length,
        podologists: Object.keys(eventsByPodologist).length
      },
      eventsByPodologist,
      sampleEvents: {
        occupySlots: occupySlots.slice(0, 3).map(e => ({
          summary: e.summary,
          start: e.start,
          podologist: e.podologistName
        })),
        appointments: appointments.slice(0, 3).map(e => ({
          summary: e.summary,
          start: e.start,
          podologist: e.podologistName
        })),
        payments: payments.slice(0, 3).map(e => ({
          summary: e.summary,
          start: e.start,
          podologist: e.podologistName
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de sincronización:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}