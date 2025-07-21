'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

import {
  AlertTriangle as AlertTriangleIcon,
  RefreshCw,
  Star,
  Phone,
  CalendarClock,
  User,
  Users,
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
  Crown,
  Stethoscope
} from 'lucide-react';

import type { AdvancedDashboardKPIs, AdvancedPatientProfile, SpotlightPatient } from '@/lib/advanced-analytics-service';

// Componentes de skeleton
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

function PatientListSkeleton() {
  return (
    <div className="space-y-2 mt-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-muted/50">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-24 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

const getInitials = (name: string) => {
  if (!name || name === "Paciente Desconocido") return <User size={18}/>;
  const parts = name.split(' ');
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return `${first}${last}`.toUpperCase();
};

const getStatusBadgeInfo = (status: AdvancedPatientProfile['status']): { 
  variant: 'outline' | 'default' | 'secondary' | 'destructive', 
  description: string 
} => {
  switch (status) {
    case 'Frecuente': return { variant: 'default', description: 'Paciente muy leal con 5 o más citas en los últimos 12 meses.' };
    case 'Activo': return { variant: 'secondary', description: 'Paciente recurrente con una cita en los últimos 4 meses.' };
    case 'Nuevo': return { variant: 'outline', description: 'Paciente con una única cita registrada. Aún no ha regresado.' };
    case 'En Riesgo': return { variant: 'destructive', description: 'Última cita hace 4-9 meses. En riesgo de volverse inactivo.' };
    case 'Inactivo': return { variant: 'secondary', description: 'No ha tenido una cita en más de 9 meses.' };
    default: return { variant: 'secondary', description: 'Estado no determinado.' };
  }
};

export default function AdvancedAdminPage() {
  const { toast } = useToast();

  // Estado
  const [analyticsData, setAnalyticsData] = useState<AdvancedDashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros de pacientes
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [openAccordionId, setOpenAccordionId] = useState<string | undefined>(undefined);

  const allPatients = useMemo(() => analyticsData?.patients || [], [analyticsData]);

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
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/advanced');
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setError(error.message || "No se pudo conectar con el servicio.");
      setAnalyticsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefreshAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    toast({ 
      title: "Actualizando Analíticas...", 
      description: "Este proceso puede tardar unos minutos." 
    });
    
    try {
      const response = await fetch('/api/analytics/advanced', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Actualización Exitosa", 
          description: "Los datos han sido actualizados correctamente." 
        });
        await fetchAnalytics();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setError(error.message || "Error de conexión.");
      toast({ 
        title: "Error al Actualizar", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast, fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  const formatLastUpdated = (isoDate: string | null) => 
    isoDate ? formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: es }) : "nunca";

  const emptyStateMessages: Record<string, string> = {
    all: 'No hay pacientes que coincidan con los filtros seleccionados.',
    frequent: 'No se encontraron pacientes en la categoría "Frecuentes" con los filtros actuales.',
    new: 'No se encontraron pacientes en la categoría "Nuevos" con los filtros actuales.'
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart2 className="h-8 w-8 mr-3 text-blue-600" />
                Panel de Valor Estratégico
              </h1>
              <p className="text-gray-600 mt-1">Cargando analíticas avanzadas...</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({length: 8}).map((_, i) => <KpiCardSkeleton key={i}/>)}
          </div>
          
          <ChartSkeleton />
        </div>
      </AdminLayout>
    );
  }

  return (
    <TooltipProvider>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart2 className="h-8 w-8 mr-3 text-blue-600" />
                Panel de Valor Estratégico
              </h1>
              <p className="text-gray-600 mt-1">
                Actualizado {formatLastUpdated(analyticsData?.lastUpdated || null)}.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshAnalytics} 
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", (isRefreshing || isLoading) && "animate-spin")} />
              {isRefreshing ? 'Actualizando...' : (isLoading ? 'Cargando...' : 'Actualizar Ahora')}
            </Button>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : analyticsData && (
            <>
              {/* KPIs Principales */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card>
                      <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.kpis.totalActivePatients}</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pacientes únicos con al menos una cita en los últimos 9 meses. Excluye a los inactivos.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card>
                      <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Nuevos (Este Mes)</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground"/>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.kpis.newPatientsThisMonth}</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pacientes cuya primera cita registrada ocurrió en el mes calendario actual.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card>
                      <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">En Riesgo</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground"/>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{analyticsData.kpis.atRiskPatients}</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pacientes activos cuya última cita fue hace más de 4 meses, pero menos de 9. Son un objetivo clave para reactivar.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card>
                      <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Tiempo de Retorno</CardTitle>
                        <Repeat1 className="h-4 w-4 text-muted-foreground"/>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analyticsData.kpis.averageReturnTimeDays} 
                          <span className="text-lg font-medium text-muted-foreground ml-1">días</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Promedio de días que transcurren entre citas para pacientes con más de una visita. Un número bajo indica alta lealtad.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* KPIs Secundarios */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card>
                      <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Retención 2ª Cita</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground"/>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.kpis.secondAppointmentRetentionRate}%</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje de pacientes nuevos (de hace 60-90 días) que agendaron una segunda cita. Mide la calidad de la primera experiencia.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card>
                      <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Frecuencia Anual</CardTitle>
                        <Repeat className="h-4 w-4 text-muted-foreground"/>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.kpis.visitFrequencyPerYear}</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Promedio de citas que un paciente activo tiene en un período de 12 meses. Indica la regularidad del cuidado.</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card>
                      <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Tasa de Abandono (Trim.)</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground"/>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{analyticsData.kpis.quarterlyChurnRate}%</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Porcentaje de pacientes que estaban activos y pasaron a 'Inactivos' (9+ meses sin citas) en el último trimestre.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Gráfico de Tendencias */}
              {analyticsData.monthlyChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adquisición y Recurrencia</CardTitle>
                    <CardDescription>Citas de pacientes nuevos vs. recurrentes en los últimos 6 meses.</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer>
                        <BarChart data={analyticsData.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#888888" fontSize={12}/>
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                          <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                          <Legend />
                          <Bar dataKey="newPatients" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} name="Nuevos" />
                          <Bar dataKey="recurringPatients" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Recurrentes" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pacientes Destacados */}
              {analyticsData.spotlightPatients.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyticsData.spotlightPatients.map((patient) => (
                    <Card 
                      key={patient.id}
                      onClick={() => handleSpotlightClick(patient.id)} 
                      className={cn(
                        "cursor-pointer hover:shadow-lg transition-shadow text-white",
                        patient.type === 'loyal' ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-gradient-to-r from-green-600 to-teal-600"
                      )}
                    >
                      <CardHeader className="flex-row items-start gap-4">
                        {patient.type === 'loyal' ? (
                          <Award className="h-8 w-8 text-amber-300 mt-1" />
                        ) : (
                          <PartyPopper className="h-8 w-8 text-sky-300 mt-1" />
                        )}
                        <div>
                          <CardDescription className="text-white/80">
                            {patient.type === 'loyal' ? 'Premio Corazón de la Práctica' : 'Nuevo Miembro de la Familia'}
                          </CardDescription>
                          <CardTitle className="text-xl">{patient.displayName}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{patient.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Base de Datos de Pacientes */}
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
                      <Input 
                        placeholder="Buscar por nombre..." 
                        className="w-full pl-10" 
                        value={searchTerm} 
                        onChange={handleSearchChange} 
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 items-center justify-center">
                      {ALPHABET.map(letter => (
                        <Button 
                          key={letter} 
                          variant={selectedLetter === letter ? 'default' : 'outline'} 
                          size="icon" 
                          className="h-8 w-8 text-xs" 
                          onClick={() => handleLetterFilter(letter)}
                        >
                          {letter}
                        </Button>
                      ))}
                      {selectedLetter && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => setSelectedLetter(null)}
                        >
                          <UserX className="h-4 w-4"/>
                        </Button>
                      )}
                    </div>
                  </div>
                
                  <div className="mt-4">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <UserX size={40} className="mx-auto mb-3"/>
                        <p className="font-semibold">No se encontraron pacientes</p>
                        <p className="text-sm mt-1">{emptyStateMessages[activeTab]}</p>
                      </div>
                    ) : (
                      <Accordion 
                        type="single" 
                        collapsible 
                        className="w-full" 
                        onValueChange={setOpenAccordionId} 
                        value={openAccordionId}
                      >
                        <AnimatePresence>
                          {filteredPatients.map((patient, index) => {
                            const statusInfo = getStatusBadgeInfo(patient.status);
                            return (
                              <motion.div 
                                key={patient.id} 
                                layout 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0 }} 
                                transition={{ duration: 0.3, delay: index * 0.03 }}
                              >
                                <AccordionItem 
                                  value={patient.id} 
                                  id={`patient-card-${patient.id}`} 
                                  className="border-b-0 mb-2"
                                >
                                  <Card className="border-border/60 hover:border-primary/50 transition-colors duration-200">
                                    <AccordionTrigger className="p-4 w-full hover:no-underline rounded-lg">
                                      <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-4 text-left">
                                          <Avatar>
                                            <AvatarFallback>{getInitials(patient.displayName)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{patient.displayName}</p>
                                            <p className="text-sm text-muted-foreground sm:hidden mt-1">
                                              {patient.totalAppointments} Cita{patient.totalAppointments !== 1 && 's'}
                                            </p>
                                            {patient.primaryPhoneNumber && (
                                              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                                                {patient.primaryPhoneNumber}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Badge variant={statusInfo.variant}>{patient.status}</Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{statusInfo.description}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Badge variant="secondary" className="font-normal cursor-default">
                                                <Star className="h-3 w-3 mr-1" />
                                                {patient.totalAppointments}
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Total de citas registradas</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                      <Separator className="mb-4" />
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="font-medium mb-2">Información del Paciente</p>
                                          <div className="space-y-1 text-muted-foreground">
                                            <p>📞 {patient.primaryPhoneNumber || 'No disponible'}</p>
                                            <p>📅 Primera cita: {patient.firstAppointmentDate ? format(parseISO(patient.firstAppointmentDate), 'dd/MM/yyyy', { locale: es }) : 'No disponible'}</p>
                                            <p>🕒 Última cita: {patient.lastVisit ? format(patient.lastVisit, 'dd/MM/yyyy', { locale: es }) : 'No disponible'}</p>
                                            {patient.nextAppointmentDate && (
                                              <p>⏭️ Próxima cita: {format(parseISO(patient.nextAppointmentDate), 'dd/MM/yyyy', { locale: es })}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <p className="font-medium mb-2">Estadísticas</p>
                                          <div className="space-y-1 text-muted-foreground">
                                            <p>📊 Estado: <Badge variant={statusInfo.variant} className="ml-1">{patient.status}</Badge></p>
                                            <p>🎯 Total de citas: {patient.totalAppointments}</p>
                                            <p>💎 Nivel de lealtad: {patient.loyaltyTier || 'NEW'}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </Card>
                                </AccordionItem>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </Accordion>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </AdminLayout>
    </TooltipProvider>
  );
}