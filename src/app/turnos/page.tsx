'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, Calendar, Clock, CheckCircle } from 'lucide-react';
import ChatBot from '@/components/chat/ChatBot';

export default function TurnosPage() {
    const [showChat, setShowChat] = useState(false);

    const handleStartBooking = () => {
        setShowChat(true);
    };

    if (showChat) {
        return <ChatBot isOpen={true} onClose={() => setShowChat(false)} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            {/* Header Simple */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-green-100">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">FH</span>
                            </div>
                            <span className="font-semibold text-gray-800">Foot Haven</span>
                        </div>
                        <div className="text-sm text-gray-600">
                            Podología Profesional
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                        Reserva tu turno de
                        <span className="text-green-600"> podología</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Atención profesional para el cuidado de tus pies.
                        Agenda tu cita en menos de 3 minutos.
                    </p>

                    {/* Botón Principal */}
                    <Button
                        onClick={handleStartBooking}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Buscar Turno Disponible
                    </Button>
                </div>

                {/* Proceso Simple */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="p-6 text-center border-green-100 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">1. Conversá con nuestro asistente</h3>
                        <p className="text-gray-600 text-sm">
                            Contanos qué necesitás y cuándo podés venir
                        </p>
                    </Card>

                    <Card className="p-6 text-center border-green-100 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">2. Elegí tu horario</h3>
                        <p className="text-gray-600 text-sm">
                            Te mostramos los turnos disponibles que mejor te convengan
                        </p>
                    </Card>

                    <Card className="p-6 text-center border-green-100 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">3. Confirmá y listo</h3>
                        <p className="text-gray-600 text-sm">
                            Dejás tus datos, confirmás el pago y ya tenés tu turno
                        </p>
                    </Card>
                </div>

                {/* Información Adicional */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-100">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                ¿Por qué elegir Foot Haven?
                            </h2>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                    Profesionales especializados en podología
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                    Equipamiento moderno y esterilizado
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                    Atención personalizada y cuidadosa
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                    Horarios flexibles y fácil reserva
                                </li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <div className="bg-green-50 rounded-xl p-6">
                                <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <h3 className="font-semibold text-gray-800 mb-2">
                                    Reserva en minutos
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Nuestro sistema inteligente encuentra el mejor horario para vos
                                </p>
                                <Button
                                    onClick={handleStartBooking}
                                    variant="outline"
                                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                                >
                                    Empezar ahora
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Simple */}
            <footer className="bg-white border-t border-green-100 mt-16">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center text-gray-600">
                        <p className="mb-2">© 2025 Foot Haven - Podología Profesional</p>
                        <p className="text-sm">Cuidamos la salud de tus pies con profesionalismo y dedicación</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}