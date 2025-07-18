'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Send, MessageCircle, Calendar, Clock, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingDots } from '@/components/common/LoadingDots';
// import { bookingConversation } from '@/ai/flows/booking-conversation';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  options?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'preference' | 'slots' | 'details' | 'payment' | 'confirmed'>('greeting');
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    reason: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensaje inicial
      setTimeout(() => {
        addBotMessage(
          "¡Hola! Soy tu asistente para agendar turnos de podología. ¿Cómo te gustaría buscar tu turno?",
          [
            { label: "Próximo turno disponible", action: "next_available" },
            { label: "Elegir día y horario", action: "choose_time" },
            { label: "Podólogo específico", action: "choose_doctor" }
          ]
        );
        setCurrentStep('preference');
      }, 500);
    }
  }, [isOpen]);

  const addBotMessage = (content: string, options?: Message['options']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionClick = async (option: Message['options'][0]) => {
    addUserMessage(option.label);
    setIsLoading(true);

    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (option.action) {
      case 'next_available':
        addBotMessage(
          "Perfecto. Estos son los próximos turnos disponibles:",
          [
            { label: "Mañana 10:00 AM - Dr. García", action: "select_slot", data: { date: "Mañana", time: "10:00 AM", doctor: "Dr. García" } },
            { label: "Pasado mañana 2:30 PM - Dra. López", action: "select_slot", data: { date: "Pasado mañana", time: "2:30 PM", doctor: "Dra. López" } },
            { label: "Ver más opciones", action: "more_options" }
          ]
        );
        setCurrentStep('slots');
        break;

      case 'choose_time':
        addBotMessage(
          "¿Qué día te viene mejor?",
          [
            { label: "Esta semana", action: "this_week" },
            { label: "Próxima semana", action: "next_week" },
            { label: "Cualquier día", action: "any_day" }
          ]
        );
        setCurrentStep('slots');
        break;

      case 'choose_doctor':
        addBotMessage(
          "Estos son nuestros podólogos disponibles:",
          [
            { label: "Dr. García - Pie diabético", action: "doctor_garcia" },
            { label: "Dra. López - Podología deportiva", action: "doctor_lopez" },
            { label: "Dr. Martínez - Podología general", action: "doctor_martinez" }
          ]
        );
        setCurrentStep('slots');
        break;

      case 'select_slot':
        setCurrentStep('details');
        addBotMessage(
          `Excelente elección: ${option.data.date} a las ${option.data.time} con ${option.data.doctor}.\n\nPara confirmar tu turno, necesito algunos datos:`,
          [
            { label: "Continuar con mis datos", action: "provide_details" }
          ]
        );
        break;

      case 'provide_details':
        addBotMessage("Por favor, decime tu nombre completo:");
        setCurrentStep('details');
        break;

      case 'show_payment':
        addBotMessage(
          `💰 Datos para transferencia:\n\n• Banco: Santander\n• CBU: 0720123456789012345678\n• Alias: FOOT.HAVEN.PAGO\n• Titular: Foot Haven SRL\n• Monto: $10.000\n\nUna vez que hagas la transferencia, subí el comprobante y te confirmaremos el turno.`,
          [
            { label: "Ya hice la transferencia", action: "payment_done" },
            { label: "Cambiar turno", action: "change_slot" }
          ]
        );
        setCurrentStep('payment');
        break;

      case 'payment_done':
        addBotMessage(
          `🎉 ¡Perfecto! Tu turno ha sido confirmado.\n\n📅 Resumen:\n• ${option.data?.date || 'Fecha'} a las ${option.data?.time || 'Hora'}\n• ${option.data?.doctor || 'Doctor'}\n• Paciente: ${userInfo.name}\n\n📍 Dirección: Av. Santa Fe 3288, CABA\n\nTe enviaremos un recordatorio por WhatsApp 24hs antes.`,
          [
            { label: "Agendar otro turno", action: "new_booking" },
            { label: "Finalizar", action: "close" }
          ]
        );
        setCurrentStep('confirmed');
        break;

      case 'close':
        onClose();
        break;

      default:
        addBotMessage("Entendido. ¿Te ayudo con algo más?");
    }

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const message = inputValue.trim();
    addUserMessage(message);
    setInputValue('');
    setIsLoading(true);

    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 800));

    // Lógica basada en el paso actual
    switch (currentStep) {
      case 'details':
        if (!userInfo.name) {
          setUserInfo(prev => ({ ...prev, name: message }));
          addBotMessage(`Gracias ${message}. Ahora necesito tu número de teléfono:`);
        } else if (!userInfo.phone) {
          setUserInfo(prev => ({ ...prev, phone: message }));
          addBotMessage(
            "Perfecto. ¿Hay algún motivo específico para tu visita? (opcional)",
            [
              { label: "Continuar sin especificar", action: "skip_reason" },
              { label: "Escribir motivo", action: "write_reason" }
            ]
          );
        } else {
          setUserInfo(prev => ({ ...prev, reason: message }));
          addBotMessage(
            "¡Listo! Tu turno está casi confirmado. Para finalizar, necesito que realices el pago de $10.000.",
            [
              { label: "Ver datos para transferencia", action: "show_payment" }
            ]
          );
          setCurrentStep('payment');
        }
        break;

      default:
        // Respuesta inteligente básica
        if (message.toLowerCase().includes('turno') || message.toLowerCase().includes('cita')) {
          addBotMessage(
            "Te ayudo a encontrar un turno. ¿Cómo te gustaría buscarlo?",
            [
              { label: "Próximo turno disponible", action: "next_available" },
              { label: "Elegir día y horario", action: "choose_time" }
            ]
          );
        } else if (message.toLowerCase().includes('dolor') || message.toLowerCase().includes('molestia')) {
          addBotMessage(
            "Entiendo que tenés una molestia. Es importante que te vea un podólogo pronto. Te busco el turno más cercano:",
            [
              { label: "Sí, buscar turno urgente", action: "next_available" }
            ]
          );
        } else {
          addBotMessage(
            "Entiendo. ¿Podrías elegir una de las opciones que te mostré arriba, o decime si necesitás algo específico?"
          );
        }
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold">Asistente de Turnos</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.type === 'user'
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-800"
                )}
              >
                <p className="text-sm">{message.content}</p>

                {/* Options */}
                {message.options && (
                  <div className="mt-3 space-y-2">
                    {message.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <LoadingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}