'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Camera,
  Save,
  Edit
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    location: 'Buenos Aires, Argentina',
    role: 'Administrador',
    department: 'Administración',
    joinDate: '2024-01-01'
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      // Aquí iría la lógica para actualizar el perfil
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular API call
      
      toast({
        title: "Perfil Actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
      
      setEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <User className="h-8 w-8 mr-3 text-blue-600" />
              Mi Perfil
            </h1>
            <p className="text-gray-600 mt-1">
              Administra tu información personal y configuración de cuenta
            </p>
          </div>
          
          <Button 
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {editing ? (
              <>
                <Save className="h-4 w-4" />
                <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                <span>Editar Perfil</span>
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <Card className="p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-32 w-32 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
                  <User className="h-16 w-16 text-white" />
                </div>
                {editing && (
                  <button className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{profile.displayName}</h3>
              <p className="text-gray-600">{profile.role}</p>
              <p className="text-sm text-gray-500">{profile.department}</p>
            </div>
          </Card>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Nombre Completo</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                    disabled={!editing}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      disabled={!editing}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      disabled={!editing}
                      className="pl-10"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      disabled={!editing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  disabled={!editing}
                  className="mt-1"
                  rows={3}
                  placeholder="Cuéntanos un poco sobre ti..."
                />
              </div>
            </Card>

            {/* Work Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Laboral</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Cargo</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => setProfile({...profile, role: e.target.value})}
                    disabled={!editing}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => setProfile({...profile, department: e.target.value})}
                    disabled={!editing}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="joinDate">Fecha de Ingreso</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={profile.joinDate}
                    onChange={(e) => setProfile({...profile, joinDate: e.target.value})}
                    disabled={!editing}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Account Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Cuenta</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">127</div>
                  <p className="text-sm text-gray-600">Días activo</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">45</div>
                  <p className="text-sm text-gray-600">Acciones realizadas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">12</div>
                  <p className="text-sm text-gray-600">Reportes generados</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}