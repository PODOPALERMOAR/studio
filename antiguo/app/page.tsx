
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription as ShadAlertDescription, AlertTitle as ShadAlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  User,
  ArrowLeft,
  Leaf,
  AlertTriangle as AlertTriangleIcon,
  Send,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Home,
  ChevronRight as ChevronRightIcon,
  BriefcaseMedical,
  Replace,
  Clock,
  MessageSquareQuote,
  Bell,
  RotateCcw,
  UploadCloud,
  FileText,
  Copy,
  AlertCircle,
  TimerIcon,
  ExternalLink,
  X as XIcon,
  Gift as GiftIcon,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Flows
import { startBookingConversation, type StartBookingConversationOutput } from '@/ai/flows/start-booking-conversation';
import { findNextAvailableSlot, type FindNextAvailableSlotOutput, type FindNextAvailableSlotInput } from '@/ai/flows/findNextAvailableSlot';
import { findSlotsByPreference, type FindSlotsByPreferenceOutput, type FindSlotsByPreferenceInput } from '@/ai/flows/findSlotsByPreference';
import { verifyPaymentAndCreateAppointment, type VerifyPaymentAndCreateAppointmentInput, type VerifyPaymentAndCreateAppointmentOutput } from '@/ai/flows/verify-payment-and-create-appointment';
import { checkIfUserExistsByPhone, type CheckIfUserExistsByPhoneInput, type CheckIfUserExistsByPhoneOutput } from '@/ai/flows/checkIfUserExistsByPhone';

// UI Components
import { Textarea } from '@/components/ui/textarea';
import { Input as ShadInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingDots } from '@/components/common/LoadingDots';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Config
import { getPaymentDetailsForPodologist, type PaymentAccountDetails } from '@/config/paymentDetails';

interface CountryOption {
  value: string;
  label: string;
  placeholder: string;
  needsMobileNine: boolean;
  maxLength: number;
}

const countryOptions: CountryOption[] = [
  { value: "+54", label: "🇦🇷 Argentina (+54)", placeholder: "1123456789 (sin 0 ni 15)", needsMobileNine: true, maxLength: 10 },
  { value: "+598", label: "🇺🇾 Uruguay (+598)", placeholder: "99123456", needsMobileNine: false, maxLength: 8 },
  { value: "+56", label: "🇨🇱 Chile (+56)", placeholder: "912345678", needsMobileNine: false, maxLength: 9 },
  { value: "+55", label: "🇧🇷 Brasil (+55)", placeholder: "DDD + 9XXXXXXXX (ej. 11912345678)", needsMobileNine: false, maxLength: 11 },
  { value: "+1", label: "🇺🇸 USA (+1)", placeholder: "Area code + número (ej. 2125551234)", needsMobileNine: false, maxLength: 10 },
  { value: "+34", label: "🇪🇸 España (+34)", placeholder: "612345678", needsMobileNine: false, maxLength: 9 },
];
const DEFAULT_COUNTRY_VALUE: string = "+54";

const MAX_REASON_LENGTH: number = 300;
const PAYMENT_AMOUNT_ARS: number = 10000;
const RESERVATION_TIMEOUT_MS: number = 10 * 60 * 1000; // 10 minutes
const CECILIA_WHATSAPP_NUMBER_RAW: string = "5491167437969";
const PODOPALERMO_ADDRESS: string = 'Av. Sta. Fe 3288, Planta Baja "C", C1425 CABA';

const bookingReasonPlaceholders: string[] = [
  "Ej: control mensual",
  "Ej: dolor en el talón",
  "Ej: uña encarnada",
  "Ej: consulta general",
  "Ej: me salió algo y no entiendo",
  "Ej: no sé qué tengo, necesito un chequeo",
  "Ej: molestia al caminar",
  "-Control mensual",
];


interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  options?: Array<{ label: string; action: string; metadata?: any }>;
  timestamp?: string;
  eventId?: string;
  searchContext?: FindSlotsByPreferenceOutput['appliedPodologistInfo'] & { filterType?: string };
}

interface SelectedSlotInfo {
  eventIdGCalOriginal: string;
  timestamp: string;
  podologistKey: string;
  podologistName: string;
  podologistCalendarId: string;
}

export default function WelcomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [bookingViewActive, setBookingViewActive] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [bookingStep, setBookingStep] = useState<'initial' | 'awaitingPatientDetails' | 'awaitingBookingReason' | 'awaitingPaymentProof' | 'bookingConfirmed' | 'bookingError'>('initial');
  const [patientFullName, setPatientFullName] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
    countryOptions.find(opt => opt.value === DEFAULT_COUNTRY_VALUE) || countryOptions[0]
  );
  const [patientTelefono, setPatientTelefono] = useState<string>("");
  const [bookingReason, setBookingReason] = useState<string>("");
  const [patientDetailsError, setPatientDetailsError] = useState<string | null>(null);
  const [currentReasonPlaceholder, setCurrentReasonPlaceholder] = useState<string>(bookingReasonPlaceholders[0]);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<SelectedSlotInfo | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [paymentProofDataUri, setPaymentProofDataUri] = useState<string | null>(null);
  const [isReportProblemDialogOpen, setIsReportProblemDialogOpen] = useState<boolean>(false);
  const [reporterEmail, setReporterEmail] = useState<string>('');
  const [problemMessage, setProblemMessage] = useState<string>('');
  const [lastOfferedSlotFromFindNext, setLastOfferedSlotFromFindNext] = useState<{ timestamp: string, podologistKey: string } | undefined>(undefined);
  const [lastPreferenceSearchContext, setLastPreferenceSearchContext] = useState<{
    key?: string;
    name?: string;
    filterType?: string;
    previousSlotTimestamp?: string;
  } | undefined>(undefined);
  const [finalBookingMessage, setFinalBookingMessage] = useState<string | null>(null);
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState<PaymentAccountDetails | null>(null);
  const [slotReservationExpiresAt, setSlotReservationExpiresAt] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [showWhatsAppContactButtonForSlotTaken, setShowWhatsAppContactButtonForSlotTaken] = useState<boolean>(false);
  const [googleCalendarLink, setGoogleCalendarLink] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const patientFullNameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reservationTimerIntervalId = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const quickActionsConfig = [
    { title: "Asistente Personal", subtitle: "Panel de pacientes", icon: User, href: "/my-panel", id: "panel" },
    { title: "Referidos", subtitle: "Nos recomendaste y queremos agradecerte", icon: GiftIcon, href: "#", id: "referidos", isPlaceholder: true },
    { title: "Comunidad", subtitle: "Mostra podologia, mostra tu solucion", icon: Sparkles, href: "#", id: "comunidad", isPlaceholder: true },
  ];

  const showTimer: boolean = !!(selectedSlotForBooking && slotReservationExpiresAt && remainingTime > 0 && (bookingStep === 'awaitingPatientDetails' || bookingStep === 'awaitingBookingReason' || bookingStep === 'awaitingPaymentProof'));

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string, options?: ChatMessage['options'], timestamp?: string, eventId?: string, searchContext?: ChatMessage['searchContext']) => {
    setChatMessages(prev => [...prev, { id: "" + Date.now() + "-" + sender + "-" + Math.random().toString(36).slice(2), sender, text, options, timestamp, eventId, searchContext }]);
  }, []);

  const clearReservationTimer = useCallback(() => {
    if (reservationTimerIntervalId.current) {
      clearInterval(reservationTimerIntervalId.current);
      reservationTimerIntervalId.current = null;
    }
    setSlotReservationExpiresAt(null);
    setRemainingTime(0);
  }, []);

  const resetChatAndBookingStates = useCallback((keepChatHistory: boolean = false) => {
    if (!keepChatHistory) {
      setChatMessages([]);
    }
    setBookingStep('initial');
    setPatientFullName("");
    setSelectedCountry(countryOptions.find(opt => opt.value === DEFAULT_COUNTRY_VALUE) || countryOptions[0]);
    setPatientTelefono("");
    setBookingReason("");
    setPatientDetailsError(null);
    setSelectedSlotForBooking(null);
    setLastOfferedSlotFromFindNext(undefined);
    setLastPreferenceSearchContext(undefined);
    setIsAiLoading(false);
    setFinalBookingMessage(null);
    setCurrentReasonPlaceholder(bookingReasonPlaceholders[0]);
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    setPaymentProofDataUri(null);
    setCurrentPaymentDetails(null);
    setReporterEmail('');
    setProblemMessage('');
    setShowWhatsAppContactButtonForSlotTaken(false);
    setGoogleCalendarLink(null);
    clearReservationTimer();
  }, [clearReservationTimer]);

  const processFlowError = useCallback((error: any, flowName: string) => {
    console.error("Error calling " + flowName + ":", error); // Log technical details for debugging
    const userFriendlyErrorMessage = "Hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo o contacta a soporte por WhatsApp si el problema persiste.";
    addMessageToChat('ai', userFriendlyErrorMessage, [{ label: "Volver al menú principal", action: "goHome" }]);
    toast({ title: "Error en el Sistema", description: "Ocurrió un error. Por favor, intente nuevamente.", variant: "destructive"});
    clearReservationTimer();
  }, [addMessageToChat, toast, clearReservationTimer]);

  const handleFindAppointmentClick = useCallback(async () => {
    resetChatAndBookingStates();
    setBookingViewActive(true);
    setIsAiLoading(true);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 350));
        const conversationStart = await startBookingConversation();
        addMessageToChat('ai', conversationStart.welcomeMessage, conversationStart.initialOptions);
    } catch (error) {
        processFlowError(error, "startBookingConversation (on_find_click)");
    } finally {
        setIsAiLoading(false);
    }
  }, [resetChatAndBookingStates, processFlowError, addMessageToChat]);

  const handleBackToOverviewClick = useCallback(() => {
    setBookingViewActive(false);
    resetChatAndBookingStates();
  }, [resetChatAndBookingStates]);

  const getIconForAction = useCallback((action: string, label: string, metadata?: any): JSX.Element => {
    const lowerLabel = label.toLowerCase();
    if (action === "confirmSlot" || lowerLabel.includes("reservar") || lowerLabel.includes("sí") || lowerLabel.includes("confirmar")) return <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />;
    if (action === "findNext" && lowerLabel.includes("ver siguiente turno (cualquiera)")) return <RotateCcw className="mr-2 h-4 w-4 shrink-0" />;
    if (action === "findNext" || lowerLabel.includes("buscar próximo") || lowerLabel.includes("siguiente turno") || lowerLabel.includes("agendar otro")) return <Search className="mr-2 h-4 w-4 shrink-0" />;
    if (action === "goHome" || lowerLabel.includes("volver al inicio") || lowerLabel.includes("menú principal") || lowerLabel.includes("cancelar y buscar")) return <Home className="mr-2 h-4 w-4 shrink-0" />;
    if (action === "findAlternatives" || lowerLabel.includes("otras opciones")) return <MessageSquareQuote className="mr-2 h-4 w-4 shrink-0" />;
    if (action === "redirectToPanel" || lowerLabel.includes("ir a mi panel")) return <User className="mr-2 h-4 w-4 shrink-0" />;
    if (action === "findByPreference") {
        if (metadata?.actionRequest === 'request_podologist_selection') return <BriefcaseMedical className="mr-2 h-4 w-4 shrink-0" />;
        if (metadata?.selectedPodologistKey && !metadata?.selectedFilterType) {
            if (lowerLabel.includes("cancelar") || lowerLabel.includes("volver a filtros")) return <SlidersHorizontal className="mr-2 h-4 w-4 shrink-0" />;
            return <BriefcaseMedical className="mr-2 h-4 w-4 shrink-0" />;
        }
        if (metadata?.selectedFilterType) return <Clock className="mr-2 h-4 w-4 shrink-0" />;
        return <SlidersHorizontal className="mr-2 h-4 w-4 shrink-0" />;
    }
    if (lowerLabel.includes("podólogo")) return <BriefcaseMedical className="mr-2 h-4 w-4 shrink-0" />;
    if (lowerLabel.includes("cambiar")) return <Replace className="mr-2 h-4 w-4 shrink-0" />;
    if (lowerLabel.includes("tiempo")) return <Clock className="mr-2 h-4 w-4 shrink-0" />;
    return <ChevronRightIcon className="mr-2 h-4 w-4 shrink-0" />;
  }, []);

  const handleReturnToSlotSelection = useCallback(async () => {
    addMessageToChat('user', 'Quiero elegir un turno diferente.');
    setSelectedSlotForBooking(null);
    setPatientFullName("");
    setSelectedCountry(countryOptions.find(opt => opt.value === DEFAULT_COUNTRY_VALUE) || countryOptions[0]);
    setPatientTelefono("");
    setPatientDetailsError(null);
    setBookingStep('initial');
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    setPaymentProofDataUri(null);
    setCurrentPaymentDetails(null);
    setIsAiLoading(true);
    clearReservationTimer();
    setGoogleCalendarLink(null);
    setLastOfferedSlotFromFindNext(undefined);
    setLastPreferenceSearchContext(undefined);
    setShowWhatsAppContactButtonForSlotTaken(false);
    setTimeout(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
    try {
        const conversationStart = await startBookingConversation();
        addMessageToChat('ai', "De acuerdo. ¿Cómo te gustaría buscar un turno ahora?", conversationStart.initialOptions);
    } catch (error) {
        processFlowError(error, "startBookingConversation (on_back)");
    } finally {
        setIsAiLoading(false);
    }
  }, [addMessageToChat, processFlowError, clearReservationTimer]);

  const handleChatOptionClick = useCallback(async (action: string, label: string, metadata?: any) => {
    addMessageToChat('user', label);
    setChatMessages(prev => prev.map(msg => msg.sender === 'ai' ? { ...msg, options: undefined } : msg));

    if (action !== "redirectToPanel") {
      setIsAiLoading(true);
    } else {
      setBookingStep('initial');
      setSelectedSlotForBooking(null);
      clearReservationTimer();
      setGoogleCalendarLink(null);
      setPatientFullName("");
      setSelectedCountry(countryOptions.find(opt => opt.value === DEFAULT_COUNTRY_VALUE) || countryOptions[0]);
      setPatientTelefono("");
    }

    if (action !== "confirmSlot" && action !== "redirectToPanel") {
        clearReservationTimer();
        setGoogleCalendarLink(null);
    }
    setShowWhatsAppContactButtonForSlotTaken(false);

    try {
      if (action === "redirectToPanel") {
        router.push('/my-panel');
        return;
      } else if (action === "findNext") {
        let findNextInput: FindNextAvailableSlotInput = {};
        if (metadata?.podologistKey) {
          findNextInput.podologistKey = metadata.podologistKey;
        }
        if (metadata?.previousSlotTimestamp) {
            findNextInput.previousSlotTimestamp = metadata.previousSlotTimestamp;
            findNextInput.podologistKey = 'any';
        }
        setLastPreferenceSearchContext(undefined);
        const result = await findNextAvailableSlot(findNextInput);
        if (result.suggestedSlotTimestamp && result.podologistInfo) {
            setLastOfferedSlotFromFindNext({ timestamp: result.suggestedSlotTimestamp, podologistKey: result.podologistInfo.key });
        } else {
            setLastOfferedSlotFromFindNext(undefined);
        }
        addMessageToChat('ai', result.message, result.options, result.suggestedSlotTimestamp, result.eventId, {key: result.podologistInfo?.key, name: result.podologistInfo?.name});
      } else if (action === "findByPreference") {
        let inputForFlow: FindSlotsByPreferenceInput;
        if (metadata && Object.keys(metadata).length > 0) {
          inputForFlow = { ...metadata };
          if (!metadata.previousSlotTimestamp) {
              inputForFlow.previousSlotTimestamp = undefined;
          }
        } else {
          inputForFlow = {};
        }
        setLastOfferedSlotFromFindNext(undefined);
        const result = await findSlotsByPreference(inputForFlow);
        if (result.appliedPodologistInfo) {
          setLastPreferenceSearchContext({
            key: result.appliedPodologistInfo.key,
            name: result.appliedPodologistInfo.name,
            filterType: result.appliedFilterType,
            previousSlotTimestamp: result.suggestedSlot ? result.suggestedSlot.timestamp : undefined,
          });
        } else {
           setLastPreferenceSearchContext(undefined);
        }
        addMessageToChat('ai', result.message, result.options, result.suggestedSlot?.timestamp, result.suggestedSlot?.eventId, result.appliedPodologistInfo);
      } else if (action === "confirmSlot") {
        if (metadata?.slotId && metadata?.slotTimestamp && metadata?.podologistKey && metadata?.podologistName && metadata?.podologistCalendarId) {
            setSelectedSlotForBooking({
                eventIdGCalOriginal: metadata.slotId,
                timestamp: metadata.slotTimestamp,
                podologistKey: metadata.podologistKey,
                podologistName: metadata.podologistName,
                podologistCalendarId: metadata.podologistCalendarId,
            });
            setSlotReservationExpiresAt(Date.now() + RESERVATION_TIMEOUT_MS);
            setBookingStep('awaitingPatientDetails');
            addMessageToChat('ai', '¡Excelente! Para confirmar tu turno, necesito algunos datos.');
        } else {
            processFlowError(new Error("Faltan metadatos para confirmar el turno."), "confirmSlot");
        }
      } else if (action === "findAlternatives") {
         let findNextInput: FindNextAvailableSlotInput = {};
         if (metadata?.podologistKey) {
             findNextInput.podologistKey = metadata.podologistKey;
         }
         if (metadata?.previousSlotTimestamp) {
             findNextInput.previousSlotTimestamp = metadata.previousSlotTimestamp;
         }
         const result = await findNextAvailableSlot(findNextInput);
         if (result.suggestedSlotTimestamp && result.podologistInfo) {
             setLastOfferedSlotFromFindNext({ timestamp: result.suggestedSlotTimestamp, podologistKey: result.podologistInfo.key });
         } else {
             setLastOfferedSlotFromFindNext(findNextInput.previousSlotTimestamp && findNextInput.podologistKey ? {timestamp: findNextInput.previousSlotTimestamp, podologistKey: findNextInput.podologistKey} : undefined);
         }
         addMessageToChat('ai', result.message, result.options, result.suggestedSlotTimestamp, result.eventId, {key: result.podologistInfo?.key, name: result.podologistInfo?.name});
      } else if (action === "goHome") {
        resetChatAndBookingStates();
        const result = await startBookingConversation();
        addMessageToChat('ai', result.welcomeMessage, result.initialOptions);
      } else if (action === "openCalendarLink") {
        if (metadata?.url && typeof window !== 'undefined') {
          window.open(metadata.url, '_blank');
          addMessageToChat('ai', "Se intentó abrir el evento en tu calendario. Si no funcionó, puedes añadirlo manually. ¿Necesitas algo más?", [
            { label: "Agendar otro turno", action: "goHome" },
            { label: "Volver al inicio", action: "goHome" }
          ]);
        }
      } else {
        processFlowError(new Error('Acción desconocida: ' + action), "chat option processing");
      }
    } catch (err: any) {
      processFlowError(err, 'chat option ' + action);
    } finally {
      if (action !== "redirectToPanel") {
        setIsAiLoading(false);
      }
    }
  }, [addMessageToChat, processFlowError, router, resetChatAndBookingStates, clearReservationTimer]);

  const handlePatientDetailsSubmit = useCallback(async () => {
    if (!patientFullName.trim() || !patientTelefono.trim() || !selectedSlotForBooking) {
      setPatientDetailsError("Por favor, completa Nombre y Apellido, y Teléfono.");
      return;
    }
    const nationalNumberClean = patientTelefono.replace(/\D/g, '');
    if (nationalNumberClean.length !== selectedCountry.maxLength) {
      setPatientDetailsError('El número de teléfono para ' + selectedCountry.label.split(' (')[0].trim() + ' debe tener ' + selectedCountry.maxLength + ' dígitos.');
      return;
    }
    setPatientDetailsError(null);
    setIsAiLoading(true);
    addMessageToChat('user', 'Mis datos: ' + patientFullName + ', Tel: ' + selectedCountry.value + (selectedCountry.needsMobileNine && nationalNumberClean.length === 10 && !nationalNumberClean.startsWith("9") ? '9' : '') + nationalNumberClean + '.');
    let e164PhoneNumber = selectedCountry.value;
    if (selectedCountry.needsMobileNine && nationalNumberClean.length === 10 && !nationalNumberClean.startsWith("9")) {
        e164PhoneNumber += '9' + nationalNumberClean;
    } else {
        e164PhoneNumber += nationalNumberClean;
    }

    try {
      const userExistsResult = await checkIfUserExistsByPhone({ phoneNumber: e164PhoneNumber });

      if (userExistsResult.exists) {
        addMessageToChat('ai', `¡Hola de nuevo, ${userExistsResult.firstName || 'Paciente'}! Vemos que ya tienes una cuenta. Continuemos con tu reserva.`);
      } else {
        addMessageToChat('ai', 'Gracias por tus datos.');
      }
      
      addMessageToChat('ai', 'Si tienes algún motivo específico para tu visita, puedes indicarlo ahora (opcional). Sino, presiona "Continuar" para ver los datos para la reserva del turno.');
      setBookingStep('awaitingBookingReason');

    } catch (error) {
      processFlowError(error, "checkIfUserExistsByPhone");
      // Fallback to continue flow even if check fails
      addMessageToChat('ai', 'Gracias (hubo un problema verificando tu cuenta, continuemos). Si tienes algún motivo específico para tu visita, puedes indicarlo ahora (opcional). Sino, presiona "Continuar" para ver los datos para la reserva del turno.');
      setBookingStep('awaitingBookingReason');
    } finally {
      setIsAiLoading(false);
    }
  }, [addMessageToChat, patientFullName, patientTelefono, selectedSlotForBooking, selectedCountry, processFlowError]);

  const handleProceedToPayment = useCallback(async () => {
    setIsAiLoading(true);
    if (bookingReason.trim()) {
        addMessageToChat('user', 'Motivo de la visita: ' + bookingReason);
    } else {
        addMessageToChat('user', 'Sin motivo específico para la visita (continuando a reserva).');
    }
    if (!selectedSlotForBooking) {
      processFlowError(new Error("No hay información del turno seleccionado para proceder al pago."), "handleProceedToPayment");
      setFinalBookingMessage("Error: No se seleccionó un turno. Por favor, intenta de nuevo.");
      setBookingStep('bookingError');
      setIsAiLoading(false);
      return;
    }
    const paymentInfo = getPaymentDetailsForPodologist(selectedSlotForBooking.podologistKey);
    if (!paymentInfo) {
      processFlowError(new Error('Detalles de pago no encontrados para podólogo ' + selectedSlotForBooking.podologistKey), "handleProceedToPayment");
      addMessageToChat('ai', 'Lo siento, no pudimos encontrar la información de pago para ' + selectedSlotForBooking.podologistName + '. Por favor, contacta a Cecilia.');
      setBookingStep('bookingError');
      setFinalBookingMessage('Error: Detalles de pago no encontrados para ' + selectedSlotForBooking.podologistName + '.');
      setIsAiLoading(false);
      return;
    }
    setCurrentPaymentDetails(paymentInfo);
    const paymentMessage = 'Para completar la reserva de tu turno por $' + PAYMENT_AMOUNT_ARS.toLocaleString('es-AR') + ' ARS, por favor realiza el pago utilizando los detalles que se muestran a continuación y luego sube el comprobante.';
    addMessageToChat('ai', paymentMessage);
    setBookingStep('awaitingPaymentProof');
    setIsAiLoading(false);
  }, [addMessageToChat, bookingReason, selectedSlotForBooking, processFlowError]);

  const handlePaymentProofFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Increased limit check
        toast({ title: "Archivo Demasiado Grande", description: "El comprobante no debe exceder los 10MB.", variant: "destructive"});
        setPaymentProofFile(null);
        setPaymentProofPreview(null);
        setPaymentProofDataUri(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setPaymentProofFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaymentProofPreview(reader.result as string);
          setPaymentProofDataUri(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        setPaymentProofPreview(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaymentProofDataUri(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: "Archivo no Soportado", description: "Por favor, sube una imagen (JPG, PNG, WEBP) o un PDF.", variant: "destructive"});
        setPaymentProofFile(null);
        setPaymentProofPreview(null);
        setPaymentProofDataUri(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else {
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setPaymentProofDataUri(null);
    }
  };

  const handlePaymentProofSubmit = useCallback(async () => {
    if (!paymentProofFile || !paymentProofDataUri) {
      toast({ title: "Falta Comprobante", description: "Por favor, sube el comprobante de pago.", variant: "destructive"});
      return;
    }
    setIsAiLoading(true);
    addMessageToChat('user', 'Comprobante de pago subido: ' + paymentProofFile.name);
    addMessageToChat('ai', "Gracias por subir el comprobante. Estamos verificando los datos y procesando tu reserva...");
    setShowWhatsAppContactButtonForSlotTaken(false);
    setGoogleCalendarLink(null);
    if (!selectedSlotForBooking) {
      processFlowError(new Error("No hay información del turno seleccionado para confirmar."), "handlePaymentProofSubmit_NoSlotInfo");
      setFinalBookingMessage("Error crítico: No se seleccionó un turno para procesar el pago. Por favor, intenta de nuevo desde el inicio.");
      setBookingStep('bookingError');
      setIsAiLoading(false);
      clearReservationTimer();
      return;
    }
    const nameParts = patientFullName.trim().split(/\s+/);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ") || undefined;
    const nationalNumberForCreate = patientTelefono.replace(/\D/g, '');
    let finalNationalNumberForCreate = nationalNumberForCreate;
    if (selectedCountry.value === "+54" && nationalNumberForCreate.length === 10 && !nationalNumberForCreate.startsWith("9")) {
        finalNationalNumberForCreate = '9' + nationalNumberForCreate;
    }
    const countryCodeOnly = selectedCountry.value.replace('+', '');
    try {
        const appointmentInput: VerifyPaymentAndCreateAppointmentInput = {
            slotTimestamp: selectedSlotForBooking.timestamp,
            slotEventId: selectedSlotForBooking.eventIdGCalOriginal,
            patientFirstName: firstName,
            patientLastName: lastName,
            phoneCountryCode: countryCodeOnly,
            phoneNumber: finalNationalNumberForCreate,
            podologistKey: selectedSlotForBooking.podologistKey,
            podologistName: selectedSlotForBooking.podologistName,
            podologistCalendarId: selectedSlotForBooking.podologistCalendarId,
            bookingReason: bookingReason.trim() || undefined,
            paymentProofDataUri: paymentProofDataUri,
        };
        const result = await verifyPaymentAndCreateAppointment(appointmentInput);
        
        if (result?.success) {
            clearReservationTimer();
            let finalMsg = result.personalizedMessage || result.message;
            if (finalMsg && finalMsg.includes("inconveniente al guardar los detalles completos en nuestro sistema de respaldo")) {
                const firestoreErrorMatch = result.debugInfo?.match(/🔴 ERROR CRÍTICO guardando cita en Firestore: ([^\\n]+)/);
                if (firestoreErrorMatch && firestoreErrorMatch[1]) {
                    const firestoreErrorMessage = firestoreErrorMatch[1].split('Objeto de error completo:')[0].trim();
                    if (firestoreErrorMessage) {
                        finalMsg += '\\n\\n(Detalle técnico del problema de guardado: ' + firestoreErrorMessage + ')';
                    }
                }
            }
            setFinalBookingMessage(finalMsg);
            setBookingStep('bookingConfirmed');
            if (result.createdEventLink) {
              setGoogleCalendarLink(result.createdEventLink);
            }
        } else {
            const defaultErrorMessage = "No pudimos confirmar tu reserva. Intenta de nuevo o contacta a Cecilia.";
            const message = result?.message || defaultErrorMessage;
            
            const isSlotTakenContactCeciliaError = message.includes("Cecilia lo gestionará manually");
            if (isSlotTakenContactCeciliaError) {
                setFinalBookingMessage(message);
                setBookingStep('bookingError');
                setShowWhatsAppContactButtonForSlotTaken(true);
            } else {
              const isVerificationError = message.toLowerCase().includes("verificación") ||
                                          message.toLowerCase().includes("comprobante") ||
                                          message.toLowerCase().includes("monto") ||
                                          message.toLowerCase().includes("fecha") ||
                                          message.toLowerCase().includes("destinatario") ||
                                          message.toLowerCase().includes("no pudimos leer");
              if (isVerificationError) {
                  let userMessage = message;
                  if (userMessage.includes("porque la fecha del comprobante") && (userMessage.includes("no es válida para esta reserva") || userMessage.includes("no es reciente (debe ser de hoy o ayer)"))) {
                    userMessage = "La verificación de tu comprobante de pago falló porque la fecha del comprobante no es válida para esta reserva.";
                  } else if (userMessage.includes("porque el monto transferido") && (userMessage.includes("no es el esperado para la reserva") || userMessage.includes("no coincide con el esperado"))) {
                    userMessage = "La verificación de tu comprobante de pago falló porque el monto transferido no es el esperado para la reserva.";
                  } else if (userMessage.includes("porque el destinatario del pago en el comprobante no es el correcto")) {
                    userMessage = "La verificación de tu comprobante de pago falló porque el destinatario del pago en el comprobante no es el correcto.";
                  }
                  addMessageToChat('ai', userMessage + '. Puedes verificar los datos y volver a subir el comprobante, o contactar a Cecilia si el problema persiste.');
                  setPaymentProofFile(null);
                  setPaymentProofPreview(null);
                  setPaymentProofDataUri(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setBookingStep('awaitingPaymentProof');
                  if (remainingTime <=0 && slotReservationExpiresAt) {
                       addMessageToChat('ai', "El tiempo para esta reserva ha expirado mientras se verificaba. Por favor, comienza de nuevo.");
                       resetChatAndBookingStates(true);
                  }
              } else {
                  clearReservationTimer();
                  setGoogleCalendarLink(null);
                  setFinalBookingMessage(result?.personalizedMessage || message);
                  setBookingStep('bookingError');
              }
            }
        }
    } catch (error: any) {
        clearReservationTimer();
        setGoogleCalendarLink(null);
        if (error.message && error.message.toLowerCase().includes('body exceeded')) {
            const friendlyError = "El archivo del comprobante es demasiado grande. Por favor, intenta con una imagen más pequeña (máx. 10MB). Puedes intentar nuevamente subir el comprobante.";
            addMessageToChat('ai', friendlyError);
            setPaymentProofFile(null);
            setPaymentProofPreview(null);
            setPaymentProofDataUri(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setBookingStep('awaitingPaymentProof');
        } else {
            processFlowError(error, "verifyPaymentAndCreateAppointment");
            setFinalBookingMessage("Ocurrió un error inesperado al intentar crear tu turno. Por favor, contacta a Cecilia.");
            setBookingStep('bookingError');
        }
    } finally {
        setIsAiLoading(false);
    }
  }, [addMessageToChat, paymentProofFile, paymentProofDataUri, selectedSlotForBooking, patientFullName, patientTelefono, selectedCountry, bookingReason, processFlowError, toast, clearReservationTimer, resetChatAndBookingStates, remainingTime, slotReservationExpiresAt]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('user-auth-token=')) : null;
    setIsLoggedIn(!!token);
    const timer = setTimeout(() => setInitialLoading(false), 750);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, bookingStep]);

  useEffect(() => {
    if (bookingStep === 'awaitingPatientDetails' && patientFullNameInputRef.current) {
      setTimeout(() => {
        patientFullNameInputRef.current?.focus();
        patientFullNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [bookingStep]);

  useEffect(() => {
    if (bookingStep === 'awaitingBookingReason' || bookingStep === 'awaitingPaymentProof') {
      const intervalId = setInterval(() => {
        setCurrentReasonPlaceholder(prev => {
          const currentIndex = bookingReasonPlaceholders.indexOf(prev);
          const nextIndex = (currentIndex + 1) % bookingReasonPlaceholders.length;
          return bookingReasonPlaceholders[nextIndex];
        });
      }, 3500);
      return () => clearInterval(intervalId);
    }
  }, [bookingStep]);

  useEffect(() => {
    if (bookingStep === 'awaitingPaymentProof' && selectedSlotForBooking) {
      const details = getPaymentDetailsForPodologist(selectedSlotForBooking.podologistKey);
      if (details) {
        setCurrentPaymentDetails(details);
      } else {
        setCurrentPaymentDetails(null);
        console.error("Payment details not found for podologist key:", selectedSlotForBooking.podologistKey);
        addMessageToChat('ai', 'Lo siento, no pudimos encontrar la información de pago para ' + selectedSlotForBooking.podologistName + '. Por favor, contacta a Cecilia.', [{ label: "Volver al inicio", action: "goHome" }]);
        setBookingStep('bookingError');
        setFinalBookingMessage('Error: Detalles de pago no encontrados para ' + selectedSlotForBooking.podologistName + '.');
      }
    }
  }, [bookingStep, selectedSlotForBooking, addMessageToChat]);

  useEffect(() => {
    if (slotReservationExpiresAt && (bookingStep === 'awaitingPatientDetails' || bookingStep === 'awaitingBookingReason' || bookingStep === 'awaitingPaymentProof')) {
      if (reservationTimerIntervalId.current) clearInterval(reservationTimerIntervalId.current);
      reservationTimerIntervalId.current = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.round((slotReservationExpiresAt - now) / 1000));
        setRemainingTime(timeLeft);
        if (timeLeft === 0) {
          clearReservationTimer();
          setGoogleCalendarLink(null);
          if (bookingStep === 'awaitingPatientDetails' || bookingStep === 'awaitingBookingReason' || bookingStep === 'awaitingPaymentProof') {
            addMessageToChat('ai', "El tiempo para completar la reserva de este turno ha expirado. Por favor, selecciona un turno nuevamente.");
            resetChatAndBookingStates(true);
            setShowWhatsAppContactButtonForSlotTaken(false);
            setTimeout(async () => {
              try {
                  const result = await startBookingConversation();
                  addMessageToChat('ai', "Puedes buscar otro turno ahora.", result.initialOptions);
              } catch (error) {
                  processFlowError(error, "startBookingConversation (timer_expired)");
              }
            }, 500);
          }
        }
      }, 1000);
    } else {
      clearReservationTimer();
    }
    return () => {
      if (reservationTimerIntervalId.current) {
        clearInterval(reservationTimerIntervalId.current);
      }
    };
  }, [slotReservationExpiresAt, bookingStep, addMessageToChat, clearReservationTimer, resetChatAndBookingStates, processFlowError]);

 useEffect(() => {
    if (finalBookingMessage) {
      const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
      let shouldAddAiMessage = true;
      if (lastMessage && lastMessage.sender === 'ai' && finalBookingMessage && lastMessage.text.startsWith(finalBookingMessage.substring(0, 50))) {
        shouldAddAiMessage = false;
      }
      if (shouldAddAiMessage) {
        let optionsForAi: ChatMessage['options'] = [
            { label: "Agendar otro turno", action: "goHome" },
            { label: "Volver al inicio", action: "goHome" }
        ];
        if (bookingStep === 'bookingConfirmed' && googleCalendarLink) {
            optionsForAi = [
                { label: "Agendar otro turno", action: "goHome" },
                { label: "Añadir a mi Calendario", action: "openCalendarLink", metadata: { url: googleCalendarLink } },
                { label: "Volver al inicio", action: "goHome" }
            ];
        } else if (bookingStep === 'bookingError' && showWhatsAppContactButtonForSlotTaken) {
            optionsForAi = [
                { label: "Volver al inicio e intentar de nuevo", action: "goHome" },
            ];
        }
        addMessageToChat('ai', finalBookingMessage, optionsForAi);
      }
    }
  }, [bookingStep, finalBookingMessage, showWhatsAppContactButtonForSlotTaken, googleCalendarLink, addMessageToChat, chatMessages]);

  const handleWhatsAppContact = (): void => {
    if (!selectedSlotForBooking) return;
    const nationalNumberClean = patientTelefono.replace(/\D/g, '');
    const fullPhoneNumber = selectedCountry.value + (selectedCountry.needsMobileNine && nationalNumberClean.length === 10 && !nationalNumberClean.startsWith("9") ? '9' : '') + nationalNumberClean;
    const originalSlotDate = new Date(selectedSlotForBooking.timestamp);
    const formattedOriginalSlotTime = originalSlotDate.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) + ' hs';
    let textoPredefinido = 'Hola Cecilia, intenté reservar un turno pero ya no estaba disponible. Para que lo agendes manualmente, mis datos son:\n';
    textoPredefinido += 'Nombre: ' + (patientFullName || "No especificado") + '\n';
    textoPredefinido += 'Tel: ' + fullPhoneNumber + '\n';
    textoPredefinido += 'Turno deseado: con ' + selectedSlotForBooking.podologistName + ' el ' + formattedOriginalSlotTime + '.\n';
    if (paymentProofFile) {
      textoPredefinido += 'Ya había subido un comprobante para esta reserva. Te lo puedo reenviar aquí si es necesario.';
    } else {
      textoPredefinido += 'Aún no había subido el comprobante.';
    }
    const whatsappUrl = 'https://wa.me/' + CECILIA_WHATSAPP_NUMBER_RAW + '?text=' + encodeURIComponent(textoPredefinido);
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, '_blank');
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= selectedCountry.maxLength) {
        setPatientTelefono(numericValue);
    } else {
        setPatientTelefono(numericValue.slice(0, selectedCountry.maxLength));
    }
    if (patientDetailsError) setPatientDetailsError(null);
  };

  const handleCountryChange = (value: string): void => {
    const country = countryOptions.find(opt => opt.value === value) || countryOptions[0];
    setSelectedCountry(country);
    setPatientTelefono('');
    if (patientDetailsError) setPatientDetailsError(null);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return "" + minutes.toString().padStart(2, '0') + ":" + secs.toString().padStart(2, '0');
  };

  const handleRemoveProofFile = (): void => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    setPaymentProofDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = async (textToCopy: string, fieldName: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({ title: "Copiado", description: fieldName + " copiado al portapapeles." });
    } catch (err) {
      toast({ title: "Error al Copiar", description: "No se pudo copiar " + fieldName + ". Intenta manually.", variant: "destructive" });
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReportProblemSubmit = (): void => {
    if (!problemMessage.trim()) {
      toast({
        title: "Mensaje Vacío",
        description: "Por favor, describe el problema.",
        variant: "destructive",
      });
      return;
    }
    const subject = encodeURIComponent('Reporte de Problema - Asistente Virtual Podopalermo');
    let body = 'Descripción del problema:\n' + problemMessage + '\n\n';
    if (reporterEmail.trim()) {
      body += 'Email del reportante: ' + reporterEmail + '\n';
    }
    if (selectedSlotForBooking) {
      body += '\nDetalles del turno relacionado (si aplica):\n';
      body += 'Podólogo: ' + selectedSlotForBooking.podologistName + '\n';
      body += 'Fecha y Hora: ' + new Date(selectedSlotForBooking.timestamp).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) + '\n';
      body += 'ID Evento Original: ' + selectedSlotForBooking.eventIdGCalOriginal + '\n';
    }
    if (patientFullName) {
        body += 'Nombre Paciente (ingresado): ' + patientFullName + '\n';
    }
    if (patientTelefono) {
        const countryCodeVal = selectedCountry.value;
        body += 'Teléfono Paciente (ingresado): ' + countryCodeVal + ' ' + patientTelefono + '\n';
    }
    body = encodeURIComponent(body);
    const mailtoLink = 'mailto:podopalermo@gmail.com?subject=' + subject + '&body=' + body;
    try {
      if (typeof window !== "undefined") {
        window.location.href = mailtoLink;
      }
      toast({
        title: "Abriendo cliente de correo...",
        description: "Se intentará abrir tu aplicación de correo para enviar el reporte.",
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "No se pudo abrir automáticamente tu cliente de correo. Por favor, envía un email a podopalermo@gmail.com.",
        variant: "destructive",
      });
    }
    setIsReportProblemDialogOpen(false);
    setProblemMessage('');
    setReporterEmail('');
  };

  return (
    <div className="flex flex-col items-center w-full">
       <div className={cn(
          "w-full max-w-4xl flex flex-col transition-all duration-300 ease-in-out",
          bookingViewActive ? "flex-grow" : ""
        )}
      >
        {initialLoading ? (
          <div className="flex flex-col flex-grow items-center justify-center p-4">
            <LoadingSpinner size={48} />
            <p className="mt-4 text-muted-foreground">Cargando Podopalermo...</p>
          </div>
        ) : (
          <div className={cn("flex flex-col flex-grow transition-opacity duration-500 ease-in-out", initialLoading ? "opacity-0" : "opacity-100")}>
            <div className={cn("transition-opacity duration-300 ease-in-out", bookingViewActive ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100')}>
              <Card
                className={cn(
                  "w-full shadow-xl rounded-xl mb-6 overflow-hidden bg-transparent relative aspect-[4/3] sm:aspect-video",
                  "animate-shimmer"
                )}
              >
                <Image
                  src="/images/hermoso-arbol.jpg"
                  alt="Bienvenida a Podopalermo"
                  layout="fill"
                  objectFit="cover"
                  priority
                  data-ai-hint="nature tree"
                  className="z-0"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/5 z-[1] bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none"></div>

                <div className={cn(
                  "absolute inset-x-0 bottom-0 z-[2] p-4 pb-5 sm:p-6 sm:pb-7", 
                  "flex flex-col items-center text-center space-y-2", 
                  "sm:flex-row sm:items-end sm:justify-between sm:text-left sm:space-y-0" 
                )}>
                  <div className="sm:max-w-[calc(100%-150px)]">
                    <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                      Encontrar turno disponible
                    </h1>
                    <p className="text-gray-200 text-xs sm:text-sm mt-1 max-w-xs sm:max-w-sm">
                      En menos de 5 minutos con podólogos expertos.
                    </p>
                  </div>
                  <Button
                    size="sm" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full max-w-[180px] sm:w-auto mt-3 sm:mt-0 flex-shrink-0 text-xs sm:text-sm"
                    onClick={handleFindAppointmentClick}
                  >
                    Buscar Turno <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </Card>
            </div>

            <div className={cn(
                "transition-opacity duration-300 ease-in-out flex flex-col flex-grow",
                bookingViewActive ? 'opacity-100' : 'opacity-0 pointer-events-none h-0'
            )}>
                <Card className="bg-background rounded-xl flex flex-col flex-grow">
                    <CardHeader className="p-3 sm:p-4 border-b border-border">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                          <div className="flex items-center flex-wrap gap-x-2 min-w-0">
                            <CardTitle className="text-sm sm:text-base font-bold text-foreground truncate">Asistente de Turnos</CardTitle>
                            <div className="flex items-center gap-1 whitespace-nowrap">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-muted-foreground">En línea</span>
                            </div>
                          </div>
                        </div>
                        <div
                            className={cn(
                              "flex items-center text-[11px] sm:text-xs font-medium transition-opacity duration-300 ease-in-out text-primary whitespace-nowrap",
                              showTimer ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                            aria-hidden={!showTimer}
                          >
                            <TimerIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                             Turno reservado por: <span className="font-semibold ml-1">{formatTime(remainingTime > 0 ? remainingTime : 0)}</span>
                          </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 flex-grow flex flex-col min-h-0">
                        {isAiLoading && chatMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
                            <LoadingDots />
                            <p className="mt-2">Iniciando asistente...</p>
                          </div>
                        ) : (
                            <div ref={chatContainerRef} className="space-y-3 flex-1 overflow-y-auto pr-2 pb-2 -mr-2">
                            {chatMessages.map((msg) => (
                              <div key={msg.id} className={"flex " + (msg.sender === 'ai' ? 'justify-start' : 'justify-end') + " animate-in fade-in-0 duration-300"}>
                                <div className={"p-2 sm:p-2.5 rounded-lg max-w-[85%] sm:max-w-[80%] md:max-w-[75%] shadow-sm " + ( msg.sender === 'ai' ? 'bg-muted/50 border border-border/70 text-foreground rounded-bl-none' : 'bg-primary text-primary-foreground rounded-br-none' )}>
                                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                  {msg.sender === 'ai' && msg.options && msg.options.length > 0 && bookingStep === 'initial' && (
                                    <div className="mt-3 space-y-2">
                                      {msg.options.map(opt => (
                                        <Button key={"" + opt.action + "-" + opt.label + "-" + JSON.stringify(opt.metadata || {})} variant="outline" size="sm" className="w-full justify-start text-left h-auto py-1.5 px-1.5 sm:px-2 text-xs border-border text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/60 focus:bg-primary/10 focus:text-primary focus:ring-1 focus:ring-primary/50" onClick={() => handleChatOptionClick(opt.action, opt.label, opt.metadata)} disabled={isAiLoading} >
                                          {getIconForAction(opt.action, opt.label, opt.metadata)} {opt.label}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              )
                            )}
                            {isAiLoading && chatMessages.length > 0 && (bookingStep === 'initial' || bookingStep === 'awaitingBookingReason' || bookingStep === 'awaitingPaymentProof' || bookingStep === 'bookingConfirmed' || bookingStep === 'bookingError') && (
                              <div className="flex justify-start pt-3 animate-in fade-in-0 duration-300"> <div className={"p-2 sm:p-2.5 rounded-lg max-w-[90%] shadow-sm bg-muted/50 border border-border/70 text-foreground rounded-bl-none"}> <LoadingDots /> </div> </div>
                            )}
                            </div>
                        )}

                        {bookingStep === 'awaitingPatientDetails' && (
                        <div className={cn("space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-border mt-auto animate-in fade-in-50 slide-in-from-bottom-3 duration-500 ease-out relative", isAiLoading && "opacity-60 transition-opacity duration-300 backdrop-blur-xs")}>
                            {isAiLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-card/20 z-10 rounded-md">
                                <LoadingSpinner size={32} />
                            </div>
                            )}
                            {patientDetailsError && ( <Alert variant="destructive" className="mb-3"> <AlertTriangleIcon className="h-4 w-4" /> <ShadAlertDescription>{patientDetailsError}</ShadAlertDescription> </Alert> )}
                            <div>
                            <Label htmlFor="patientFullName" className="text-xs font-medium text-muted-foreground">Nombre y Apellido *</Label>
                            <ShadInput
                                ref={patientFullNameInputRef}
                                id="patientFullName"
                                type="text"
                                placeholder="Nombre completo"
                                value={patientFullName}
                                onChange={(e) => { setPatientFullName(e.target.value); if(patientDetailsError) setPatientDetailsError(null); }}
                                className="mt-1"
                                required
                                disabled={isAiLoading}
                            />
                            </div>
                            <div>
                                <Label htmlFor="phoneNumberInputPage" className="text-xs font-medium text-muted-foreground">Número de Teléfono *</Label>
                                <div className="flex items-center mt-1">
                                    <Select value={selectedCountry.value} onValueChange={handleCountryChange} disabled={isAiLoading}>
                                        <SelectTrigger className="w-auto min-w-[90px] rounded-r-none border-r-0 h-10 text-xs sm:text-sm">
                                            <SelectValue>
                                                <span className="flex items-center">
                                                    {selectedCountry.label.split(' ')[0]} {selectedCountry.value}
                                                </span>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countryOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                                                    <span className="flex items-center">{opt.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <ShadInput
                                        id="phoneNumberInputPage" type="tel"
                                        placeholder={selectedCountry.placeholder}
                                        value={patientTelefono}
                                        onChange={handlePhoneNumberChange}
                                        required
                                        className="rounded-l-none flex-1 h-10 text-xs sm:text-sm"
                                        maxLength={selectedCountry.maxLength}
                                        disabled={isAiLoading}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
                                <Button
                                variant="outline"
                                onClick={handleReturnToSlotSelection}
                                disabled={isAiLoading}
                                className="border-muted text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors w-full sm:w-auto text-xs sm:text-sm"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" /> Volver a elegir
                                </Button>
                                <Button
                                onClick={handlePatientDetailsSubmit}
                                disabled={isAiLoading || !patientFullName.trim() || !patientTelefono.trim()}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto sm:min-w-[140px] text-xs sm:text-sm"
                                aria-label="Continuar"
                                >
                                    {isAiLoading ? (
                                    <> <LoadingSpinner size={16} className="mr-2" /> Verificando... </>
                                    ) : (
                                    <> Continuar <Send className="ml-2 h-4 w-4" /> </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        )}

                        {bookingStep === 'awaitingBookingReason' && (
                            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-border mt-auto animate-in fade-in-50 slide-in-from-bottom-3 duration-500 ease-out">
                                <div>
                                    <Label htmlFor="bookingReason" className="text-xs font-medium text-muted-foreground">Motivo de la visita (opcional)</Label>
                                    <Textarea
                                    id="bookingReason"
                                    placeholder={currentReasonPlaceholder}
                                    value={bookingReason}
                                    onChange={(e) => { if (e.target.value.length <= MAX_REASON_LENGTH) setBookingReason(e.target.value);}}
                                    className="flex-grow resize-none mt-1 text-xs sm:text-sm"
                                    rows={2}
                                    maxLength={MAX_REASON_LENGTH}
                                    />
                                    <p className="text-xs text-muted-foreground text-right pr-1 mt-1"> {"" + (MAX_REASON_LENGTH - bookingReason.length) + " / " + MAX_REASON_LENGTH} </p>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleProceedToPayment} disabled={isAiLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm" aria-label="Continuar a la reserva">
                                    {isAiLoading ? <LoadingDots/> : "Continuar a la reserva"} <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {bookingStep === 'awaitingPaymentProof' && currentPaymentDetails && (
                        <div className={cn("space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-border mt-auto animate-in fade-in-50 slide-in-from-bottom-3 duration-500 ease-out relative", isAiLoading && "opacity-60 transition-opacity duration-300 backdrop-blur-xs")}>
                            {isAiLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-card/20 z-10 rounded-md">
                                <LoadingSpinner size={32} />
                            </div>
                            )}
                            <Card className="bg-muted/30 border-primary/20 p-3 sm:p-4 shadow-sm">
                            <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-sm sm:text-base font-semibold text-primary">Reserva de Turno: $ {PAYMENT_AMOUNT_ARS.toLocaleString('es-AR')}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 text-xs sm:text-sm text-foreground space-y-1">
                                <p><strong>Titular:</strong> {currentPaymentDetails.accountHolderName}</p>
                                <p><strong>Entidad:</strong> {currentPaymentDetails.bankName}</p>
                                {currentPaymentDetails.cbu && (
                                <div className="flex items-center">
                                    <span><strong>CBU:</strong> {currentPaymentDetails.cbu}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-muted-foreground hover:text-primary" onClick={() => copyToClipboard(currentPaymentDetails.cbu!, 'CBU')}><Copy size={14}/></Button>
                                </div>
                                )}
                                {currentPaymentDetails.cvu && (
                                <div className="flex items-center">
                                    <span><strong>CVU:</strong> {currentPaymentDetails.cvu}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-muted-foreground hover:text-primary" onClick={() => copyToClipboard(currentPaymentDetails.cvu!, 'CVU')}><Copy size={14}/></Button>
                                </div>
                                )}
                                <div className="flex items-center">
                                    <span><strong>Alias:</strong> {currentPaymentDetails.alias}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-muted-foreground hover:text-primary" onClick={() => copyToClipboard(currentPaymentDetails.alias!, 'Alias')}><Copy size={14}/></Button>
                                </div>
                                {currentPaymentDetails.cuilCuit && <p><strong>CUIT/CUIL:</strong> {currentPaymentDetails.cuilCuit}</p>}
                                {currentPaymentDetails.accountNumber && <p><strong>Nro. Cuenta:</strong> {currentPaymentDetails.accountNumber}</p>}
                            </CardContent>
                            </Card>
                            <div>
                            <Label htmlFor="paymentProofUpload" className="text-xs font-medium text-muted-foreground">Adjuntar Comprobante (imagen o PDF, máx 10MB) *</Label>
                            <ShadInput
                                ref={fileInputRef}
                                id="paymentProofUpload"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handlePaymentProofFileChange}
                                className="mt-1 file:mr-2 file:py-1.5 file:px-2 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-xs sm:text-sm"
                                disabled={isAiLoading}
                            />
                            </div>
                            {paymentProofPreview && (
                            <div className="mt-2 p-2 border border-border rounded-md space-y-2">
                                {paymentProofFile?.type.startsWith("image/") ? (
                                <Image src={paymentProofPreview} alt="Previsualización del comprobante" width={150} height={150} className="rounded-md object-contain max-h-[150px] mx-auto" data-ai-hint="payment proof"/>
                                ) : (
                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                    <FileText className="h-5 w-5 mr-2 text-primary" />
                                    <span>{paymentProofPreview}</span>
                                </div>
                                )}
                                <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveProofFile}
                                className="w-full text-xs text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10"
                                disabled={isAiLoading}
                                >
                                <XIcon className="mr-1.5 h-3.5 w-3.5" />
                                Quitar comprobante
                                </Button>
                            </div>
                            )}
                            <div className="flex justify-end items-center">
                                <Button
                                onClick={handlePaymentProofSubmit}
                                disabled={isAiLoading || !paymentProofFile}
                                className={cn(
                                    "bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm",
                                    "transform transition-all duration-200 ease-in-out hover:brightness-110 active:scale-95 active:brightness-90"
                                )}
                                aria-label="Enviar Comprobante y Confirmar"
                                >
                                    {isAiLoading ? <LoadingDots/> : "Enviar Comprobante y Confirmar"} <UploadCloud className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        )}

                        {(bookingStep === 'bookingConfirmed' || bookingStep === 'bookingError') && (
                            <div className="pt-4 border-t border-border mt-auto animate-in fade-in-0 duration-300 text-center flex flex-col items-center">
                                {bookingStep === 'bookingConfirmed' ? (
                                    <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-2 sm:mb-3" />
                                ) : (
                                    <AlertTriangleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mx-auto mb-2 sm:mb-3" />
                                )}
                                <p className={cn("text-base sm:text-lg font-semibold mb-1", bookingStep === 'bookingConfirmed' ? 'text-foreground': 'text-destructive')}>
                                    {bookingStep === 'bookingConfirmed' ? "Reserva Confirmada" : "Error en la Reserva"}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line mb-3 sm:mb-4 px-2 sm:px-4">
                                    {finalBookingMessage ?
                                        (bookingStep === 'bookingConfirmed' ? "¡Perfecto! Revisa los detalles de tu turno en el chat." : (finalBookingMessage.includes("Cecilia lo gestionará manually") ? finalBookingMessage : "Hubo un problema. Revisa el mensaje en el chat para más detalles."))
                                        : (bookingStep === 'bookingConfirmed' ? "Tu reserva ha sido procesada. Revisa el chat para los detalles completos." : "No pudimos completar tu reserva. Por favor, revisa los mensajes o intenta de nuevo.")
                                    }
                                </p>
                                <div className="mt-2 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 w-full max-w-xs mx-auto">
                                    {bookingStep === 'bookingConfirmed' && googleCalendarLink && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleChatOptionClick("openCalendarLink", "Añadir a mi Calendario", { url: googleCalendarLink })}
                                        className={cn(
                                        "w-full border-primary/70 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-xs sm:text-sm",
                                        "focus-visible:ring-primary/50"
                                        )}
                                        aria-label="Añadir a mi Calendario"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Añadir a mi Calendario
                                    </Button>
                                    )}
                                    {showWhatsAppContactButtonForSlotTaken && (
                                    <Button
                                        onClick={handleWhatsAppContact}
                                        className="bg-green-500 hover:bg-green-600 text-white w-full text-xs sm:text-sm"
                                        aria-label="Contactar a Cecilia por WhatsApp"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><path d="M16.65 13.45C16.65 13.45 16.66 13.44 16.66 13.44C16.66 13.44 16.65 13.45 16.65 13.45M16.65 13.45L16.65 13.45C16.65 13.45 16.65 13.45 16.65 13.45A5.23 5.23 0 0 0 12 10.88C10.03 10.88 8.35 12.56 8.35 14.53C8.35 16.5 10.03 18.18 12 18.18C12.47 18.18 12.92 18.09 13.33 17.93L14.15 18.75L14.97 17.93C15.99 16.91 16.65 15.23 16.65 13.45Z" clipPath="url(#a)"></path></svg>
                                        Contactar a Cecilia por WhatsApp
                                    </Button>
                                    )}
                                    <Button onClick={() => handleChatOptionClick("goHome", "Agendar otro turno")} className="bg-primary hover:bg-primary/90 w-full text-xs sm:text-sm">Agendar otro turno</Button>
                                    <Button variant="outline" onClick={() => handleChatOptionClick("goHome", "Volver al inicio")} className="w-full text-xs sm:text-sm">Volver al inicio</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="mt-auto p-3 sm:p-4 pt-2 sm:pt-3 border-t border-border">
                        <Button variant="outline" onClick={handleBackToOverviewClick} className="border-muted text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors text-xs sm:text-sm" disabled={isAiLoading && (bookingStep !== 'initial' && bookingStep !== 'bookingConfirmed' && bookingStep !== 'bookingError')} > <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className={cn(
                "transition-all duration-300 ease-in-out",
                bookingViewActive ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'
              )}>
              <>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground px-4 pb-3 pt-5">Acciones Rápidas</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 sm:gap-4 p-4">
                  {quickActionsConfig.map((action) => (
                    <Link
                      href={action.href}
                      key={action.id}
                      onClick={action.isPlaceholder ? (e) => { e.preventDefault(); toast({ title: action.title, description: "Esta función estará disponible próximamente.", duration: 3000});} : undefined}
                      className={cn(
                        "flex flex-1 gap-2 sm:gap-3 rounded-xl p-4 sm:p-6 items-center transition-all cursor-pointer shadow-md min-h-[100px] sm:min-h-[120px]",
                        "bg-card border border-border hover:bg-muted hover:border-primary/30 hover:shadow-lg text-foreground",
                        action.isPlaceholder && "opacity-70"
                      )}
                    >
                      <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      <div className="flex flex-col items-start text-left">
                          <h3 className="text-sm sm:text-base font-bold leading-tight">{action.title}</h3>
                          {action.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
               <Dialog open={isReportProblemDialogOpen} onOpenChange={setIsReportProblemDialogOpen}>
                <DialogContent className="w-[90vw] max-w-md sm:max-w-[480px] rounded-lg p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Reportar un Problema</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Si encontraste un error o algo no funciona como esperabas, por favor detállalo aquí. Tu feedback nos ayuda a mejorar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="reporterEmail" className="text-left text-xs">
                        Tu Email (Opcional)
                      </Label>
                      <ShadInput
                        id="reporterEmail"
                        type="email"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                        placeholder="tuemail@ejemplo.com"
                        className="w-full text-xs sm:text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="problemMessage" className="text-left text-xs">
                        Descripción del Problema*
                      </Label>
                      <Textarea
                        id="problemMessage"
                        value={problemMessage}
                        onChange={(e) => setProblemMessage(e.target.value)}
                        placeholder="Describe el problema que encontraste..."
                        className="w-full min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm"
                        required
                      />
                    </div>
                     <p className="text-xs text-muted-foreground col-span-full px-1">
                      Al enviar, se abrirá tu cliente de correo con esta información pre-cargada.
                    </p>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">Cancelar</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleReportProblemSubmit} disabled={!problemMessage.trim()} className="w-full sm:w-auto text-xs sm:text-sm">
                      Enviar Reporte por Email
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
               <div className="px-4 py-6 text-center">
                   <Button variant="link" className="text-xs text-muted-foreground hover:text-primary" onClick={() => setIsReportProblemDialogOpen(true)}>
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Reportar un problema con el asistente
                  </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
