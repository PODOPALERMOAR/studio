import { NextRequest, NextResponse } from 'next/server';
import { syncService } from '@/lib/sync-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando sincronización completa PODOPALERMO...');
    
    const result = await syncService.fullSync();
    
    if (result.success) {
      console.log('✅ Sincronización completa exitosa');
      return NextResponse.json({
        success: true,
        message: 'Sincronización completa exitosa',
        stats: result.stats,
        errors: result.errors
      });
    } else {
      console.log('⚠️ Sincronización completada con errores');
      return NextResponse.json({
        success: false,
        message: 'Sincronización completada con errores',
        stats: result.stats,
        errors: result.errors
      }, { status: 207 }); // Multi-status
    }
    
  } catch (error: any) {
    console.error('❌ Error en sincronización completa:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Endpoint para obtener el estado de la última sincronización
  try {
    // TODO: Implementar obtención del estado desde Firestore
    return NextResponse.json({
      lastSync: new Date().toISOString(),
      status: 'ready'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}