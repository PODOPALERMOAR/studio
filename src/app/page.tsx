
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, HomeIcon } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TestChatBot from '@/components/chat/TestChatBot';

export default function HomePage() {
  const [showBookingAssistant, setShowBookingAssistant] = useState(false);
  
  const handleFindAppointmentClick = useCallback(() => {
    setShowBookingAssistant(true);
  }, []);

  const handleBackToHome = useCallback(() => {
    setShowBookingAssistant(false);
  }, []);

  useEffect(() => {
    // Precargar la imagen del chat para una transición más suave
    const img = new (window as any).Image();
    img.src = '/images/hermoso-arbol.jpg';
  }, []);


  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background">
      <div className="w-full max-w-4xl flex flex-col flex-grow">
        <Header />
        <main className="flex-grow flex flex-col items-center p-4">
          <AnimatePresence mode="wait">
            {!showBookingAssistant ? (
              <motion.div
                key="homepage-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full flex flex-col items-center justify-center flex-grow text-center"
              >
                <Card className="w-full shadow-xl rounded-xl mb-6 overflow-hidden bg-transparent relative aspect-[4/3] sm:aspect-video">
                  <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
                    <div className="absolute inset-0 w-full h-full bg-white/5 animate-pulse-glow"></div>
                    <div className="absolute inset-0 w-full h-full">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-15deg] animate-shine-effect"></div>
                    </div>
                    <div className="absolute inset-0 w-full h-full border-2 border-white/20 rounded-xl"></div>
                  </div>
                  
                  <Image
                    src="/images/arbol-hermoso.webp"
                    alt="Bienvenida a Podopalermo"
                    fill={true}
                    style={{objectFit: "cover"}}
                    priority
                    className="z-0"
                    data-ai-hint="nature tree"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/5 z-[1] bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none"></div>

                  <div className={cn(
                    "absolute inset-x-0 bottom-0 z-[2] p-4 pb-5 sm:p-6 sm:pb-7", 
                    "flex flex-col items-center text-center space-y-2", 
                    "sm:flex-row sm:items-end sm:justify-between sm:text-left sm:space-y-0" 
                  )}>
                    <div className="sm:max-w-[calc(100%-200px)]">
                      <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                        El cuidado que tus pies merecen
                      </h1>
                      <p className="text-gray-200 text-xs sm:text-sm mt-1 max-w-xs sm:max-w-sm">
                        Agendá tu turno con nuestro asistente inteligente en menos de 3 minutos.
                      </p>
                    </div>
                    <div className="relative">
                      <Button
                        size="lg" 
                        className="bg-white text-black hover:bg-white/90 w-full max-w-[200px] sm:w-auto mt-3 sm:mt-0 flex-shrink-0 
                        text-sm sm:text-base font-medium rounded-full px-6 py-5 shadow-lg
                        transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                        relative overflow-hidden group z-10"
                        onClick={handleFindAppointmentClick}
                      >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 
                      transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                      <span className="relative flex items-center justify-center">
                        Buscar Turno <ArrowRight className="ml-2 h-5 w-5 sm:ml-3 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-1" />
                      </span>
                      </Button>
                      <div className="absolute -inset-1 rounded-full bg-white/20 blur-sm animate-button-pulse pointer-events-none"></div>
                    </div>
                  </div>
                </Card>

              </motion.div>
            ) : (
              <motion.div
                key="booking-assistant"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full flex-grow flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground">
                    Asistente de Turnos
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBackToHome}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span>Volver al Inicio</span>
                  </Button>
                </div>
                
                <Card className="w-full flex-grow shadow-lg rounded-xl overflow-hidden border">
                  <TestChatBot />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}

