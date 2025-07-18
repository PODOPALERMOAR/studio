
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo width={80} height={80} className="mb-4" />
          <CardTitle className="text-2xl font-bold text-primary">Acceso de Desarrollo</CardTitle>
          <CardDescription>
            El inicio de sesión está desactivado para facilitar las pruebas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/admin/dashboard">
              Ir al Panel de Administrador
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Para reactivar la seguridad, restaura el archivo <strong>middleware.ts</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
