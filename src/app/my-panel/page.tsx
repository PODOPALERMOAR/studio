
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Phone, Mail, FileText, Plus, MoreVertical, Edit, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export default function MyPanelPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center w-full min-h-screen bg-gray-50/50">
        <div className="w-full max-w-4xl flex flex-col">
          <Header />
          <main className="flex-grow p-4 md:p-6 space-y-6">
            <UserInfo />
            <AppointmentsSection />
          </main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function UserInfo() {
  const { user } = useAuth();
  const router = useRouter();
  
  const displayName = user?.displayName || 'Usuario';
  const email = user?.email;
  const phone = user?.phoneNumber;

  return (
    <Card className="p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-6">
        <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 text-primary rounded-full flex items-center justify-center mb-4 sm:mb-0">
          <User className="h-10 w-10" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            ¡Hola, {displayName}!
          </h1>
          <p className="text-muted-foreground mb-3">Bienvenido a tu panel personal.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {email && (
              <div className="flex items-center text-gray-600 text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center text-gray-600 text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{phone}</span>
              </div>
            )}
          </div>
        </div>
        <Button onClick={() => router.push('/')} className="mt-4 sm:mt-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Agendar Nuevo Turno
        </Button>
      </div>
    </Card>
  );
}

function AppointmentsSection() {
  // Datos simulados - en producción vendrían de Firestore
  const upcomingAppointments = [
    {
      id: '1',
      date: '2025-08-20',
      time: '10:00',
      podologist: 'Podóloga SILVIA',
      type: 'Consulta general',
      status: 'Confirmado'
    }
  ];

  const pastAppointments = [
    {
      id: '2',
      date: '2025-07-15',
      time: '14:30',
      podologist: 'Podóloga LORENA',
      type: 'Tratamiento de uñas',
      status: 'Completado'
    },
     {
      id: '3',
      date: '2025-06-10',
      time: '11:00',
      podologist: 'Podólogo MARTIN',
      type: 'Control',
      status: 'Completado'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Mis Turnos</h2>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-base font-semibold">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Próximos Turnos
            </CardTitle>
        </CardHeader>
        <CardContent>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs uppercase">{new Date(appointment.date).toLocaleString('es-AR', { month: 'short' })}</span>
                    <span className="text-xl font-bold">{new Date(appointment.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {new Date(appointment.date).toLocaleDateString('es-AR', { weekday: 'long' })}, {appointment.time}
                    </p>
                    <p className="text-sm text-gray-600">{appointment.podologist}</p>
                    <p className="text-sm text-gray-500">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0 w-full sm:w-auto">
                   <Badge variant="default">Confirmado</Badge>
                   <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                               <Edit className="mr-2 h-4 w-4" />
                               <span>Reprogramar</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem className="text-red-600 focus:text-red-600">
                               <XCircle className="mr-2 h-4 w-4" />
                               <span>Cancelar Turno</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No tenés turnos programados.</p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agendar mi primer turno
            </Button>
          </div>
        )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base font-semibold">
            <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
            Historial de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
        {pastAppointments.length > 0 ? (
          <div className="space-y-3">
            {pastAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      {new Date(appointment.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-500">{appointment.podologist}</p>
                  </div>
                </div>
                <Badge variant="secondary">Completado</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6 text-sm">
            Aún no tenés turnos en tu historial.
          </p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}

    