import { NextRequest, NextResponse } from 'next/server';
import { getAllPodopalermoEvents, getSyncDateRange } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Iniciando test de conexión con calendarios PODOPALERMO...');
    
    // Obtener rango de fechas (solo próximos 7 días para test)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 7);
    
    console.log(`📅 Probando conexión desde ${now.toISOString()} hasta ${endDate.toISOString()}`);
    
    // Intentar obtener eventos de todos los calendarios
    const events = await getAllPodopalermoEvents(now, endDate);
    
    console.log(`✅ Test exitoso: ${events.length} eventos obtenidos`);
    
    // Estadísticas por calendario
    const calendarStats = events.reduce((acc: any, event: any) => {
      const podologist = event.podologistName;
      if (!acc[podologist]) {
        acc[podologist] = 0;
      }
      acc[podologist]++;
      return acc;
    }, {});
    
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con calendarios PODOPALERMO',
      stats: {
        totalEvents: events.length,
        calendarStats,
        dateRange: {
          start: now.toISOString(),
          end: endDate.toISOString()
        }
      },
      sampleEvents: events.slice(0, 5).map((event: any) => ({
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        podologist: event.podologistName
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Error en test de calendarios:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}