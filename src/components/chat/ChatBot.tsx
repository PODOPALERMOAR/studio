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
import SimpleChatBot from './SimpleChatBot';

interface ChatBotProps {
  embedded?: boolean;
}

export default function ChatBot({ embedded = false }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isInitialized, addMessage } = useChatBot();

  const handleOpen = () => {
    if (!isInitialized) {
      addMessage(
        '¡Hola! Soy tu asistente virtual de PODOPALERMO 👣✨\n\nEstoy aquí para ayudarte a encontrar y reservar tu próximo turno de forma rápida y sencilla. ¿Comenzamos?',
        true,
        [
          { label: 'Buscar próximo turno disponible', action: 'findNext', metadata: { podologistKey: 'any' } },
          { label: 'Elegir podólogo/a específico', action: 'choosePodologist' }
        ]
      );
    }
    setIsOpen(true);
  };
  
  const handleClose = () => {
    setIsOpen(false);
  };

  if (embedded) {
    return <SimpleChatBot />;
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
          className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
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
                <SimpleChatBot onClose={handleClose} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
