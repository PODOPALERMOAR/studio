'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, ExternalLink, UploadCloud } from 'lucide-react';
import ChatSingleton from '@/lib/chat-singleton';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  options?: Array<{
    label: string;
    action: string;
    metadata?: any;
  }>;
  needsInput?: boolean;
  inputPlaceholder?: string;
}

interface ConversationState {
  currentAction?: string;
  metadata?: any;
  userInfo?: {
    name?: string;
    phone?: string;
    reason?: string;
  };
  paymentProof?: string;
}

export default function EmbeddedChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({});
  const [isFileUploadMode, setIsFileUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, isBot: boolean, options?: any[], needsInput?: boolean, inputPlaceholder?: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      isBot,
      timestamp: new Date(),
      options,
      needsInput,
      inputPlaceholder
    };
    console.log('📝 Adding message:', { id: newMessage.id, text: text.substring(0, 50) + '...', isBot });
    setMessages(prev => {
      console.log('📝 Current messages count:', prev.length, 'Adding new message, total will be:', prev.length + 1);
      return [...prev, newMessage];
    });
    
    if (isBot && needsInput && inputPlaceholder?.toLowerCase().includes('comprobante')) {
      setIsFileUploadMode(true);
    }
  };

  const callBookingAPI = async (action: string, metadata?: any, userInput?: string, paymentProof?: string) => {
    try {
      const response = await fetch('/api/booking/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          metadata,
          userInput,
          paymentProof,
          userInfo: conversationState.userInfo
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la API');
      }

      return result.data;
    } catch (error: any) {
      console.error('Error calling booking API:', error);
      throw error;
    }
  };

  const handleSendMessage = async (message?: string, action?: string, metadata?: any) => {
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
      let actionToSend = action || 'userMessage';
      let metadataToSend = metadata || conversationState.metadata || {};
      
      if (action === 'openWhatsApp' || action === 'contactWhatsApp') {
        const phone = metadata?.phone || '5491167437969';
        const whatsappUrl = `https://wa.me/${phone}?text=Hola, me gustaría agendar un turno de podología`;
        window.open(whatsappUrl, '_blank');
        setIsLoading(false);
        return;
      }

      if (action === 'collectUserInfo') {
        if (metadata?.step === 'firstName') {
          setConversationState(prev => ({
            ...prev,
            userInfo: { ...prev.userInfo, name: messageToSend }
          }));
        } else if (metadata?.step === 'phone') {
          setConversationState(prev => ({
            ...prev,
            userInfo: { ...prev.userInfo, phone: messageToSend }
          }));
        } else if (metadata?.step === 'reason') {
          setConversationState(prev => ({
            ...prev,
            userInfo: { ...prev.userInfo, reason: messageToSend }
          }));
        }
      }

      let paymentProofData = undefined;
      if (action === 'verifyPayment' && conversationState.paymentProof) {
        paymentProofData = conversationState.paymentProof;
      }

      const response = await callBookingAPI(actionToSend, metadataToSend, messageToSend, paymentProofData);
      
      if (response.metadata) {
        setConversationState(prev => ({
          ...prev,
          metadata: { ...prev.metadata, ...response.metadata }
        }));
      }

      addMessage(
        response.message, 
        true, 
        response.options,
        response.needsInput,
        response.inputPlaceholder
      );

      if (response.needsInput && response.inputType === 'file') {
        setIsFileUploadMode(true);
      }

    } catch (error: any) {
      console.error('Error en conversación:', error);
      addMessage(
        'Lo siento, hubo un error inesperado. Por favor intenta nuevamente o contacta a Cecilia por WhatsApp al 1167437969.', 
        true,
        [
          { label: 'Contactar por WhatsApp', action: 'contactWhatsApp' },
          { label: 'Volver al inicio', action: 'start' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: any) => {
    if (option.action === 'verifyPayment' && isFileUploadMode && selectedFile) {
      handleFileUpload();
    } else {
      handleSendMessage(option.label, option.action, option.metadata);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setInputValue(file.name);
    }
  };
  
  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      
      setConversationState(prev => ({
        ...prev,
        paymentProof: dataUri
      }));
      
      handleSendMessage(
        `Comprobante subido: ${selectedFile.name}`, 
        'verifyPayment', 
        conversationState.metadata
      );
      
      setSelectedFile(null);
      setInputValue('');
      setIsFileUploadMode(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const initializeChat = async () => {
    const chatSingleton = ChatSingleton.getInstance();
    
    setIsLoading(true);
    
    try {
      const result = await chatSingleton.initialize(async () => {
        const response = await callBookingAPI('start');
        return response;
      });
      
      if (result) {
        console.log('🟢 Chat initialized successfully:', result.message);
        addMessage(result.message, true, result.options);
      }
    } catch (error) {
      console.log('🔴 Chat initialization failed:', error);
      addMessage(
        '¡Hola! Soy tu asistente virtual de PODOPALERMO 👣✨\n\nHubo un problema al inicializar el chat, pero puedes contactar directamente a Cecilia por WhatsApp.',
        true,
        [{ label: 'Contactar por WhatsApp', action: 'contactWhatsApp' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔵 EmbeddedChatBot useEffect triggered');
    initializeChat();
    
    return () => {
      console.log('🔴 EmbeddedChatBot cleanup');
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
                          {option.action === 'openWhatsApp' && <ExternalLink className="h-3 w-3 ml-1" />}
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
          {isFileUploadMode ? (
            <>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
              />
              <Input
                value={inputValue}
                placeholder="Selecciona un comprobante de pago..."
                readOnly
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 cursor-pointer"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                size="icon"
                className="bg-green-600 hover:bg-green-700"
              >
                <UploadCloud className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  messages[messages.length - 1]?.inputPlaceholder || 
                  "Escribe tu mensaje..."
                }
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
            </>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Powered by PODOPALERMO AI Assistant
        </div>
      </div>
    </div>
  );
}