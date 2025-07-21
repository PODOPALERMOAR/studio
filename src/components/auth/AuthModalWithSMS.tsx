'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationResult } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthStep = 'choose' | 'phone' | 'verify';

export default function AuthModalWithSMS({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>('choose');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signInWithGoogle, signInWithPhone, verifyPhoneCode } = useAuth();
  const { toast } = useToast();

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

  const handlePhoneSignIn = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu número de teléfono.",
        variant: "destructive",
      });
      return;
    }

    // Formatear número para Argentina
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('54')) {
      formattedPhone = '54' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    setLoading(true);
    try {
      const result = await signInWithPhone(formattedPhone);
      setConfirmationResult(result);
      setStep('verify');
      toast({
        title: "Código enviado",
        description: "Te enviamos un código de verificación por SMS.",
      });
    } catch (error: any) {
      let errorMessage = "No se pudo enviar el código de verificación.";
      
      if (error.code === 'auth/billing-not-enabled') {
        errorMessage = "La autenticación por SMS requiere configurar el plan de pago en Firebase. Por favor usa Google para iniciar sesión.";
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "El número de teléfono no es válido. Verifica el formato.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || !confirmationResult) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código de verificación.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await verifyPhoneCode(confirmationResult, verificationCode);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Código de verificación incorrecto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('choose');
    setPhoneNumber('');
    setVerificationCode('');
    setConfirmationResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            {step !== 'choose' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => step === 'verify' ? setStep('phone') : setStep('choose')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold">
              {step === 'choose' && 'Iniciar Sesión'}
              {step === 'phone' && 'Número de Teléfono'}
              {step === 'verify' && 'Verificar Código'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === 'choose' && (
            <>
              <p className="text-gray-600 text-center mb-6">
                Elige cómo quieres iniciar sesión
              </p>
              
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Continuar con Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">O</span>
                </div>
              </div>

              <Button
                onClick={() => setStep('phone')}
                variant="outline"
                className="w-full"
              >
                <Phone className="mr-2 h-4 w-4" />
                Continuar con Teléfono
              </Button>
            </>
          )}

          {step === 'phone' && (
            <>
              <p className="text-gray-600 text-center mb-4">
                Ingresa tu número de teléfono para recibir un código de verificación
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de teléfono
                  </label>
                  <Input
                    type="tel"
                    placeholder="11 1234 5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: sin 0 ni 15 (ej: 11 1234 5678)
                  </p>
                </div>

                <Button
                  onClick={handlePhoneSignIn}
                  disabled={loading || !phoneNumber.trim()}
                  className="w-full"
                >
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <p className="text-gray-600 text-center mb-4">
                Ingresa el código de 6 dígitos que enviamos a tu teléfono
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de verificación
                  </label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </Button>

                <Button
                  onClick={() => setStep('phone')}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  ¿No recibiste el código? Enviar nuevamente
                </Button>
              </div>
            </>
          )}
        </div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </Card>
    </div>
  );
}