'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Heart,
  RefreshCw,
  BarChart3,
  Clock
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import KPICard from '@/components/admin/KPICard';
import ChartsSection from '@/components/admin/ChartsSection';
import TopTables from '@/components/admin/TopTables';
import DebugDataViewer from '@/components/admin/DebugDataViewer';
import { DashboardKPIs } from '@/lib/analytics-service';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadKPIs = async (forceRefresh = false) => {
    try {
      setLoading(!forceRefresh);
      setRefreshing(forceRefresh);
      
      const endpoint = forceRefresh ? 'POST' : 'GET';
      const response = await fetch('/api/analytics/dashboard', {
        method: endpoint
      });
      
      const data = await response.json();
      
      if (data.success) {
        setKpis(data.data);
        if (forceRefresh) {
          toast({
            title: "KPIs Actualizados",
            description: "Los datos han sido actualizados exitosamente.",
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error loading KPIs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los KPIs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadKPIs();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando KPIs de PODOPALERMO...</p>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!kpis) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">No se pudieron cargar los KPIs</p>
            <Button onClick={() => loadKPIs()}>
              Reintentar
            </Button>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
          {/* Header del Dashboard */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Dashboard PODOPALERMO
              </h1>
              <p className="text-gray-600 mt-1">
                Panel de control y KPIs en tiempo real
              </p>
            </div>
            
            <Button
              onClick={() => loadKPIs(true)}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Actualizando...' : 'Actualizar KPIs'}</span>
            </Button>
          </div>

          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Pacientes"
              value={kpis.totalPatients}
              subtitle={`${kpis.activePatients} activos`}
              icon={Users}
              color="blue"
              trend={{
                value: kpis.growthRate,
                isPositive: kpis.growthRate > 0
              }}
            />
            
            <KPICard
              title="Total Turnos"
              value={kpis.totalAppointments}
              subtitle={`${kpis.averageAppointmentsPerPatient} promedio por paciente`}
              icon={Calendar}
              color="green"
            />
            
            <KPICard
              title="Pacientes Nuevos"
              value={kpis.newPatientsThisMonth}
              subtitle="Este mes"
              icon={TrendingUp}
              color="purple"
            />
            
            <KPICard
              title="Tasa de Retención"
              value={`${kpis.retentionRate}%`}
              subtitle="Pacientes que regresan"
              icon={Heart}
              color="orange"
            />
          </div>

          {/* Gráficos */}
          <ChartsSection kpis={kpis} />

          {/* Tablas de Top Performers */}
          <TopTables kpis={kpis} />

          {/* Resumen Ejecutivo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              📈 Resumen Ejecutivo
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {kpis.totalPatients > 0 ? Math.round((kpis.loyaltyDistribution.VIP + kpis.loyaltyDistribution.PLATINUM) / kpis.totalPatients * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">Pacientes VIP/Platinum</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {kpis.peakHours && kpis.peakHours.length > 0 ? kpis.peakHours[0]?.label || 'N/A' : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Horario más demandado</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {kpis.peakDays && kpis.peakDays.length > 0 ? kpis.peakDays[0]?.label || 'N/A' : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Día más activo</p>
              </div>
            </div>
          </Card>

        {/* Footer con timestamp */}
        <div className="text-center text-sm text-gray-500">
          <Clock className="inline h-4 w-4 mr-1" />
          Última actualización: {new Date().toLocaleString('es-AR')}
        </div>
        
        {/* Debug Data Viewer */}
        <DebugDataViewer data={kpis} title="KPIs PODOPALERMO" />
      </div>
    </AdminLayout>
  );
}