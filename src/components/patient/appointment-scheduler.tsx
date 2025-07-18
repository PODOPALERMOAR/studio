'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestAppointmentTimes, type SuggestAppointmentTimesOutput } from '@/ai/flows/suggest-appointment-times';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const formSchema = z.object({
  doctorId: z.string().min(1, 'Por favor, seleccioná un doctor.'),
  appointmentDurationMinutes: z.coerce.number().min(15, 'La duración debe ser de al menos 15 minutos.'),
  date: z.date({ required_error: 'La fecha es obligatoria.' }),
});

export default function AppointmentScheduler() {
  const [loading, setLoading] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doctorId: '',
      appointmentDurationMinutes: 30,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setSuggestedTimes([]);
    setSelectedTime(null);
    try {
      const result: SuggestAppointmentTimesOutput = await suggestAppointmentTimes({
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
      });
      if (result.availableTimes && result.availableTimes.length > 0) {
        setSuggestedTimes(result.availableTimes);
      } else {
        toast({
          title: 'No hay turnos disponibles',
          description: 'No hay horarios disponibles para el criterio seleccionado. Por favor, probá con otra fecha u hora.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Ocurrió un error',
        description: 'No se pudieron obtener los horarios. Por favor, intentá de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  }
  
  function handleConfirmAppointment() {
    if (!selectedTime) return;
    setLoading(true);
    // Simulate API call to confirm
    setTimeout(() => {
        toast({
            title: "¡Turno Confirmado!",
            description: `Tu turno está agendado para el ${format(form.getValues('date'), 'PPP')} a las ${selectedTime}.`,
        });
        setLoading(false);
        setSuggestedTimes([]);
        setSelectedTime(null);
        form.reset({ doctorId: '', appointmentDurationMinutes: 30 });
    }, 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar un Nuevo Turno</CardTitle>
        <CardDescription>
          Completá los detalles a continuación y te sugeriremos horarios disponibles.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor/a</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná un/a doctor/a" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                          <SelectItem value="dr-jones">Dr. Jones</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="appointmentDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Fecha</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal h-10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Elegí una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buscar Horarios Disponibles
            </Button>
          
            {suggestedTimes.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Horarios disponibles para el {format(form.getValues('date'), 'PPP')}:</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {suggestedTimes.map(time => (
                        <Button key={time} variant={selectedTime === time ? 'default' : 'outline'} onClick={() => setSelectedTime(time)}>
                            {time}
                        </Button>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
          {selectedTime && (
            <CardFooter>
                <Button onClick={handleConfirmAppointment} disabled={loading} className="w-full" size="lg">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Turno para las {selectedTime}
                </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
}
