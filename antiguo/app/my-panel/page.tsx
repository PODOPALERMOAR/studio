
"use client";

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarCheck,
  MessageSquare,
  LogOut,
  PlusCircle,
  Edit3,
  MessageCircleQuestion,
  Receipt as ReceiptIcon,
  X as XIcon,
  Gift as GiftIcon,
  Sparkles,
  Home,
} from 'lucide-react';

// Flows & Components
import { LoadingDots } from '@/components/common/LoadingDots';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';


interface PanelChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  options?: Array<{ label: string; action: string; metadata?: any }>;
  appointmentsList?: string[];
}

// NOTE: This is a development-only version of the page with authentication bypassed.
export default function MyPanelPage() {
  const { toast } = useToast();
  const router = useRouter();

  const userName = "Usuario de Prueba";

  const [isPanelAssistantActive, setIsPanelAssistantActive] = useState(false);
  const [panelChatMessages, setPanelChatMessages] = useState<PanelChatMessage[]>([]);
  const [isPanelAiLoading, setIsPanelAiLoading] = useState(false);
  const panelChatContainerRef = useRef<HTMLDivElement>(null);
  const [panelAssistantInitialized, setPanelAssistantInitialized] = useState(false);

  const addMessageToPanelChat = useCallback((sender: 'user' | 'ai', text: string, options?: PanelChatMessage['options'], appointmentsList?: string[]) => {
    setPanelChatMessages(prev => [...prev, {
      id: `${Date.now()}-${sender}`,
      sender, text, options, appointmentsList
    }]);
  }, []);

  const initializePanelAssistant = useCallback(() => {
    setPanelChatMessages([]);
    setIsPanelAiLoading(true);
    setPanelAssistantInitialized(true);
    setTimeout(() => {
      addMessageToPanelChat('ai', `¡Hola ${userName}! Soy tu asistente personal. ¿Cómo puedo ayudarte hoy?`, [
        { label: "Ver mis próximos turnos", action: "panelViewAppointments" },
        { label: "Agendar un nuevo turno", action: "userBookNewFromPanel" },
      ]);
      setIsPanelAiLoading(false);
    }, 300);
  }, [userName, addMessageToPanelChat]);

  const handlePanelChatOptionClick = useCallback(async (action: string, label: string) => {
    addMessageToPanelChat('user', label);
    setIsPanelAiLoading(true);
    setPanelChatMessages(prev => prev.map(msg => ({...msg, options: undefined})));

    try {
      if (action === "panelViewAppointments") {
        // Mocking the response for dev mode
        addMessageToPanelChat('ai', "En modo de desarrollo, esta es una lista de ejemplo:", [
            { label: "Volver al menú", action: "panelGoHomeAssistant" }
        ], ["- Turno de prueba con Podóloga SILVIA el Lunes, 25 de agosto a las 10:00 hs."]);
      } else if (action === "userBookNewFromPanel") {
        router.push('/');
      } else if (action === "panelGoHomeAssistant") {
        initializePanelAssistant();
      } else {
        addMessageToPanelChat('ai', `La opción "${label}" estará disponible próximamente.`, [{ label: "Volver al menú del asistente", action: "panelGoHomeAssistant" }]);
      }
    } catch (err) {
      addMessageToPanelChat('ai', "Hubo un error. Por favor, intenta de nuevo.", [{ label: "Volver al menú del asistente", action: "panelGoHomeAssistant" }]);
    } finally {
      setIsPanelAiLoading(false);
    }
  }, [addMessageToPanelChat, router, initializePanelAssistant]);

  const handleStartPanelAssistant = () => { setIsPanelAssistantActive(true); if (!panelAssistantInitialized) initializePanelAssistant(); };
  
  const getPanelChatIconForAction = (action: string) => {
    if (action === "panelViewAppointments") return <CalendarCheck className="mr-2 h-4 w-4 shrink-0" />;
    if (action.includes("BookNew")) return <PlusCircle className="mr-2 h-4 w-4 shrink-0" />;
    if (action === "panelGoHomeAssistant") return <Home className="mr-2 h-4 w-4 shrink-0" />;
    return <MessageCircleQuestion className="mr-2 h-4 w-4 shrink-0" />;
  };

  const panelQuickActions = [
    { title: "Programa de Referidos", icon: GiftIcon, id: "referidos" },
    { title: "Editar Perfil", icon: Edit3, id: "editProfile" },
    { title: "Historial de Pagos", icon: ReceiptIcon, id: "paymentHistory" },
  ];

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl pt-0">
        <>
          <div className="flex items-center justify-between gap-3 p-4">
            <p className="text-foreground tracking-light text-[32px] font-bold leading-tight">¡Hola, {userName}!</p>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Modo Desarrollo", description: "El cierre de sesión está desactivado." })}><LogOut size={18} className="mr-2" />Salir</Button>
          </div>
          <Card className="w-full bg-card shadow-xl rounded-xl mb-8 overflow-hidden">
            {!isPanelAssistantActive ? (
              <div className="relative h-[250px] md:h-[300px] lg:h-[450px]">
                <Image src="/images/hermoso-arbol.jpg" alt="Bienvenida" fill className="object-cover" data-ai-hint="tree nature" priority />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/70 to-transparent"><div className="md:w-2/3"><h2 className="text-xl md:text-2xl font-bold text-white">Tu Espacio Personal en Podopalermo</h2><p className="text-sm text-gray-200 mt-1">Gestiona tus turnos y accede a funciones personalizadas.</p><Button size="lg" onClick={handleStartPanelAssistant} variant="outline" className="mt-4 bg-white/10 hover:bg-white/20 text-white border-white/50 backdrop-blur-sm"><Sparkles className="mr-2 h-5 w-5" /> Iniciar Asistente</Button></div></div>
              </div>
            ) : (
              <div className="animate-in fade-in-0 duration-300">
                <CardHeader className="flex-row items-center justify-between pb-3 px-4 pt-4 border-b"><div className="flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /><CardTitle className="text-lg">Asistente Personal</CardTitle></div><Button variant="ghost" size="icon" onClick={() => setIsPanelAssistantActive(false)}><XIcon className="h-5 w-5" /></Button></CardHeader>
                <CardContent ref={panelChatContainerRef} className="px-4 py-4 space-y-3 overflow-y-auto max-h-[400px] min-h-[250px] flex flex-col">
                  {isPanelAiLoading && !panelChatMessages.length ? <div className="m-auto"><LoadingDots/></div> : <>
                    {panelChatMessages.map(msg => <div key={msg.id} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}><div className={`p-2.5 rounded-lg max-w-[85%] shadow-sm text-sm ${msg.sender === 'ai' ? 'bg-background border rounded-bl-none' : 'bg-primary text-primary-foreground rounded-br-none'}`}><p className="whitespace-pre-wrap">{msg.text}</p>{msg.appointmentsList?.length && <ul className="list-disc list-inside mt-2 pl-1">{msg.appointmentsList.map((appt, i) => <li key={i}>{appt}</li>)}</ul>}{msg.options?.length && <div className="mt-2.5 space-y-1.5">{msg.options.map(opt => <Button key={opt.action} variant="outline" size="sm" className="w-full justify-start h-auto py-1.5 px-2.5 text-xs" onClick={() => handlePanelChatOptionClick(opt.action, opt.label)} disabled={isPanelAiLoading}>{getPanelChatIconForAction(opt.action)}{opt.label}</Button>)}</div>}</div></div>)}
                    {isPanelAiLoading && panelChatMessages.length > 0 && <div className="flex justify-start pt-2.5"><div className="p-2.5 rounded-lg bg-background border"><LoadingDots /></div></div>}
                  </>}
                </CardContent>
              </div>
            )}
          </Card>
          <h2 className="text-foreground text-[22px] font-bold px-4 pb-3 pt-1">Acciones Rápidas</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-4">
            {panelQuickActions.map(action => (
                <Button key={action.id} onClick={() => toast({ title: "Próximamente", description: "Esta función estará disponible pronto."})} className={cn("flex flex-1 gap-3 rounded-xl p-6 items-center justify-start transition-all cursor-pointer shadow-md min-h-[140px] text-primary-foreground hover:brightness-110 active:brightness-95 hover:shadow-xl", action.id === "referidos" ? "bg-panel-gradient-1" : action.id === "editProfile" ? "bg-panel-gradient-2" : "bg-panel-gradient-3")}>
                    <action.icon className="h-6 w-6" />
                    <div className="flex flex-col items-start text-left"><h3 className="text-base font-bold">{action.title}</h3><span className="text-xs opacity-80 mt-1">Próximamente</span></div>
                </Button>
            ))}
          </div>
        </>
      </div>
    </div>
  );
}
