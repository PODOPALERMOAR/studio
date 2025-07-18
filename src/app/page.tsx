'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { ArrowRight, Gift, Sparkles, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const quickActionsConfig = [
    { title: "Asistente Personal", subtitle: "Panel de pacientes", icon: User, href: "/dashboard/patient", id: "panel" },
    { title: "Referidos", subtitle: "Gana beneficios por recomendarnos", icon: Gift, href: "#", id: "referidos", isPlaceholder: true },
    { title: "Comunidad", subtitle: "Únete a nuestra comunidad", icon: Sparkles, href: "#", id: "comunidad", isPlaceholder: true },
];

export default function Home() {
  const { toast } = useToast();
  const [firebaseStatus, setFirebaseStatus] = useState('No probado');

  const testFirebase = async () => {
    try {
      setFirebaseStatus('Probando...');
      
      // Intentar leer una colección
      const querySnapshot = await getDocs(collection(db, 'test'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setFirebaseStatus(`✅ Conexión exitosa! ${docs.length} documentos encontrados`);
      
      // Agregar un documento de prueba
      await addDoc(collection(db, 'test'), {
        message: 'Hola desde Foot Haven!',
        timestamp: new Date(),
        test: true
      });
      
      toast({
        title: "Firebase conectado",
        description: "La conexión con Firebase funciona correctamente",
      });
      
    } catch (error) {
      console.error('Error:', error);
      setFirebaseStatus('❌ Error: ' + (error as Error).message);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Firebase",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col items-center p-4">
        <div className="w-full max-w-4xl flex flex-col">
            <Card className="w-full shadow-xl rounded-xl mb-6 overflow-hidden bg-transparent relative aspect-[4/3] sm:aspect-video">
                <Image
                  src="https://placehold.co/1200x800.png"
                  alt="Bienvenida a Foot Haven"
                  fill={true}
                  style={{objectFit: "cover"}}
                  priority
                  data-ai-hint="healthy feet nature"
                  className="z-0"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/5 z-[1] bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none"></div>

                <div className={cn(
                  "absolute inset-x-0 bottom-0 z-[2] p-4 pb-5 sm:p-6 sm:pb-7", 
                  "flex flex-col items-center text-center space-y-2", 
                  "sm:flex-row sm:items-end sm:justify-between sm:text-left sm:space-y-0" 
                )}>
                  <div className="sm:max-w-[calc(100%-200px)]">
                    <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                      Encuentra tu turno disponible
                    </h1>
                    <p className="text-gray-200 text-xs sm:text-sm mt-1 max-w-xs sm:max-w-sm">
                      En menos de 5 minutos con nuestros podólogos expertos.
                    </p>
                  </div>
                  <Button
                    size="lg" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full max-w-[180px] sm:w-auto mt-3 sm:mt-0 flex-shrink-0"
                    asChild
                  >
                    <Link href="/turnos">
                        Buscar Turno <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
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
            
            {/* Test Firebase - Solo para desarrollo */}
            <Card className="p-6 mt-8 max-w-md mx-auto">
              <h3 className="text-lg font-bold mb-4">Test Firebase Connection</h3>
              <div className="space-y-4">
                <p className="text-sm">{firebaseStatus}</p>
                <Button onClick={testFirebase} size="sm">
                  Probar Firebase
                </Button>
              </div>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}