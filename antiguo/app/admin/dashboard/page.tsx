
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, formatDistanceToNow, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';


// Flows & Types
import { getPatientAnalyticsFromCache } from '@/ai/flows/getPatientAnalyticsFromCache';
import { updatePatientAnalyticsCache } from '@/ai/flows/updatePatientAnalyticsCache';
import { getPatientAppointmentDetails, type Appointment } from '@/ai/flows/getPatientAppointmentDetails';
import type { PatientProfile, PatientAnalyticsData } from '@/ai/flows/getPatientAnalytics';


// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription as ShadAlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  LogOut,
  AlertTriangle as AlertTriangleIcon,
  RefreshCw,
  Star,
  Phone,
  CalendarClock,
  User,
  Users,
  ChevronDown,
  UserPlus,
  TrendingDown,
  Activity,
  BarChart2,
  Search,
  Repeat,
  UserX,
  Target,
  Repeat1,
  Award,
  PartyPopper,
} from 'lucide-react';


const getInitials = (name: string) => {
  if (!name || name === "Paciente Desconocido") return <User size={18}/>;
  const parts = name.split(' ');
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return `${first}${last}`.toUpperCase();
};

// --- SKELETON COMPONENTS ---
function KpiCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-7 w-2/5" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-3 w-4/5" />
            </CardContent>
        </Card>
    );
}

function ChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[250px] w-full">
                    <Skeleton className="h-full w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

function DetailSkeleton() { return <div className="space-y-2 mt-2"> <div className="flex items-start gap-3 p-2 rounded-md bg-muted/40"> <Skeleton className="h-4 w-4 mt-0.5 shrink-0 rounded-full"/> <div className="min-w-0 space-y-1.5 flex-1"> <Skeleton className="h-4 w-3/4" /> <Skeleton className="h-3 w-1/2" /> </div> </div> <div className="flex items-start gap-3 p-2 rounded-md bg-muted/40"> <Skeleton className="h-4 w-4 mt-0.5 shrink-0 rounded-full"/> <div className="min-w-0 space-y-1.5 flex-1"> <Skeleton className="h-4 w-full" /> <Skeleton className="h-3 w-1/3" /> </div> </div> </div>; }
function PatientListSkeleton() { return <div className="space-y-2 mt-4"> {Array.from({ length: 5 }).map((_, i) => ( <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-muted/50"> <Skeleton className="h-10 w-10 rounded-full" /> <div className="flex-1 space-y-1.5"> <Skeleton className="h-4 w-3/4" /> <Skeleton className="h-3 w-1/2" /> </div> <Skeleton className="h-6 w-24 hidden sm:block" /> </div> ))} </div>; }
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<PatientAnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isRefreshingAnalytics, setIsRefreshingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsLastUpdated, setAnalyticsLastUpdated] = useState<string | null>(null);
  
  // Patient list and filtering state
  const allPatients = useMemo(() => analyticsData?.patients || [], [analyticsData]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [openAccordionId, setOpenAccordionId] = useState<string | undefined>(undefined);

  const [detailedHistories, setDetailedHistories] = useState<Record<string, Appointment[]>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState<Record<string, boolean>>({});

  const filteredPatients = useMemo(() => {
    let patients = allPatients;

    if (activeTab !== 'all') {
      const statusToFilter = activeTab === 'frequent' ? 'Frecuente' : 'Nuevo';
      patients = allPatients.filter(p => p.status === statusToFilter);
    }

    if (searchTerm) {
      patients = patients.filter(p => p.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (selectedLetter) {
      patients = patients.filter(p => p.displayName.toUpperCase().startsWith(selectedLetter));
    }
    
    return patients;
  }, [allPatients, activeTab, searchTerm, selectedLetter]);


  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const result = await getPatientAnalyticsFromCache();
      if (result.error && !result.analytics?.patients?.length) {
        setAnalyticsError(result.error);
        setAnalyticsData(null);
      } else {
        setAnalyticsData(result.analytics as PatientAnalyticsData);
        setAnalyticsLastUpdated(result.lastUpdated);
      }
    } catch (error: any) {
      setAnalyticsError(error.message || "No se pudo conectar con el servicio.");
      setAnalyticsData(null);
    } finally {
      setIsLoadingAnalytics(false);
      setInitialLoading(false);
    }
  }, []);

  const handleRefreshAnalytics = useCallback(async () => {
    setIsRefreshingAnalytics(true);
    toast({ title: "Actualizando Analíticas...", description: "Este proceso puede tardar unos minutos. La página se refrescará sola." });
    try {
      const result = await updatePatientAnalyticsCache();
      if (result && result.success) {
        toast({ title: "Actualización Exitosa", description: result.message });
        await fetchAnalytics();
      } else {
        const errorMessage = result?.error || "Ocurrió un error desconocido durante la actualización.";
        setAnalyticsError(errorMessage);
        toast({ title: "Error al Actualizar", description: errorMessage, variant: "destructive" });
      }
    } catch (error: any) {
      setAnalyticsError(error.message || "Error de conexión.");
      toast({ title: "Error Crítico", description: error.message, variant: "destructive" });
    } finally {
      setIsRefreshingAnalytics(false);
    }
  }, [toast, fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  
  const handleAccordionChange = useCallback(async (patientId: string | undefined) => {
    setOpenAccordionId(patientId);
    if (!patientId) return;
  
    if (!detailedHistories[patientId] && !isLoadingDetails[patientId]) {
      setIsLoadingDetails(prev => ({ ...prev, [patientId]: true }));
      try {
        const result = await getPatientAppointmentDetails({ patientId: patientId });
        if (result.error) {
          const patientName = allPatients.find(p => p.id === patientId)?.displayName || 'este paciente';
          toast({ title: "Error", description: `No se pudo cargar el historial de ${patientName}.`, variant: "destructive" });
          setDetailedHistories(prev => ({ ...prev, [patientId]: [] }));
        } else {
          setDetailedHistories(prev => ({ ...prev, [patientId]: result.appointments }));
        }
      } catch (error: any) { 
        const patientName = allPatients.find(p => p.id === patientId)?.displayName || 'este paciente';
        toast({ title: "Error", description: `No se pudo cargar el historial de ${patientName}.`, variant: "destructive" }); 
      }
      finally { setIsLoadingDetails(prev => ({ ...prev, [patientId]: false })); }
    }
  }, [allPatients, detailedHistories, isLoadingDetails, toast]);
  
  const mostLoyalPatient = useMemo(() => {
    if (!allPatients || allPatients.length === 0) return null;
    return allPatients.reduce((prev, current) => (prev.totalAppointments > current.totalAppointments) ? prev : current);
  }, [allPatients]);

  const newestPatient = useMemo(() => {
      if (!allPatients || allPatients.length === 0) return null;
      const newPatients = allPatients.filter(p => p.status === 'Nuevo' && p.firstAppointmentDate);
      if (newPatients.length === 0) return null;
      return newPatients.sort((a, b) => parseISO(b.firstAppointmentDate!).getTime() - parseISO(a.firstAppointmentDate!).getTime())[0];
  }, [allPatients]);
  
  const handleSpotlightClick = (patientId: string) => {
    const element = document.getElementById(`patient-card-${patientId}`);
    if (element) {
      setOpenAccordionId(patientId);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'transition-shadow', 'duration-300');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2500);
    }
  };


  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    router.replace('/admin/login');
  }, [router]);

  const formatAppointmentDateFull = (isoDate: string) => format(parseISO(isoDate), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm 'hs'", { locale: es });
  const formatLastUpdated = (isoDate: string | null) => isoDate ? formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: es }) : "nunca";
  
  const getStatusBadgeInfo = (status: PatientProfile['status']): { variant: 'outline' | 'default' | 'secondary' | 'destructive', description: string } => {
    switch (status) {
        case 'Frecuente': return { variant: 'default', description: 'Paciente muy leal con 5 o más citas en los últimos 12 meses.' };
        case 'Activo': return { variant: 'secondary', description: 'Paciente recurrente con una cita en los últimos 4 meses.' };
        case 'Nuevo': return { variant: 'outline', description: 'Paciente con una única cita registrada. Aún no ha regresado.' };
        case 'En Riesgo': return { variant: 'destructive', description: 'Última cita hace 4-9 meses. En riesgo de volverse inactivo.' };
        case 'Inactivo': return { variant: 'secondary', description: 'No ha tenido una cita en más de 9 meses.' };
        default: return { variant: 'secondary', description: 'Estado no determinado.' };
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSelectedLetter(null);
  };
  
  const handleLetterFilter = (letter: string) => {
    setSearchTerm('');
    setSelectedLetter(letter === selectedLetter ? null : letter);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
    setSelectedLetter(null);
  };

  const emptyStateMessages: Record<string, string> = {
    all: 'No hay pacientes que coincidan con los filtros seleccionados.',
    frequent: 'No se encontraron pacientes en la categoría "Frecuentes" con los filtros actuales.',
    new: 'No se encontraron pacientes en la categoría "Nuevos" con los filtros actuales.'
  };

  if (initialLoading) { return <div className="flex min-h-screen items-center justify-center bg-background"><LoadingSpinner size={48} /></div>; }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-muted/30">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><BarChart2 />Panel de Valor Estratégico</h1>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? <LoadingSpinner size={16} className="mr-2" /> : <LogOut size={16} className="mr-2" />}
              {isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}
            </Button>
          </div>
        </header>

        <main className="flex-1 container mx-auto max-w-7xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Pulso del Consultorio</h2>
              <p className="text-sm text-muted-foreground">Actualizado {formatLastUpdated(analyticsLastUpdated)}.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshAnalytics} disabled={isRefreshingAnalytics || isLoadingAnalytics}>
              <RefreshCw className={cn("h-4 w-4 mr-2", (isRefreshingAnalytics || isLoadingAnalytics) && "animate-spin")} />
              {isRefreshingAnalytics ? 'Actualizando...' : (isLoadingAnalytics ? 'Cargando...' : 'Actualizar Ahora')}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLoadingAnalytics ? "loading" : "loaded"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isLoadingAnalytics ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    {Array.from({length: 8}).map((_, i) => <KpiCardSkeleton key={i}/>)}
                </div>
              ) : analyticsError ? (
                 <Alert variant="destructive" className="my-4"><AlertTriangleIcon className="h-4 w-4" /><ShadAlertDescription>{analyticsError}</ShadAlertDescription></Alert>
              ) : analyticsData && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card>
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{analyticsData.kpis?.totalActivePatients ?? 0}</div></CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent><p>Número total de pacientes únicos con al menos una cita en los últimos 9 meses. Excluye a los inactivos.</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Card>
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Nuevos (Este Mes)</CardTitle><UserPlus className="h-4 w-4 text-muted-foreground"/></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{analyticsData.kpis?.newPatientsThisMonth ?? 0}</div></CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent><p>Pacientes cuya primera cita registrada en el sistema ocurrió en el mes calendario actual.</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card>
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm font-medium">En Riesgo</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground"/></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-amber-600">{analyticsData.kpis?.atRiskPatients ?? 0}</div></CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent><p>Pacientes activos cuya última cita fue hace más de 4 meses, pero menos de 9. Son un objetivo clave para reactivar.</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card>
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Tiempo de Retorno</CardTitle><Repeat1 className="h-4 w-4 text-muted-foreground"/></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{analyticsData.kpis?.averageReturnTimeDays ?? 0} <span className="text-lg font-medium text-muted-foreground">días</span></div></CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent><p>Promedio de días que transcurren entre citas para pacientes con más de una visita. Un número bajo indica alta lealtad.</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card>
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Retención 2ª Cita</CardTitle><Target className="h-4 w-4 text-muted-foreground"/></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{analyticsData.kpis?.secondAppointmentRetentionRate ?? 0}%</div></CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent><p>Porcentaje de pacientes nuevos (de hace 60-90 días) que agendaron una segunda cita. Mide la calidad de la primera experiencia.</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card>
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Frecuencia Anual</CardTitle><Repeat className="h-4 w-4 text-muted-foreground"/></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{analyticsData.kpis?.visitFrequencyPerYear ?? 0}</div></CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent><p>Promedio de citas que un paciente activo tiene en un período de 12 meses. Indica la regularidad del cuidado.</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card>
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Tasa de Abandono (Trim.)</CardTitle><UserX className="h-4 w-4 text-muted-foreground"/></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-red-600">{analyticsData.kpis?.quarterlyChurnRate ?? 0}%</div></CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent><p>Porcentaje de pacientes que estaban activos y pasaron a 'Inactivos' (9+ meses sin citas) en el último trimestre.</p></TooltipContent>
                    </Tooltip>
                  </div>
                </>
              )}

              {isLoadingAnalytics ? (
                <ChartSkeleton />
              ) : analyticsData && analyticsData.monthlyChartData.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Adquisición y Recurrencia</CardTitle>
                    <CardDescription>Citas de pacientes nuevos vs. recurrentes en los últimos 6 meses.</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ChartContainer config={{
                      newPatients: { label: "Nuevos", color: "hsl(var(--chart-2))" },
                      recurringPatients: { label: "Recurrentes", color: "hsl(var(--chart-1))" },
                    }} className="h-[250px] w-full">
                       <ResponsiveContainer>
                        <BarChart data={analyticsData.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#888888" fontSize={12}/>
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                            <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="newPatients" stackId="a" fill="var(--color-newPatients)" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="recurringPatients" stackId="a" fill="var(--color-recurringPatients)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                       </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
                
              {analyticsData && (mostLoyalPatient || newestPatient) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mostLoyalPatient && mostLoyalPatient.totalAppointments > 1 && (
                     <Card onClick={() => handleSpotlightClick(mostLoyalPatient.id)} className="cursor-pointer hover:shadow-lg transition-shadow bg-panel-gradient-2 text-white">
                      <CardHeader className="flex-row items-start gap-4">
                        <Award className="h-8 w-8 text-amber-300 mt-1" />
                        <div>
                          <CardDescription className="text-white/80">Premio Corazón de la Práctica</CardDescription>
                          <CardTitle className="text-xl">{mostLoyalPatient.displayName}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Por ser nuestro paciente más leal y consistente, con {mostLoyalPatient.totalAppointments} visitas en el último año. ¡Gracias por tu confianza!</p>
                      </CardContent>
                    </Card>
                  )}
                  {newestPatient && (
                     <Card onClick={() => handleSpotlightClick(newestPatient.id)} className="cursor-pointer hover:shadow-lg transition-shadow bg-panel-gradient-1 text-white">
                      <CardHeader className="flex-row items-start gap-4">
                        <PartyPopper className="h-8 w-8 text-sky-300 mt-1" />
                        <div>
                          <CardDescription className="text-white/80">Nuevo Miembro de la Familia</CardDescription>
                          <CardTitle className="text-xl">{newestPatient.displayName}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Damos una cálida bienvenida a nuestro más reciente paciente. ¡Estamos aquí para cuidar cada uno de tus pasos!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Base de Datos de Pacientes</CardTitle>
                  <CardDescription>Busca un paciente, usa el filtro alfabético o navega por categorías.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="all">Todos ({allPatients.length})</TabsTrigger>
                      <TabsTrigger value="frequent">Frecuentes ({allPatients.filter(p => p.status === 'Frecuente').length})</TabsTrigger>
                      <TabsTrigger value="new">Nuevos ({allPatients.filter(p => p.status === 'Nuevo').length})</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:flex-grow flex items-center">
                       <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <Input placeholder="Buscar por nombre..." className="w-full pl-10" value={searchTerm} onChange={handleSearchChange} />
                    </div>
                    <div className="flex flex-wrap gap-1 items-center justify-center">
                      {ALPHABET.map(letter => (
                        <Button key={letter} variant={selectedLetter === letter ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => handleLetterFilter(letter)}>{letter}</Button>
                      ))}
                      {selectedLetter && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLetter(null)}><UserX className="h-4 w-4"/></Button>}
                    </div>
                  </div>
                
                  <div className="mt-4">
                    {isLoadingAnalytics ? ( <PatientListSkeleton /> ) : 
                    filteredPatients.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <UserX size={40} className="mx-auto mb-3"/>
                        <p className="font-semibold">No se encontraron pacientes</p>
                        <p className="text-sm mt-1">{emptyStateMessages[activeTab]}</p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full" onValueChange={handleAccordionChange} value={openAccordionId}>
                        <AnimatePresence>
                          {filteredPatients.map((patient, index) => {
                            const statusInfo = getStatusBadgeInfo(patient.status);
                            return (
                            <motion.div key={patient.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }}>
                              <AccordionItem value={patient.id} id={`patient-card-${patient.id}`} className="border-b-0 mb-2">
                                <Card className="border-border/60 hover:border-primary/50 transition-colors duration-200">
                                  <AccordionTrigger className="p-4 w-full hover:no-underline rounded-lg">
                                    <div className="flex justify-between items-center w-full">
                                      <div className="flex items-center gap-4 text-left">
                                        <Avatar><AvatarFallback>{getInitials(patient.displayName)}</AvatarFallback></Avatar>
                                        <div className="min-w-0">
                                          <p className="font-semibold text-foreground truncate">{patient.displayName}</p>
                                          <p className="text-sm text-muted-foreground sm:hidden mt-1">{patient.totalAppointments} Cita{patient.totalAppointments !== 1 && 's'}</p>
                                          {patient.primaryPhoneNumber && <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{patient.primaryPhoneNumber}</p>}
                                        </div>
                                      </div>
                                      <div className="hidden sm:flex items-center gap-2">
                                        <Tooltip><TooltipTrigger asChild><Badge variant={statusInfo.variant}>{patient.status}</Badge></TooltipTrigger><TooltipContent><p>{statusInfo.description}</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Badge variant="secondary" className="font-normal cursor-default"><Star className="h-4 w-4 mr-2 text-amber-500" /> {patient.totalAppointments} Cita{patient.totalAppointments !== 1 && 's'}</Badge></TooltipTrigger><TooltipContent><p>Total de citas registradas en los últimos 12 meses.</p></TooltipContent></Tooltip>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="p-4 pt-0">
                                    <div className="border-t border-border pt-4 mt-2 space-y-4">
                                      {patient.primaryPhoneNumber && <div className="flex items-center text-sm text-muted-foreground mb-3"><Phone className="h-4 w-4 mr-2"/>{patient.primaryPhoneNumber}</div>}
                                      <div>
                                        <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center"><CalendarClock className="h-4 w-4 mr-2"/>Historial de Citas (más recientes primero)</h4>
                                        {isLoadingDetails[patient.id] && <DetailSkeleton />}
                                        {!isLoadingDetails[patient.id] && detailedHistories[patient.id] && (
                                          detailedHistories[patient.id]!.length > 0 ? (
                                            <div className="space-y-2 text-sm text-muted-foreground max-h-60 overflow-y-auto pr-2">
                                              {detailedHistories[patient.id]!.map((appt, apptIndex) => (
                                                <div key={`${appt.date}-${apptIndex}`} className="flex items-start gap-3 p-2 rounded-md bg-muted/40">
                                                  <CalendarClock className="h-4 w-4 text-primary/70 mt-0.5 shrink-0"/>
                                                  <div className="min-w-0">
                                                    <p className="font-medium text-foreground/90">{formatAppointmentDateFull(appt.date)}</p>
                                                    <p className="text-xs">con {appt.podologistName}</p>
                                                    <p className="text-xs italic text-muted-foreground/80 mt-1 truncate" title={appt.eventTitle}>Título Original: "{appt.eventTitle}"</p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-muted-foreground italic">No se encontraron eventos de citas para este paciente.</p>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </Card>
                              </AccordionItem>
                            </motion.div>
                          )})}
                        </AnimatePresence>
                      </Accordion>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </TooltipProvider>
  );
}
