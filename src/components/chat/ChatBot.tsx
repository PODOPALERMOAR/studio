
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, X, Bot, User, ExternalLink, UploadCloud, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LoadingDots } from '@/components/common/LoadingDots';
import BookingWizard from '@/components/booking/BookingWizard';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  
    const handleClose = () => {
      onClose();
    };
  
    // Renderizado para modo flotante (botón + ventana emergente)
    return (
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
    );
  }
