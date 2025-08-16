
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Phone, Check, ArrowRight, ArrowLeft, Users, Stethoscope, ChevronRight } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import LoadingSpinner from '../common/LoadingSpinner';

type Step = 'podologist' | 'dateTime' | 'details' | 'confirmation';

// Datos simulados
const mockPodologists = [
  { id: 'any', name: 'Cualquier podólogo/a', specialty: 'Encuentra el próximo turno disponible' },
  { id: 'silvia', name: 'Podóloga SILVIA', specialty: 'Especialista en pie diabético' },
  { id: 'natalia', name: 'Podóloga NATALIA', specialty: 'Podología deportiva y biomecánica' },
  { id: 'martin', name: 'Podólogo MARTIN', specialty: 'Tratamientos para uña encarnada' },
];

const mockAvailableTimes: Record<string, string[]> = {
  "1": ["09:00", "09:30", "11:00", "14:00", "14:30"],
  "2": ["10:00", "10:30", "12:00", "15:00", "15:30", "16:00"],
  "4": ["09:00", "11:30", "13:00", "13:30"],
  "5": ["14:00", "14:30", "16:30", "17:00"],
};

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export default function BookingWizard() {
  const [step, setStep] = useState<Step>('podologist');
  const [selectedPodologist, setSelectedPodologist] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patientDetails, setPatientDetails] = useState({ name: '', phone: '' });
  const { toast } = useToast();

  const availableDays = useMemo(() => {
    return Object.keys(mockAvailableTimes).map(day => addDays(startOfDay(new Date()), parseInt(day)));
  }, []);

  const handlePodologistSelect = (podologistId: string) => {
    setSelectedPodologist(podologistId);
    setStep('dateTime');
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setIsLoading(true);
    setSelectedDate(date);
    setSelectedTime(null); 
    setTimeout(() => setIsLoading(false), 300);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientDetails.name || !patientDetails.phone) {
        toast({ title: 'Error', description: 'Por favor completá tu nombre y teléfono.', variant: 'destructive'});
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setStep('confirmation');
    }, 1000);
  };
  
  const resetFlow = () => {
    setStep('podologist');
    setSelectedPodologist(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setPatientDetails({ name: '', phone: '' });
  };
  
  const goBack = () => {
    if (step === 'dateTime') setStep('podologist');
    if (step === 'details') setStep('dateTime');
  };

  const BookingSummary = () => (
    <AnimatePresence>
    {step !== 'podologist' && step !== 'confirmation' && (
       <motion.div
         initial={{ opacity: 0, height: 0 }}
         animate={{ opacity: 1, height: 'auto' }}
         exit={{ opacity: 0, height: 0 }}
         className="text-sm text-center text-muted-foreground mb-4 overflow-hidden"
       >
        <div className="flex items-center justify-center flex-wrap gap-x-2">
            <span>{mockPodologists.find(p => p.id === selectedPodologist)?.name}</span>
            {selectedDate && <ChevronRight className="h-4 w-4" />}
            {selectedDate && <span>{format(selectedDate, 'd MMM', { locale: es })}</span>}
            {selectedTime && <ChevronRight className="h-4 w-4" />}
            {selectedTime && <span className="font-semibold text-primary">{selectedTime} hs</span>}
        </div>
       </motion.div>
    )}
    </AnimatePresence>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'podologist':
        return (
          <motion.div key="podologist" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
            <CardHeader className="text-center px-0 pt-0">
                <CardTitle className="text-xl">Elegí un profesional</CardTitle>
                <CardDescription>O seleccioná "Cualquiera" para la máxima disponibilidad.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {mockPodologists.map(p => (
                <Card 
                    key={p.id} 
                    onClick={() => handlePodologistSelect(p.id)}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
                >
                    <CardContent className="p-4 flex items-center space-x-4">
                       <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            {p.id === 'any' ? <Users className="h-6 w-6 text-primary" /> : <Stethoscope className="h-6 w-6 text-primary" />}
                       </div>
                       <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.specialty}</p>
                       </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        );
      case 'dateTime':
        const dayKey = selectedDate ? String(Math.ceil((selectedDate.getTime() - startOfDay(new Date()).getTime()) / (1000 * 3600 * 24))) : "0";
        const times = mockAvailableTimes[dayKey] || [];
        return (
          <motion.div key="dateTime" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
             <CardHeader className="text-center px-0 pt-0">
                <CardTitle className="text-xl">Seleccioná Fecha y Hora</CardTitle>
            </CardHeader>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 30)}
                    disabled={(date) => !availableDays.some(d => startOfDay(d).getTime() === startOfDay(date).getTime())}
                    className="rounded-md border"
                    locale={es}
                />
                </div>
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                    {selectedDate ? (
                        <motion.div 
                            key={selectedDate.toString()}
                            initial={{ opacity: 0, y:10 }}
                            animate={{ opacity: 1, y:0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <h4 className="font-semibold text-center md:text-left">
                                Horarios para el {format(selectedDate, 'd MMM', { locale: es })}
                            </h4>
                            {isLoading ? <div className="h-40 flex items-center justify-center"><LoadingSpinner/></div> : (
                            <div className="grid grid-cols-3 gap-2">
                                {times.length > 0 ? times.map(time => (
                                    <Button key={time} variant="outline" onClick={() => handleTimeSelect(time)}>
                                    {time}
                                    </Button>
                                )) : <p className="col-span-full text-center text-muted-foreground py-8 text-sm">No hay horarios.</p>}
                            </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            <p>← Seleccioná un día</p>
                        </div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
          </motion.div>
        );
      case 'details':
        return (
           <motion.div key="details" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
            <CardHeader className="text-center px-0 pt-0">
                <CardTitle className="text-xl">Ya casi estamos</CardTitle>
                <CardDescription>Completá tus datos para confirmar la reserva.</CardDescription>
            </CardHeader>
            <form onSubmit={handleDetailsSubmit} className="space-y-4 max-w-sm mx-auto mt-4">
                <div>
                    <Label htmlFor="name"><User className="inline h-4 w-4 mr-1 text-muted-foreground"/> Nombre completo</Label>
                    <Input id="name" value={patientDetails.name} onChange={e => setPatientDetails({...patientDetails, name: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="phone"><Phone className="inline h-4 w-4 mr-1 text-muted-foreground"/> Teléfono</Label>
                    <Input id="phone" type="tel" value={patientDetails.phone} onChange={e => setPatientDetails({...patientDetails, phone: e.target.value})}/>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner/> : <>Confirmar Reserva <ArrowRight className="ml-2 h-4 w-4"/></>}
                </Button>
            </form>
           </motion.div>
        );
      case 'confirmation':
        return (
            <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <Check className="mx-auto h-16 w-16 text-green-500 bg-green-100 rounded-full p-2 mb-4"/>
                <h2 className="text-2xl font-bold mb-2">¡Turno confirmado!</h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {patientDetails.name}, tu turno con <span className="font-semibold text-foreground">{mockPodologists.find(p=>p.id === selectedPodologist)?.name}</span> está agendado para el <span className="font-semibold text-foreground">{selectedDate ? format(selectedDate, 'EEEE, d \'de\' MMMM', { locale: es }) : ''} a las {selectedTime} hs.</span>
                </p>
                <p className="text-sm text-muted-foreground">Recibirás un recordatorio por WhatsApp. ¡Te esperamos!</p>
                <Button onClick={resetFlow} className="mt-6">Agendar otro turno</Button>
            </motion.div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col justify-center">
      <div className="absolute top-4 left-4">
          {step !== 'podologist' && step !== 'confirmation' && (
             <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4"/>Volver
            </Button>
          )}
      </div>

      <BookingSummary/>
      
      <div className="flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}
