'use client';

import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { DashboardKPIs } from '@/lib/analytics-service';

interface ChartsSectionProps {
  kpis: DashboardKPIs;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const LOYALTY_COLORS = {
  NEW: '#94A3B8',
  REGULAR: '#3B82F6', 
  VIP: '#10B981',
  PLATINUM: '#F59E0B'
};

export default function ChartsSection({ kpis }: ChartsSectionProps) {
  // Datos para gráfico de lealtad
  const loyaltyData = Object.entries(kpis.loyaltyDistribution).map(([tier, count]) => ({
    name: tier,
    value: count,
    percentage: Math.round((count / kpis.totalPatients) * 100)
  }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Gráfico de Tendencias Mensuales */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Tendencias Mensuales
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpis.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="appointments" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Turnos"
              />
              <Line 
                type="monotone" 
                dataKey="newPatients" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Pacientes Nuevos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico de Distribución de Lealtad */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Distribución por Lealtad
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={loyaltyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {loyaltyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={LOYALTY_COLORS[entry.name as keyof typeof LOYALTY_COLORS]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value} pacientes (${loyaltyData.find(d => d.name === name)?.percentage}%)`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Leyenda */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {loyaltyData.map((item) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: LOYALTY_COLORS[item.name as keyof typeof LOYALTY_COLORS] }}
              />
              <span className="text-sm text-gray-600">
                {item.name}: {item.value} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Gráfico de Horarios Pico */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⏰ Horarios Más Demandados
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpis.peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value} turnos`, 'Cantidad']}
              />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico de Días Pico */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📅 Días Más Activos
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpis.peakDays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value} turnos`, 'Cantidad']}
              />
              <Bar 
                dataKey="count" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}