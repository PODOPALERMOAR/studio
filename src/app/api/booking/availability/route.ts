import { NextRequest, NextResponse } from 'next/server';
import { getCalendarAvailability } from '@/ai/flows/get-calendar-availability';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const podologistKey = searchParams.get('podologistKey') || undefined;

    console.log('📅 Calendar availability request:', { podologistKey });

    const result = await getCalendarAvailability({
      podologistKey
    });

    console.log('✅ Calendar availability response:', {
      slotsFound: result.availableSlots?.length || 0,
      hasError: !!result.error
    });

    return NextResponse.json({
      success: !result.error,
      data: result,
      error: result.error
    });

  } catch (error: any) {
    console.error('❌ Error getting calendar availability:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { podologistKey } = body;

    console.log('📅 Calendar availability POST request:', { podologistKey });

    const result = await getCalendarAvailability({
      podologistKey
    });

    return NextResponse.json({
      success: !result.error,
      data: result,
      error: result.error
    });

  } catch (error: any) {
    console.error('❌ Error getting calendar availability:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}