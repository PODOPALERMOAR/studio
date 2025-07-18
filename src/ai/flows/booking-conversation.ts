import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.0-flash',
});

export interface BookingConversationInput {
    message: string;
    context?: {
        step: 'greeting' | 'preference' | 'slots' | 'details' | 'payment' | 'confirmed';
        userInfo?: {
            name?: string;
            phone?: string;
            reason?: string;
        };
        selectedSlot?: {
            date: string;
            time: string;
            doctor: string;
        };
    };
}

export interface BookingConversationOutput {
    response: string;
    nextStep: string;
    options?: Array<{
        label: string;
        action: string;
        data?: any;
    }>;
    needsInput?: boolean;
}

export const bookingConversation = ai.defineFlow(
    {
        name: 'bookingConversation',
        inputSchema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                context: {
                    type: 'object',
                    properties: {
                        step: { type: 'string' },
                        userInfo: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                phone: { type: 'string' },
                                reason: { type: 'string' }
                            }
                        },
                        selectedSlot: {
                            type: 'object',
                            properties: {
                                date: { type: 'string' },
                                time: { type: 'string' },
                                doctor: { type: 'string' }
                            }
                        }
                    }
                }
            },
            required: ['message']
        },
        outputSchema: {
            type: 'object',
            properties: {
                response: { type: 'string' },
                nextStep: { type: 'string' },
                options: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            label: { type: 'string' },
                            action: { type: 'string' },
                            data: { type: 'object' }
                        }
                    }
                },
                needsInput: { type: 'boolean' }
            },
            required: ['response', 'nextStep']
        }
    },
    async (input) => {
        const { message, context } = input;
        const currentStep = context?.step || 'greeting';

        // Simular disponibilidad de turnos (en producción esto vendría de Google Calendar)
        const availableSlots = [
            { date: 'Mañana', time: '10:00 AM', doctor: 'Dr. García', id: '1' },
            { date: 'Mañana', time: '2:30 PM', doctor: 'Dra. López', id: '2' },
            { date: 'Pasado mañana', time: '9:00 AM', doctor: 'Dr. García', id: '3' },
            { date: 'Pasado mañana', time: '4:00 PM', doctor: 'Dr. Martínez', id: '4' }
        ];

        switch (currentStep) {
            case 'greeting':
                return {
                    response: "¡Hola! Soy tu asistente para agendar turnos de podología. ¿Cómo te gustaría buscar tu turno?",
                    nextStep: 'preference',
                    options: [
                        { label: "Próximo turno disponible", action: "next_available" },
                        { label: "Elegir día y horario", action: "choose_time" },
                        { label: "Podólogo específico", action: "choose_doctor" }
                    ]
                };

            case 'preference':
                if (message.includes('próximo') || message.includes('disponible')) {
                    return {
                        response: "Perfecto. Estos son los próximos turnos disponibles:",
                        nextStep: 'slots',
                        options: availableSlots.slice(0, 3).map(slot => ({
                            label: `${slot.date} ${slot.time} - ${slot.doctor}`,
                            action: 'select_slot',
                            data: slot
                        }))
                    };
                } else if (message.includes('día') || message.includes('horario')) {
                    return {
                        response: "¿Qué día te viene mejor?",
                        nextStep: 'slots',
                        options: [
                            { label: "Esta semana", action: "this_week" },
                            { label: "Próxima semana", action: "next_week" },
                            { label: "Cualquier día", action: "any_day" }
                        ]
                    };
                } else {
                    return {
                        response: "Estos son nuestros podólogos disponibles:",
                        nextStep: 'slots',
                        options: [
                            { label: "Dr. García - Pie diabético", action: "doctor_garcia" },
                            { label: "Dra. López - Podología deportiva", action: "doctor_lopez" },
                            { label: "Dr. Martínez - Podología general", action: "doctor_martinez" }
                        ]
                    };
                }

            case 'slots':
                return {
                    response: `Excelente elección. Para confirmar tu turno, necesito algunos datos básicos:`,
                    nextStep: 'details',
                    needsInput: true
                };

            case 'details':
                if (!context?.userInfo?.name) {
                    return {
                        response: "Por favor, decime tu nombre completo:",
                        nextStep: 'details',
                        needsInput: true
                    };
                } else if (!context?.userInfo?.phone) {
                    return {
                        response: `Gracias ${context.userInfo.name}. Ahora necesito tu número de teléfono:`,
                        nextStep: 'details',
                        needsInput: true
                    };
                } else {
                    return {
                        response: "¡Perfecto! Tu turno está casi confirmado. Para finalizar, necesito que realices el pago de $10.000.",
                        nextStep: 'payment',
                        options: [
                            { label: "Ver datos para transferencia", action: "show_payment" },
                            { label: "Pagar con tarjeta", action: "card_payment" }
                        ]
                    };
                }

            case 'payment':
                return {
                    response: `¡Listo! Tu turno ha sido confirmado. Te enviaremos un recordatorio por WhatsApp 24 horas antes.
          
📅 Turno confirmado:
• Fecha: ${context?.selectedSlot?.date}
• Hora: ${context?.selectedSlot?.time}
• Podólogo: ${context?.selectedSlot?.doctor}
• Paciente: ${context?.userInfo?.name}

📍 Dirección: Av. Santa Fe 3288, CABA`,
                    nextStep: 'confirmed',
                    options: [
                        { label: "Agendar otro turno", action: "new_booking" },
                        { label: "Finalizar", action: "close" }
                    ]
                };

            default:
                return {
                    response: "¿En qué más puedo ayudarte?",
                    nextStep: 'greeting',
                    options: [
                        { label: "Agendar nuevo turno", action: "new_booking" }
                    ]
                };
        }
    }
);