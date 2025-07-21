'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AuthTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const { user, signInWithGoogle, signInWithPhone, verifyPhoneCode, signOut } = useAuth();
  const { toast } = useToast();

  const handleGoogleTest = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "✅ Google Auth", description: "Funciona correctamente" });
    } catch (error: any) {
      toast({ 
        title: "❌ Google Auth Error", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSMSTest = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: "Error", description: "Ingresa un número de teléfono", variant: "destructive" });
      return;
    }

    // Formatear número
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
      toast({ 
        title: "✅ SMS Enviado", 
        description: `Código enviado a ${formattedPhone}` 
      });
    } catch (error: any) {
      console.error('SMS Error:', error);
      toast({ 
        title: "❌ SMS Error", 
        description: `${error.code}: ${error.message}`,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTest = async () => {
    if (!confirmationResult || !verificationCode) {
      toast({ title: "Error", description: "Ingresa el código de verificación", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await verifyPhoneCode(confirmationResult, verificationCode);
      toast({ title: "✅ Verificación", description: "Código verificado correctamente" });
    } catch (error: any) {
      toast({ 
        title: "❌ Verificación Error", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setConfirmationResult(null);
      setVerificationCode('');
      toast({ title: "✅ Sign Out", description: "Sesión cerrada" });
    } catch (error: any) {
      toast({ title: "❌ Sign Out Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4">🧪 Test de Autenticación</h3>
      
      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">✅ Usuario Autenticado</p>
            <p className="text-sm text-green-600">
              {user.displayName || user.phoneNumber || user.email}
            </p>
          </div>
          
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Cerrar Sesión
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Google Test */}
          <div>
            <h4 className="font-semibold mb-2">Google Auth Test</h4>
            <Button 
              onClick={handleGoogleTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Probando...' : 'Probar Google Auth'}
            </Button>
          </div>

          {/* SMS Test */}
          <div>
            <h4 className="font-semibold mb-2">SMS Auth Test</h4>
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="11 1234 5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button 
                onClick={handleSMSTest} 
                disabled={loading || !phoneNumber}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Enviando...' : 'Enviar SMS'}
              </Button>
            </div>
          </div>

          {/* Verification Test */}
          {confirmationResult && (
            <div>
              <h4 className="font-semibold mb-2">Verificar Código</h4>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <Button 
                  onClick={handleVerifyTest} 
                  disabled={loading || verificationCode.length !== 6}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </Card>
  );
}