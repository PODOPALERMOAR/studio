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
  doctorId: z.string().min(1, 'Please select a doctor.'),
  appointmentDurationMinutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes.'),
  date: z.date({ required_error: 'A date is required.' }),
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
          title: 'No available times',
          description: 'There are no available slots for the selected criteria. Please try another date or time.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to fetch appointment times. Please try again.',
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
            title: "Appointment Confirmed!",
            description: `Your appointment is set for ${format(form.getValues('date'), 'PPP')} at ${selectedTime}.`,
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
        <CardTitle>Schedule a New Appointment</CardTitle>
        <CardDescription>
          Fill in the details below and we'll suggest available times for you.
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
                    <FormLabel>Doctor</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a doctor" />
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
                    <FormLabel>Duration (minutes)</FormLabel>
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
                      <FormLabel>Date</FormLabel>
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
                                <span>Pick a date</span>
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
              Find Available Times
            </Button>
          
            {suggestedTimes.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Available Slots for {format(form.getValues('date'), 'PPP')}:</h3>
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
                    Confirm Appointment for {selectedTime}
                </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
}
