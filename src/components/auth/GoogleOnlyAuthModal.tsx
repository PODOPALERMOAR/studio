'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Mail, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMounted } from '@/hooks/use-mounted';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GoogleOnlyAuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const mounted = useMounted();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente con Google.",
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar sesión con Google.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Iniciar Sesión</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-center mb-6">
            Inicia sesión con tu cuenta de Google
          </p>
          
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            <Mail className="mr-2 h-4 w-4" />
            {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
          </Button>

          {/* Información sobre SMS */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">
                  Autenticación por SMS
                </h4>
                <p className="text-sm text-amber-700">
                  Estamos trabajando en habilitar la autenticación por SMS. 
                  Mientras tanto, puedes usar Google que es igual de seguro y más rápido.
                </p>
              </div>
            </div>
          </div>

          {/* Beneficios de Google Auth */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">
              ✅ Ventajas de Google Auth
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Más rápido y seguro</li>
              <li>• No necesitas recordar contraseñas</li>
              <li>• Sincronización automática</li>
              <li>• Usado por millones de sitios web</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}