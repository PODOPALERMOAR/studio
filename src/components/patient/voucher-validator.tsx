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
    .refine((files) => files?.length === 1, 'Voucher PDF is required.')
    .refine((files) => files?.[0]?.type === 'application/pdf', 'Only PDF files are allowed.')
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, 'File size must be less than 5MB.'),
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
                title: 'Voucher Validated!',
                description: `Patient: ${result.patientName}. Your appointment will be scheduled for ${result.appointmentDate}.`,
            });
        }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to validate the voucher. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validate and Upload Voucher</CardTitle>
        <CardDescription>
          Upload your PDF voucher and our AI will validate it to schedule your appointment automatically.
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
                    Validate Voucher
                </Button>
                {validationResult && (
                    <div className="w-full">
                        {validationResult.isValid ? (
                            <Alert variant="default">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Validation Successful</AlertTitle>
                                <AlertDescription>
                                    Patient: {validationResult.patientName}. Appt. date: {validationResult.appointmentDate}.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Validation Failed</AlertTitle>
                                <AlertDescription>
                                    The provided voucher is invalid. Please check the document and try again.
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
