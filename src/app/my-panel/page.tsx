'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Phone, Mail, FileText, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function MyPanelPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center w-full min-h-screen">
        <div className="w-full max-w-4xl flex flex-col">
          <Header />
          <main className="flex-grow p-4 space-y-6">
            <UserInfo />
            <AppointmentsSection />
            <QuickActions />
          </main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function UserInfo() {
  const { user } = useAuth();
  
  const displayName = user?.displayName || 'Usuario';
  const email = user?.email;
  const phone = user?.phoneNumber;

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            ¡Hola, {displayName}!
          </h1>
          <div className="space-y-1 mt-2">
            {email && (
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm">{phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AppointmentsSection() {
  // Datos simulados - en producción vendrían de Firestore
  const upcomingAppointments = [
    {
      id: '1',
      date: '2025-01-20',
      time: '10:00',
      doctor: 'Dr. García',
      type: 'Consulta general',
      status: 'confirmed'
    }
  ];

  const pastAppointments = [
    {
      id: '2',
      date: '2024-12-15',
      time: '14:30',
      doctor: 'Dra. López',
      type: 'Tratamiento de uñas',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Mis Turnos</h2>
      
      {/* Próximos turnos */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-green-600" />
          Próximos Turnos
        </h3>
        
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(appointment.date).toLocaleDateString('es-AR')} - {appointment.time}
                    </p>
                    <p className="text-sm text-gray-600">{appointment.doctor}</p>
                    <p className="text-sm text-gray-500">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    Reagendar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No tienes turnos programados</p>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Agendar Turno
            </Button>
          </div>
        )}
      </Card>

      {/* Historial */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-600" />
          Historial de Turnos
        </h3>
        
        {pastAppointments.length > 0 ? (
          <div className="space-y-3">
            {pastAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(appointment.date).toLocaleDateString('es-AR')} - {appointment.time}
                    </p>
                    <p className="text-sm text-gray-600">{appointment.doctor}</p>
                    <p className="text-sm text-gray-500">{appointment.type}</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">
                  Completado
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-4">
            No hay turnos en el historial
          </p>
        )}
      </Card>
    </div>
  );
}

function QuickActions() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button className="h-16 bg-green-600 hover:bg-green-700 flex flex-col items-center justify-center">
          <Plus className="h-6 w-6 mb-1" />
          <span>Nuevo Turno</span>
        </Button>
        
        <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
          <FileText className="h-6 w-6 mb-1" />
          <span>Subir Comprobante</span>
        </Button>
        
        <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
          <User className="h-6 w-6 mb-1" />
          <span>Mi Perfil</span>
        </Button>
        
        <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
          <Phone className="h-6 w-6 mb-1" />
          <span>Contactar</span>
        </Button>
      </div>
    </Card>
  );
}