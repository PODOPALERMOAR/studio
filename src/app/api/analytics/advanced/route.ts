import { NextRequest, NextResponse } from 'next/server';
import { advancedAnalyticsService } from '@/lib/advanced-analytics-service';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generando KPIs avanzados del dashboard PODOPALERMO...');
    
    const kpis = await advancedAnalyticsService.generateAdvancedDashboardKPIs();
    
    return NextResponse.json({
      success: true,
      data: kpis,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error generando KPIs avanzados:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Forzar regeneración de KPIs avanzados
    console.log('🔄 Regenerando KPIs avanzados forzadamente...');
    
    const kpis = await advancedAnalyticsService.generateAdvancedDashboardKPIs();
    
    return NextResponse.json({
      success: true,
      message: 'KPIs avanzados regenerados exitosamente',
      data: kpis
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}