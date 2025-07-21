'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export default function TestChatBot() {
  const [messages, setMessages] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('🔵 TestChatBot mounted');
    
    if (!initialized) {
      console.log('🟢 Initializing test chat');
      setInitialized(true);
      setMessages(['¡Hola! Soy tu asistente virtual de PODOPALERMO. Estoy aquí para ayudarte a encontrar y reservar tu próximo turno. ¿Qué te gustaría hacer?']);
    }

    return () => {
      console.log('🔴 TestChatBot unmounted');
    };
  }, [initialized]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <div>
            <span className="font-semibold">Asistente PODOPALERMO (TEST)</span>
            <div className="text-xs opacity-90">Reserva tu turno 24/7</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div key={`test-msg-${index}`} className="flex justify-start">
            <div className="max-w-[85%] rounded-lg p-3 bg-white text-gray-800 shadow-sm border">
              <div className="flex items-start space-x-2">
                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
                  <div className="mt-3 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                    >
                      Buscar próximo turno disponible
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                    >
                      Elegir podólogo específico
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="text-xs text-gray-500 text-center">
          Componente de prueba - Powered by PODOPALERMO AI Assistant
        </div>
      </div>
    </div>
  );
}