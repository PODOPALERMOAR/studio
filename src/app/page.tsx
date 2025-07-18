'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, User, Gift, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  
  const quickActionsConfig = [
    { title: "Asistente Personal", subtitle: "Panel de pacientes", icon: User, href: "/my-panel", id: "panel" },
    { title: "Referidos", subtitle: "Nos recomendaste y queremos agradecerte", icon: Gift, href: "#", id: "referidos", isPlaceholder: true },
    { title: "Comunidad", subtitle: "Mostra podologia, mostra tu solucion", icon: Sparkles, href: "#", id: "comunidad", isPlaceholder: true },
  ];

  const handleFindAppointmentClick = () => {
    router.push('/turnos');
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center p-4 relative">
          <div className="w-full flex flex-col">
            <Card className="w-full shadow-xl rounded-xl mb-6 overflow-hidden bg-transparent relative aspect-[4/3] sm:aspect-video">
              {/* Efectos de brillo que se mueven por encima de la imagen */}
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
                {/* Fondo con brillo pulsante */}
                <div className="absolute inset-0 w-full h-full bg-white/5 animate-pulse-glow"></div>
                
                {/* Efecto de brillo principal diagonal blanco */}
                <div className="absolute inset-0 w-full h-full">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-15deg] animate-shine-effect"></div>
                </div>
                
                {/* Borde más visible para dar profundidad */}
                <div className="absolute inset-0 w-full h-full border-2 border-white/20 rounded-xl"></div>
              </div>
              
              <Image
                src="/images/arbol-hermoso.webp"
                alt="Bienvenida a Podopalermo"
                fill={true}
                style={{objectFit: "cover"}}
                priority
                className="z-0"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/5 z-[1] bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none"></div>

              <div className={cn(
                "absolute inset-x-0 bottom-0 z-[2] p-4 pb-5 sm:p-6 sm:pb-7", 
                "flex flex-col items-center text-center space-y-2", 
                "sm:flex-row sm:items-end sm:justify-between sm:text-left sm:space-y-0" 
              )}>
                <div className="sm:max-w-[calc(100%-150px)]">
                  <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                    Encontrar turno disponible
                  </h1>
                  <p className="text-gray-200 text-xs sm:text-sm mt-1 max-w-xs sm:max-w-sm">
                    En menos de 5 minutos con podólogos expertos.
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

            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground px-4 pb-3 pt-5">Acciones Rápidas</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] sm:grid-cols-3 gap-3 sm:gap-4 p-4">
                {quickActionsConfig.map((action) => (
                  <Link
                    href={action.href}
                    key={action.id}
                    onClick={action.isPlaceholder ? (e) => { e.preventDefault(); toast({ title: action.title, description: "Esta función estará disponible próximamente.", duration: 3000});} : undefined}
                    className={cn(
                      "flex flex-1 gap-2 sm:gap-3 rounded-xl p-4 sm:p-6 items-center transition-all cursor-pointer shadow-md min-h-[100px] sm:min-h-[120px]",
                      "bg-card border border-border hover:bg-muted hover:border-primary/30 hover:shadow-lg text-foreground",
                      action.isPlaceholder && "opacity-70"
                    )}
                  >
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <div className="flex flex-col items-start text-left">
                      <h3 className="text-sm sm:text-base font-bold leading-tight">{action.title}</h3>
                      {action.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}