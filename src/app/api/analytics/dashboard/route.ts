import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generando KPIs del dashboard PODOPALERMO...');
    
    const kpis = await analyticsService.generateDashboardKPIs();
    
    // Guardar en cache para futuras consultas
    await analyticsService.saveAnalytics(kpis);
    
    return NextResponse.json({
      success: true,
      data: kpis,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error generando KPIs:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Forzar regeneración de KPIs
    console.log('🔄 Regenerando KPIs forzadamente...');
    
    const kpis = await analyticsService.generateDashboardKPIs();
    await analyticsService.saveAnalytics(kpis);
    
    return NextResponse.json({
      success: true,
      message: 'KPIs regenerados exitosamente',
      data: kpis
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}