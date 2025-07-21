import { NextRequest, NextResponse } from 'next/server';
import { syncService } from '@/lib/sync-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parámetros opcionales
    const podologistKey = searchParams.get('podologist');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Convertir fechas si se proporcionan
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
    console.log(`🕐 Obteniendo slots disponibles para ${podologistKey || 'todos los podólogos'}`);
    
    const availableSlots = await syncService.getAvailableSlots(
      podologistKey || undefined,
      startDate,
      endDate
    );
    
    // Filtrar solo slots futuros
    const futureSlots = availableSlots.filter(slot => slot.startTime > new Date());
    
    // Agrupar por podólogo
    const slotsByPodologist = futureSlots.reduce((acc: any, slot) => {
      if (!acc[slot.podologistKey]) {
        acc[slot.podologistKey] = {
          podologistName: slot.podologistName,
          slots: []
        };
      }
      acc[slot.podologistKey].slots.push({
        id: slot.id,
        startTime: slot.startTime,
        duration: slot.duration,
        calendarId: slot.calendarId
      });
      return acc;
    }, {});
    
    return NextResponse.json({
      success: true,
      totalSlots: futureSlots.length,
      slotsByPodologist,
      filters: {
        podologist: podologistKey,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error obteniendo slots disponibles:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}