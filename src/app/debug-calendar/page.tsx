'use client';

import { useState, useEffect } from 'react';

interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

interface Event {
  id: string;
  summary: string;
  start: any;
  end: any;
  description?: string;
  creator?: any;
}

export default function DebugCalendarPage() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [specificResults, setSpecificResults] = useState<any[]>([]);
  const [syncResults, setSyncResults] = useState<any>(null);

  // Cargar calendarios al inicio
  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/debug/calendars');
      const data = await response.json();
      
      console.log('Respuesta completa del servidor:', data);
      
      if (data.success) {
        setCalendars(data.calendars);
        console.log('Calendarios encontrados:', data.calendars);
      } else {
        setError(`Error: ${data.error}`);
        if (data.errorDetails) {
          console.error('Detalles del error:', data.errorDetails);
          setError(prev => prev + `\n\nDetalles: ${data.errorDetails.message}`);
        }
      }
    } catch (err) {
      console.error('Error en fetch:', err);
      setError('Error cargando calendarios: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (calendarId: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/debug/events?calendarId=${encodeURIComponent(calendarId)}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
        console.log('Eventos encontrados:', data.events);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error cargando eventos: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarSelect = (calendarId: string) => {
    setSelectedCalendar(calendarId);
    loadEvents(calendarId);
  };

  const testSpecificCalendars = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/debug/test-specific-calendar');
      const data = await response.json();
      
      if (data.success) {
        setSpecificResults(data.results);
        console.log('Resultados de calendarios específicos:', data.results);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error probando calendarios específicos: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const testFullSync = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/debug/test-sync');
      const data = await response.json();
      
      if (data.success) {
        setSyncResults(data);
        console.log('Resultados de sincronización completa:', data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error probando sincronización: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Google Calendar</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="text-blue-600 mb-4">Cargando...</div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Calendarios */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Calendarios Disponibles</h2>
          <div className="space-y-2">
            {calendars.map((calendar) => (
              <div 
                key={calendar.id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedCalendar === calendar.id ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => handleCalendarSelect(calendar.id)}
              >
                <div className="font-medium">{calendar.summary}</div>
                <div className="text-sm text-gray-600">ID: {calendar.id}</div>
                <div className="text-sm text-gray-500">
                  Rol: {calendar.accessRole} 
                  {calendar.primary && ' (Principal)'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 space-x-2">
            <button 
              onClick={loadCalendars}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              Recargar Calendarios
            </button>
            <button 
              onClick={testSpecificCalendars}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              Probar IDs Específicos
            </button>
            <button 
              onClick={testFullSync}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              disabled={loading}
            >
              Probar Sincronización Completa
            </button>
          </div>
        </div>
        
        {/* Lista de Eventos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Eventos {selectedCalendar && `(${calendars.find(c => c.id === selectedCalendar)?.summary})`}
          </h2>
          
          {selectedCalendar ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="p-3 border rounded">
                    <div className="font-medium">{event.summary}</div>
                    <div className="text-sm text-gray-600">
                      {event.start?.dateTime ? 
                        new Date(event.start.dateTime).toLocaleString('es-AR') :
                        event.start?.date
                      }
                    </div>
                    {event.description && (
                      <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No hay eventos en los próximos 7 días</div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Selecciona un calendario para ver eventos</div>
          )}
        </div>
      </div>
      
      {/* Resultados de Calendarios Específicos */}
      {specificResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Prueba de Calendarios Específicos</h2>
          <div className="space-y-4">
            {specificResults.map((result, index) => (
              <div key={index} className={`p-4 border rounded ${result.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <div className="font-medium">
                  {result.success ? '✅' : '❌'} {result.name || 'Calendario'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  ID: {result.calendarId}
                </div>
                {result.success ? (
                  <div className="text-sm text-green-700 mt-2">
                    Eventos encontrados: {result.eventsCount}
                    {result.events.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {result.events.map((event: any, i: number) => (
                          <div key={i} className="text-xs bg-white p-2 rounded">
                            <strong>{event.summary}</strong>
                            <br />
                            {event.start?.dateTime ? 
                              new Date(event.start.dateTime).toLocaleString('es-AR') :
                              event.start?.date
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-700 mt-2">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados de Sincronización Completa */}
      {syncResults && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Sincronización Completa</h2>
          <div className="bg-blue-50 border border-blue-300 p-4 rounded">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{syncResults.summary.totalEvents}</div>
                <div className="text-sm text-gray-600">Total Eventos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{syncResults.summary.occupySlots}</div>
                <div className="text-sm text-gray-600">Slots "Ocupar"</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{syncResults.summary.appointments}</div>
                <div className="text-sm text-gray-600">Turnos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{syncResults.summary.payments}</div>
                <div className="text-sm text-gray-600">Pagos</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Slots Disponibles</h4>
                {syncResults.sampleEvents.occupySlots.map((event: any, i: number) => (
                  <div key={i} className="text-xs bg-green-100 p-2 rounded mb-1">
                    <strong>{event.summary}</strong><br />
                    {event.podologist}<br />
                    {new Date(event.start.dateTime || event.start.date).toLocaleString('es-AR')}
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-700 mb-2">Turnos Confirmados</h4>
                {syncResults.sampleEvents.appointments.map((event: any, i: number) => (
                  <div key={i} className="text-xs bg-orange-100 p-2 rounded mb-1">
                    <strong>{event.summary}</strong><br />
                    {event.podologist}<br />
                    {new Date(event.start.dateTime || event.start.date).toLocaleString('es-AR')}
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-700 mb-2">Pagos</h4>
                {syncResults.sampleEvents.payments.map((event: any, i: number) => (
                  <div key={i} className="text-xs bg-purple-100 p-2 rounded mb-1">
                    <strong>{event.summary}</strong><br />
                    {event.podologist}<br />
                    {new Date(event.start.dateTime || event.start.date).toLocaleString('es-AR')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de Debug */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Información de Debug</h3>
        <div className="text-sm space-y-1">
          <div>Total calendarios (lista general): {calendars.length}</div>
          <div>Calendario seleccionado: {selectedCalendar || 'Ninguno'}</div>
          <div>Total eventos: {events.length}</div>
          <div>Calendarios específicos probados: {specificResults.length}</div>
        </div>
      </div>
    </div>
  );
}