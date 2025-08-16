
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Bot, User, ExternalLink, UploadCloud, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatBot } from './ChatBotContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LoadingDots } from '@/components/common/LoadingDots';
import BookingWizard from '@/components/booking/BookingWizard';

interface ChatBotProps {
  embedded?: boolean;
}

export default function ChatBot({ embedded = false }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isInitialized, addMessage, setMessages } = useChatBot();

  const handleOpen = useCallback(() => {
    if (!isInitialized) {
      // Iniciar la conversación directamente buscando el próximo turno
      const fetchInitialSlot = async () => {
        try {
          const response = await fetch('/api/booking/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start' }),
          });
          const result = await response.json();
          if (result.success) {
            addMessage(result.data.message, true, result.data.options);
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          addMessage('Lo siento, no pude buscar turnos. Intenta más tarde.', true);
        }
      };
      fetchInitialSlot();
    }
    setIsOpen(true);
  }, [isInitialized, addMessage]);
  
  const handleClose = () => {
    setIsOpen(false);
  };

  if (embedded) {
    return (
        <Card className="h-full w-full flex flex-col shadow-2xl border-0 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <div>
                        <span className="font-semibold">Asistente PODOPALERMO</span>
                        <div className="text-xs opacity-90">Reserva tu turno 24/7</div>
                    </div>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-white/20">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <BookingWizard />
        </Card>
    );
  }

  // Renderizado para modo flotante (botón + ventana emergente)
  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={handleOpen}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
          aria-label="Abrir asistente de turnos"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.3 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)]"
          >
            <Card className="h-full w-full flex flex-col shadow-2xl border-0 overflow-hidden">
                 <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                    <div className="flex items-center space-x-2">
                        <Bot className="h-5 w-5" />
                        <div>
                            <span className="font-semibold">Asistente PODOPALERMO</span>
                            <div className="text-xs opacity-90">Reserva tu turno 24/7</div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 text-white hover:bg-white/20">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <BookingWizard />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
