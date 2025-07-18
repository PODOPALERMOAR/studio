'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateVoucher, type ValidateVoucherOutput } from '@/ai/flows/validate-voucher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  voucher: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'El voucher en PDF es obligatorio.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Solo se permiten archivos PDF.')
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, 'El tamaño del archivo debe ser menor a 5MB.'),
});

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
}

export default function VoucherValidator() {
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateVoucherOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setValidationResult(null);

    try {
        const file = values.voucher[0];
        const pdfDataUri = await fileToDataUri(file);

        const result = await validateVoucher({ pdfDataUri });
        setValidationResult(result);

        if (result.isValid) {
            toast({
                title: '¡Voucher Validado!',
                description: `Paciente: ${result.patientName}. Tu turno será agendado para el ${result.appointmentDate}.`,
            });
        }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Ocurrió un error',
        description: 'No se pudo validar el voucher. Por favor, intentá de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validar y Subir Voucher</CardTitle>
        <CardDescription>
          Subí tu voucher en PDF y nuestra IA lo validará para agendar tu turno automáticamente.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
                <FormField
                    control={form.control}
                    name="voucher"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Voucher PDF</FormLabel>
                        <FormControl>
                        <Input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => field.onChange(e.target.files)}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Validar Voucher
                </Button>
                {validationResult && (
                    <div className="w-full">
                        {validationResult.isValid ? (
                            <Alert variant="default">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Validación Exitosa</AlertTitle>
                                <AlertDescription>
                                    Paciente: {validationResult.patientName}. Fecha de turno: {validationResult.appointmentDate}.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Validación Fallida</AlertTitle>
                                <AlertDescription>
                                    El voucher proporcionado no es válido. Por favor, revisá el documento y volvé a intentarlo.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
