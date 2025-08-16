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
      // SIMULACIÓN DE API
      console.log('Simulando API:', { action, metadata, userInput });
      await new Promise(res => setTimeout(res, 1000));
      
      let response: any;
      
      if (action === 'start' || action === 'goHome' || action === 'findNext') {
        response = { 
            message: '¡Hola! Encontré un turno disponible para vos. Es con la Podóloga SILVIA, mañana a las 10:00. ¿Te gustaría reservarlo?',
            options: [
                { label: 'Sí, ¡perfecto!', action: 'confirmSlot' },
                { label: 'Ver otro horario', action: 'findNext' },
                { label: 'Quiero elegir podólogo', action: 'choosePodologist' }
            ]
        };
      } else if (action === 'confirmSlot') {
        response = {
            message: '¡Genial! Para confirmar, necesito tu nombre completo:',
            needsInput: true,
            inputPlaceholder: 'Escribí tu nombre...',
            metadata: { step: 'collectName' }
        };
      } else {
         response = {
            message: 'Gracias. Ahora tu número de teléfono:',
            needsInput: true,
            inputPlaceholder: 'Ej: 11 2345 6789',
            metadata: { step: 'collectPhone' }
        };
      }
      
      return response;

    } catch (error: any) {
      addMessage(
        'Lo siento, hubo un error inesperado. Por favor, intentá de nuevo.', 
        true,
        [{ label: 'Empezar de nuevo', action: 'start' }]
      );
      console.error('Error en la simulación de API:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = useCallback(async (message?: string, action?: string, metadata?: any) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend && !action) return;

    if (action && message) {
      addMessage(message, false);
    } else if(messageToSend) {
      addMessage(messageToSend, false);
      setInputValue('');
    }

    const response = await callBookingAPI(action || 'userInput', metadata, messageToSend);
    
    if (response) {
      addMessage(response.message, true, response.options, response.needsInput, response.inputPlaceholder);
      
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
  }, [inputValue, addMessage, setConversationState, conversationState]);

  const handleOptionClick = useCallback((option: any) => {
    handleSendMessage(option.label, option.action, option.metadata);
  }, [handleSendMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Lógica de archivos (no necesaria para simulación inicial)
  };

  const handleFileUpload = () => {
    // Lógica de archivos (no necesaria para simulación inicial)
  };

  const initializeChat = useCallback(async () => {
    if (!isInitialized) {
      setIsInitialized(true);
      const response = await callBookingAPI('start');
      if (response) {
        addMessage(response.message, true, response.options, response.needsInput, response.inputPlaceholder);
        if (response.metadata) {
          setConversationState(prev => ({ ...prev, metadata: response.metadata }));
        }
      }
    }
  }, [isInitialized, addMessage, setIsInitialized, setConversationState]);

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
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Asistente de Turnos</span>
            <div className="text-xs text-muted-foreground">En línea</div>
          </div>
        </div>
        {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:bg-accent">
                <X className="h-4 w-4"/>
            </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-end gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              {message.isBot && <Bot className="h-5 w-5 mb-2 text-muted-foreground flex-shrink-0" />}
              <div className={`max-w-[85%] rounded-lg p-3 ${
                  message.isBot ? 'bg-white text-foreground shadow-sm border rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'
              }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    {message.options && (
                      <div className="mt-3 flex flex-col items-start space-y-2">
                        {message.options.map((option, index) => (
                          <Button key={index} variant="outline" size="sm"
                            className="w-auto justify-start text-xs h-auto py-1.5 px-3 rounded-full hover:bg-primary/10 border-primary/20 text-primary hover:text-primary/90"
                            onClick={() => handleOptionClick(option)}>
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    )}
              </div>
              {!message.isBot && <User className="h-5 w-5 mb-2 text-muted-foreground flex-shrink-0" />}
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
      <div className="p-4 border-t bg-background">
        <div className="flex space-x-2">
          {isFileUploadMode ? (
            <>
              <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex-1 justify-start font-normal text-muted-foreground">
                {selectedFile ? <FileText className="h-4 w-4 mr-2 text-primary"/> : <UploadCloud className="h-4 w-4 mr-2" />}
                {selectedFile ? selectedFile.name : "Seleccionar comprobante..."}
              </Button>
              <Button onClick={handleFileUpload} disabled={isLoading || !selectedFile} size="icon" className="bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Input
                value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder={messages[messages.length - 1]?.inputPlaceholder || "Escribe tu mensaje..."}
                onKeyDown={handleKeyPress}
                disabled={isLoading} className="flex-1"
              />
              <Button onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()} size="icon" className="bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
