'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Bot, User, ExternalLink, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useChatBot } from './ChatBotContext';

interface ChatBotProps {
  embedded?: boolean;
}

export default function ChatBot({ embedded = false }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFileUploadMode, setIsFileUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Usar el contexto global
  const { 
    messages, 
    conversationState, 
    setConversationState, 
    isLoading, 
    setIsLoading, 
    addMessage,
    isInitialized,
    setIsInitialized
  } = useChatBot();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    
    // Si hay un mensaje de texto, agregarlo como mensaje del usuario
    if (messageToSend && !action) {
      addMessage(messageToSend, false);
      setInputValue('');
    }

    // Si es una acción de botón, mostrar el label como mensaje del usuario
    if (action && message) {
      addMessage(message, false);
    }

    setIsLoading(true);

    try {
      // Determinar la acción a enviar
      let actionToSend = action || 'userMessage';
      let metadataToSend = metadata || conversationState.metadata || {};
      
      // Manejar acciones especiales
      if (action === 'openWhatsApp' || action === 'contactWhatsApp') {
        const phone = metadata?.phone || '5491167437969'; // Número de Cecilia por defecto
        const whatsappUrl = `https://wa.me/${phone}?text=Hola, me gustaría agendar un turno de podología`;
        window.open(whatsappUrl, '_blank');
        setIsLoading(false);
        return;
      }

      // Manejar acciones de recolección de datos de usuario
      if (action === 'collectUserInfo') {
        // Actualizar la información del usuario en el estado de conversación
        if (metadata?.step === 'firstName') {
          setConversationState(prev => ({
            ...prev,
            userInfo: {
              ...prev.userInfo,
              name: messageToSend
            }
          }));
        } else if (metadata?.step === 'phone') {
          setConversationState(prev => ({
            ...prev,
            userInfo: {
              ...prev.userInfo,
              phone: messageToSend
            }
          }));
        } else if (metadata?.step === 'reason') {
          setConversationState(prev => ({
            ...prev,
            userInfo: {
              ...prev.userInfo,
              reason: messageToSend
            }
          }));
        }
      }

      // Manejar subida de comprobante de pago
      let paymentProofData = undefined;
      if (action === 'verifyPayment' && conversationState.paymentProof) {
        paymentProofData = conversationState.paymentProof;
      }

      const response = await callBookingAPI(actionToSend, metadataToSend, messageToSend, paymentProofData);
      
      // Actualizar estado de conversación
      if (response.metadata) {
        setConversationState(prev => ({
          ...prev,
          metadata: { ...prev.metadata, ...response.metadata }
        }));
      }

      // Agregar respuesta del bot
      addMessage(
        response.message, 
        true, 
        response.options,
        response.needsInput,
        response.inputPlaceholder
      );

      // Si necesita un archivo, mostrar el selector de archivos
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
    // Si la acción es para verificar el pago y estamos en modo de subida de archivo
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
      
      // Mostrar nombre del archivo seleccionado
      setInputValue(file.name);
    }
  };
  
  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    // Convertir archivo a Data URI
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      
      // Guardar el Data URI en el estado de conversación
      setConversationState(prev => ({
        ...prev,
        paymentProof: dataUri
      }));
      
      // Enviar mensaje con la acción de verificar pago
      handleSendMessage(
        `Comprobante subido: ${selectedFile.name}`, 
        'verifyPayment', 
        conversationState.metadata
      );
      
      // Resetear estado de archivo
      setSelectedFile(null);
      setInputValue('');
      setIsFileUploadMode(false);
      
      // Limpiar input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const initializeChat = async () => {
    if (!isInitialized) {
      setIsLoading(true);
      try {
        const response = await callBookingAPI('start');
        addMessage(response.message, true, response.options);
        setIsInitialized(true);
      } catch (error) {
        addMessage(
          '¡Hola! Soy tu asistente virtual de PODOPALERMO 👣✨\n\nHubo un problema al inicializar el chat, pero puedes contactar directamente a Cecilia por WhatsApp.',
          true,
          [{ label: 'Contactar por WhatsApp', action: 'contactWhatsApp' }]
        );
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Inicializar el chat solo una vez cuando se muestra
  useEffect(() => {
    if ((isOpen || embedded) && !isInitialized) {
      initializeChat();
    }
  }, [isOpen, embedded, isInitialized]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Renderizado para modo embebido (en página)
  if (embedded) {
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

  // Renderizado para modo flotante (botón + ventana emergente)
  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.3 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)]"
          >
            <Card className="h-full flex flex-col shadow-2xl border-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <div>
                    <span className="font-semibold">Asistente PODOPALERMO</span>
                    <div className="text-xs opacity-90">Reserva tu turno 24/7</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-green-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}