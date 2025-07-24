'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, X, UploadCloud, FileText } from 'lucide-react';
import { useChatBot } from './ChatBotContext';
import { LoadingDots } from '@/components/common/LoadingDots';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

interface SimpleChatBotProps {
    onClose?: () => void;
}

export default function SimpleChatBot({ onClose }: SimpleChatBotProps) {
  const {
    messages,
    addMessage,
    isLoading,
    setIsLoading,
    isInitialized,
    setIsInitialized,
    conversationState,
    setConversationState,
  } = useChatBot();

  const [inputValue, setInputValue] = useState('');
  const [isFileUploadMode, setIsFileUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const callBookingAPI = async (action: string, metadata?: any, userInput?: string, paymentProof?: string) => {
    setIsLoading(true);
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
      addMessage(
        'Lo siento, hubo un error inesperado. Por favor, intentá de nuevo o contactá a Cecilia por WhatsApp.', 
        true,
        [
          { label: 'Contactar por WhatsApp', action: 'contactWhatsApp', metadata: { phone: '5491167437969' } },
          { label: 'Volver al inicio', action: 'goHome' }
        ]
      );
      console.error('Error llamando a la API de booking:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = useCallback(async (message?: string, action?: string, metadata?: any) => {
    const messageToSend = message || inputValue.trim();
    
    if (action && message) {
      addMessage(message, false);
    } else if(messageToSend) {
      addMessage(messageToSend, false);
      setInputValue('');
    }

    const response = await callBookingAPI(action || 'userMessage', metadata, messageToSend);
    
    if (response) {
      addMessage(response.message, true, response.options);
      
      if (response.metadata) {
        setConversationState(prev => ({
          ...prev,
          metadata: { ...prev.metadata, ...response.metadata }
        }));
      }

      if (response.needsInput && response.inputType === 'file') {
        setIsFileUploadMode(true);
      } else {
        setIsFileUploadMode(false);
      }
    }
  }, [inputValue, addMessage, setConversationState]);

  const handleOptionClick = useCallback((option: any) => {
    handleSendMessage(option.label, option.action, option.metadata);
  }, [handleSendMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({ title: "Archivo demasiado grande", description: "El comprobante no debe exceder los 10MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      setInputValue(file.name);
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setConversationState(prev => ({ ...prev, paymentProof: dataUri }));
      handleSendMessage(`Comprobante subido: ${selectedFile.name}`, 'verifyPayment', conversationState.metadata);
      setSelectedFile(null);
      setInputValue('');
      setIsFileUploadMode(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(selectedFile);
  };

  const initializeChat = useCallback(async () => {
    if (!isInitialized) {
      const response = await callBookingAPI('start');
      if (response) {
        addMessage(response.message, true, response.options);
        setIsInitialized(true);
      }
    }
  }, [isInitialized, addMessage, setIsInitialized]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isFileUploadMode) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <div>
            <span className="font-semibold">Asistente PODOPALERMO</span>
            <div className="text-xs opacity-90">Reserva tu turno 24/7</div>
          </div>
        </div>
        {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-4 w-4"/>
            </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] rounded-lg p-3 ${
                  message.isBot ? 'bg-white text-gray-800 shadow-sm border' : 'bg-green-600 text-white'
              }`}>
                <div className="flex items-start space-x-2">
                  {message.isBot && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    {message.options && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option, index) => (
                          <Button key={index} variant="outline" size="sm"
                            className="w-full justify-start text-xs hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                            onClick={() => handleOptionClick(option)}>
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {!message.isBot && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white rounded-lg p-3 shadow-sm border">
                <LoadingDots />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          {isFileUploadMode ? (
            <>
              <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex-1 justify-start font-normal text-muted-foreground">
                {selectedFile ? <FileText className="h-4 w-4 mr-2 text-primary"/> : <UploadCloud className="h-4 w-4 mr-2" />}
                {selectedFile ? selectedFile.name : "Seleccionar comprobante..."}
              </Button>
              <Button onClick={handleFileUpload} disabled={isLoading || !selectedFile} size="icon" className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Input
                value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribí tu mensaje..." onKeyDown={handleKeyPress}
                disabled={isLoading} className="flex-1"
              />
              <Button onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()} size="icon" className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Asistente IA de PODOPALERMO
        </div>
      </div>
    </div>
  );
}
