'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </Card>
      </div>
    );
  }

  // Si no hay usuario, mostrar fallback o pantalla de login
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
          <Card className="p-8 text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Acceso Requerido
            </h2>
            
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para acceder a esta sección.
            </p>
            
            <Button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
            
            <p className="text-sm text-gray-500 mt-4">
              Puedes usar tu cuenta de Google o tu número de teléfono
            </p>
          </Card>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>;
}