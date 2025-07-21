'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Key, 
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useToast } from '@/hooks/use-toast';

export default function SecurityPage() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: true
  });

  const [sessions] = useState([
    {
      id: 1,
      device: 'MacBook Pro',
      location: 'Buenos Aires, Argentina',
      lastActive: '2 minutos atrás',
      current: true
    },
    {
      id: 2,
      device: 'iPhone 14',
      location: 'Buenos Aires, Argentina',
      lastActive: '1 hora atrás',
      current: false
    },
    {
      id: 3,
      device: 'Chrome - Windows',
      location: 'Buenos Aires, Argentina',
      lastActive: '2 días atrás',
      current: false
    }
  ]);

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Aquí iría la lógica para cambiar la contraseña
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
      
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setLoading(true);
      // Aquí iría la lógica para habilitar/deshabilitar 2FA
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: !prev.twoFactorEnabled
      }));
      
      toast({
        title: securitySettings.twoFactorEnabled ? "2FA Deshabilitado" : "2FA Habilitado",
        description: securitySettings.twoFactorEnabled 
          ? "La autenticación de dos factores ha sido deshabilitada."
          : "La autenticación de dos factores ha sido habilitada.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de 2FA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = (sessionId: number) => {
    toast({
      title: "Sesión Terminada",
      description: "La sesión ha sido cerrada exitosamente.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-blue-600" />
              Seguridad
            </h1>
            <p className="text-gray-600 mt-1">
              Administra la seguridad de tu cuenta y configuraciones de privacidad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2 text-blue-600" />
              Cambiar Contraseña
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button 
                onClick={handlePasswordChange}
                disabled={loading || !passwords.current || !passwords.new || !passwords.confirm}
                className="w-full"
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="h-5 w-5 mr-2 text-blue-600" />
              Autenticación de Dos Factores
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">2FA Status</p>
                  <p className="text-sm text-gray-600">
                    {securitySettings.twoFactorEnabled 
                      ? 'Habilitado - Tu cuenta está protegida'
                      : 'Deshabilitado - Recomendamos habilitarlo'
                    }
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                  disabled={loading}
                />
              </div>
              
              {securitySettings.twoFactorEnabled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">2FA Activo</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Tu cuenta está protegida con autenticación de dos factores.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium">Recomendación de Seguridad</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Habilita 2FA para mayor seguridad en tu cuenta.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Security Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuraciones de Seguridad</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificaciones por Email</p>
                <p className="text-sm text-gray-600">Recibir alertas de seguridad por email</p>
              </div>
              <Switch
                checked={securitySettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setSecuritySettings(prev => ({...prev, emailNotifications: checked}))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de Inicio de Sesión</p>
                <p className="text-sm text-gray-600">Notificar sobre nuevos inicios de sesión</p>
              </div>
              <Switch
                checked={securitySettings.loginAlerts}
                onCheckedChange={(checked) => 
                  setSecuritySettings(prev => ({...prev, loginAlerts: checked}))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Timeout de Sesión</p>
                <p className="text-sm text-gray-600">Cerrar sesión automáticamente por inactividad</p>
              </div>
              <Switch
                checked={securitySettings.sessionTimeout}
                onCheckedChange={(checked) => 
                  setSecuritySettings(prev => ({...prev, sessionTimeout: checked}))
                }
              />
            </div>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sesiones Activas</h3>
          
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium flex items-center">
                      {session.device}
                      {session.current && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Actual
                        </span>
                      )}
                    </p>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {session.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.lastActive}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                  >
                    Terminar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}