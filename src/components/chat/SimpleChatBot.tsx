'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  options?: Array<{
    label: string;
    action: string;
    metadata?: any;
  }>;
}

let globalInitialized = false;

export default function SimpleChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, isBot: boolean, options?: any[]) => {
    if (!mountedRef.current) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      isBot,
      options
    };
    
    console.log('📝 Adding message:', newMessage.id, text.substring(0, 30) + '...');
    setMessages(prev => [...prev, newMessage]);
  };

  const callAPI = async (action: string) => {
    try {
      console.log('🔵 Calling API with action:', action);
      const response = await fetch('/api/booking/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const result = await response.json();
      console.log('🟢 API Response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la API');
      }

      return result.data;
    } catch (error: any) {
      console.error('🔴 API Error:', error);
      throw error;
    }
  };

  const handleSendMessage = async (message?: string, action?: string) => {
    const messageToSend = message || inputValue.trim();
    
    if (messageToSend && !action) {
      addMessage(messageToSend, false);
      setInputValue('');
    }

    if (action && message) {
      addMessage(message, false);
    }

    setIsLoading(true);

    try {
      const actionToSend = action || 'userMessage';
      const response = await callAPI(actionToSend);
      
      if (mountedRef.current) {
        addMessage(response.message, true, response.options);
      }
    } catch (error) {
      if (mountedRef.current) {
        addMessage('Error: No se pudo procesar tu solicitud.', true);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleOptionClick = (option: any) => {
    handleSendMessage(option.label, option.action);
  };

  const initializeChat = async () => {
    if (globalInitialized) {
      console.log('🟡 Chat already initialized globally');
      return;
    }

    console.log('🟢 Initializing chat for the first time');
    globalInitialized = true;
    setIsLoading(true);

    try {
      const response = await callAPI('start');
      if (mountedRef.current) {
        addMessage(response.message, true, response.options);
      }
    } catch (error) {
      if (mountedRef.current) {
        addMessage('¡Hola! Soy tu asistente virtual de PODOPALERMO. Hubo un problema al inicializar, pero estoy aquí para ayudarte.', true);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('🔵 SimpleChatBot mounted');
    initializeChat();
    
    return () => {
      console.log('🔴 SimpleChatBot unmounted');
      mountedRef.current = false;
      globalInitialized = false; // Reset para permitir nueva inicialización
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <div>
            <span className="font-semibold">Asistente PODOPALERMO</span>
            <div className="text-xs opacity-90">Reserva tu turno 24/7</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.isBot
                  ? 'bg-white text-gray-800 shadow-sm border'
                  : 'bg-green-600 text-white'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.isBot && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  {message.options && (
                    <div className="mt-3 space-y-2">
                      {message.options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                          onClick={() => handleOptionClick(option)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {!message.isBot && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-green-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Powered by PODOPALERMO AI Assistant
        </div>
      </div>
    </div>
  );
}