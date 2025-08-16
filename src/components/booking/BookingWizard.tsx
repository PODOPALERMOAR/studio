
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Phone, Check, ArrowRight, ArrowLeft, Users, Stethoscope } from 'lucide-react';
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

type Step = 'podologist' | 'date' | 'time' | 'details' | 'confirmation';

// Datos simulados
const mockPodologists = [
  { id: 'any', name: 'Cualquier podólogo/a' },
  { id: 'silvia', name: 'Podóloga SILVIA' },
  { id: 'natalia', name: 'Podóloga NATALIA' },
  { id: 'martin', name: 'Podólogo MARTIN' },
];

const mockAvailableTimes: Record<string, string[]> = {
  "1": ["09:00", "09:30", "11:00", "14:00", "14:30"],
  "2": ["10:00", "10:30", "12:00", "15:00", "15:30", "16:00"],
  "4": ["09:00", "11:30", "13:00", "13:30"],
  "5": ["14:00", "14:30", "16:30", "17:00"],
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
    setStep('date');
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setIsLoading(true);
    setSelectedDate(date);
    // Simular carga de horarios
    setTimeout(() => {
      setIsLoading(false);
      setStep('time');
    }, 500);
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
    // Simular confirmación
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
    if (step === 'date') setStep('podologist');
    if (step === 'time') setStep('date');
    if (step === 'details') setStep('time');
  };

  const renderStepContent = () => {
    switch (step) {
      case 'podologist':
        return (
          <motion.div key="podologist" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-center font-semibold text-lg mb-6">¿Tenés preferencia por algún profesional?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockPodologists.map(p => (
                <Button key={p.id} variant="outline" size="lg" className="h-12 text-base" onClick={() => handlePodologistSelect(p.id)}>
                   {p.id === 'any' ? <Users className="mr-2 h-5 w-5" /> : <Stethoscope className="mr-2 h-5 w-5" />}
                  {p.name}
                </Button>
              ))}
            </div>
          </motion.div>
        );
      case 'date':
        return (
          <motion.div key="date" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-center font-semibold text-lg mb-4">Seleccioná un día disponible</h3>
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
          </motion.div>
        );
      case 'time':
        const dayKey = selectedDate ? String(Math.ceil((selectedDate.getTime() - startOfDay(new Date()).getTime()) / (1000 * 3600 * 24))) : "0";
        const times = mockAvailableTimes[dayKey] || [];
        return (
          <motion.div key="time" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-center font-semibold text-lg mb-4">
                Horarios para el {selectedDate ? format(selectedDate, 'EEEE d \'de\' MMMM', { locale: es }) : ''}
            </h3>
            {isLoading ? <LoadingSpinner/> : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {times.length > 0 ? times.map(time => (
                <Button key={time} variant="outline" size="lg" onClick={() => handleTimeSelect(time)}>
                  <Clock className="mr-2 h-4 w-4" /> {time}
                </Button>
              )) : <p className="col-span-full text-center text-muted-foreground">No hay horarios para este día.</p>}
            </div>
            )}
          </motion.div>
        );
      case 'details':
        return (
           <motion.div key="details" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-center font-semibold text-lg mb-4">Ya casi estamos. Completá tus datos:</h3>
            <form onSubmit={handleDetailsSubmit} className="space-y-4 max-w-sm mx-auto">
                <div>
                    <Label htmlFor="name"><User className="inline h-4 w-4 mr-1"/> Nombre completo</Label>
                    <Input id="name" value={patientDetails.name} onChange={e => setPatientDetails({...patientDetails, name: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="phone"><Phone className="inline h-4 w-4 mr-1"/> Teléfono</Label>
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
                <p className="text-muted-foreground mb-4">
                    {patientDetails.name}, tu turno con <span className="font-semibold text-foreground">{mockPodologists.find(p=>p.id === selectedPodologist)?.name}</span> está agendado para el <span className="font-semibold text-foreground">{selectedDate ? format(selectedDate, 'EEEE, d \'de\' MMMM', { locale: es }) : ''} a las {selectedTime} hs.</span>
                </p>
                <p className="text-sm text-muted-foreground">Recibirás un recordatorio por WhatsApp. ¡Te esperamos!</p>
                <Button onClick={resetFlow} className="mt-6">Agendar otro turno</Button>
            </motion.div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col justify-center">
      {step !== 'confirmation' && (
        <div className="mb-8">
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                <span className={cn(step === 'podologist' && 'text-primary font-semibold')}>Profesional</span>
                <span className={cn(step === 'date' && 'text-primary font-semibold')}>Fecha</span>
                <span className={cn(step === 'time' && 'text-primary font-semibold')}>Hora</span>
                <span className={cn(step === 'details' && 'text-primary font-semibold')}>Datos</span>
            </div>
            <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/20">
                    <motion.div 
                        style={{ width: `${step === 'podologist' ? 0 : step === 'date' ? 33 : step === 'time' ? 66 : 100}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                        animate={{ width: `${step === 'podologist' ? 0 : step === 'date' ? 33 : step === 'time' ? 66 : 100}%` }}
                    />
                </div>
            </div>
        </div>
      )}
      
      <div className="flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>
      
      {step !== 'podologist' && step !== 'confirmation' && (
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4"/>Volver</Button>
        </div>
      )}
    </div>
  );
}

