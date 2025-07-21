'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function TestCalendarPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testCalendarSync = async () => {
    setTesting(true);
    try {
      // Llamar a la API de sincronización
      const response = await fetch('/api/sync/test', {
        method: 'POST'
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const runFullSync = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/sync/full', {
        method: 'POST'
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <div className="w-full max-w-6xl flex flex-col">
        <Header />
        <main className="flex-grow p-4 space-y-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">
              🗓️ Test Google Calendar - PODOPALERMO
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Panel de Control */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Control de Sincronización
                </h2>
                
                <div className="space-y-4">
                  <Button
                    onClick={testCalendarSync}
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? 'Probando...' : 'Probar Conexión Calendarios'}
                  </Button>
                  
                  <Button
                    onClick={runFullSync}
                    disabled={testing}
                    variant="outline"
                    className="w-full"
                  >
                    {testing ? 'Sincronizando...' : 'Sincronización Completa (24 meses)'}
                  </Button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">📊 Calendarios PODOPALERMO</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Podóloga SILVIA</li>
                    <li>• Podóloga NATALIA</li>
                    <li>• Podóloga ELIZABETH</li>
                    <li>• Podóloga LORENA</li>
                    <li>• Podólogo MARTIN</li>
                    <li>• Podóloga DIANA</li>
                    <li>• Podóloga LUCIANA</li>
                  </ul>
                </div>
              </Card>

              {/* Resultados */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Resultados de Sincronización
                </h2>
                
                {!results ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Ejecuta una sincronización para ver resultados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.success ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Sincronización Exitosa</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Error en Sincronización</span>
                      </div>
                    )}
                    
                    {results.stats && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-2xl font-bold text-gray-800">
                            {results.stats.totalEvents}
                          </div>
                          <div className="text-sm text-gray-600">Total Eventos</div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded">
                          <div className="text-2xl font-bold text-green-800">
                            {results.stats.appointmentsParsed}
                          </div>
                          <div className="text-sm text-green-600">Turnos Parseados</div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-2xl font-bold text-blue-800">
                            {results.stats.availableSlots}
                          </div>
                          <div className="text-sm text-blue-600">Slots Disponibles</div>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded">
                          <div className="text-2xl font-bold text-purple-800">
                            {results.stats.patientsUpdated}
                          </div>
                          <div className="text-sm text-purple-600">Pacientes</div>
                        </div>
                      </div>
                    )}
                    
                    {results.errors && results.errors.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <h4 className="font-medium text-red-800 mb-2">Errores:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {results.errors.slice(0, 5).map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {results.errors.length > 5 && (
                            <li>• ... y {results.errors.length - 5} errores más</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
            
            {/* Información de Configuración */}
            <Card className="p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4">⚙️ Configuración Requerida</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">📋 Checklist</h3>
                  <ul className="text-sm space-y-1">
                    <li>🔄 Google Calendar API habilitada</li>
                    <li>🔄 Service Account creada</li>
                    <li>🔄 Calendarios compartidos</li>
                    <li>🔄 Variables de entorno configuradas</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">🎯 Funcionalidades</h3>
                  <ul className="text-sm space-y-1">
                    <li>✅ Parser inteligente N: T:</li>
                    <li>✅ Unificación por teléfono</li>
                    <li>✅ Detección slots "Ocupar"</li>
                    <li>✅ Base de datos optimizada</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}