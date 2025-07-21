import { NextRequest, NextResponse } from 'next/server';
import { bookingConversation } from '@/ai/flows/booking-conversation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, metadata, userInput } = body;

    console.log('🔵 API Call:', { action, userInput, metadata });

    // Validar que la acción sea proporcionada
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Se requiere una acción' },
        { status: 400 }
      );
    }

    // Procesar la conversación
    const result = await bookingConversation({
      action,
      message: userInput,
      metadata,
      paymentProof: body.paymentProof,
      userInfo: body.userInfo,
    });

    console.log('🟢 API Response:', { message: result.response, optionsCount: result.options?.length });

    // Formatear la respuesta para el cliente
    return NextResponse.json({
      success: true,
      data: {
        message: result.response,
        options: result.options,
        needsInput: result.needsInput,
        inputType: result.inputType,
        inputPlaceholder: result.inputPlaceholder,
        metadata: metadata || {},
      }
    });
  } catch (error: any) {
    console.error('🔴 Error en API de conversación:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error procesando la solicitud',
        details: error.message 
      },
      { status: 500 }
    );
  }
}