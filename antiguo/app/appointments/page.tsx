
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';

export default function AppointmentsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-semibold text-primary">Página de Turnos</h1>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-foreground">
            <Construction className="mr-3 h-6 w-6 text-primary" />
            Página en Construcción
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-muted-foreground">
            Esta sección está actualmente en desarrollo. Para agendar, cancelar o modificar un turno, por favor utiliza nuestro asistente virtual en la <Link href="/" className="text-primary underline hover:text-primary/80">página principal</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
