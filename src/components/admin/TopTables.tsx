'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardKPIs } from '@/lib/analytics-service';
import { Crown, User, Stethoscope } from 'lucide-react';

interface TopTablesProps {
  kpis: DashboardKPIs;
}

const loyaltyColors = {
  NEW: 'bg-gray-100 text-gray-800',
  REGULAR: 'bg-blue-100 text-blue-800',
  VIP: 'bg-green-100 text-green-800',
  PLATINUM: 'bg-yellow-100 text-yellow-800'
};

const loyaltyIcons = {
  NEW: '👤',
  REGULAR: '⭐',
  VIP: '💎',
  PLATINUM: '👑'
};

export default function TopTables({ kpis }: TopTablesProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Top Podólogos */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            🏆 Top Podólogos
          </h3>
        </div>
        
        <div className="space-y-4">
          {kpis.topPodologists.map((podologist, index) => (
            <div 
              key={podologist.name}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{podologist.name}</p>
                  <p className="text-sm text-gray-500">
                    {podologist.uniquePatients} pacientes únicos
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {podologist.totalAppointments} turnos
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${podologist.occupancyRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {podologist.occupancyRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Pacientes */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Crown className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            👑 Pacientes Más Frecuentes
          </h3>
        </div>
        
        <div className="space-y-4">
          {kpis.topPatients.slice(0, 5).map((patient, index) => (
            <div 
              key={patient.phone}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-500">
                    {patient.phone}
                  </p>
                  <p className="text-xs text-gray-400">
                    Última visita: {patient.lastVisit instanceof Date ? patient.lastVisit.toLocaleDateString('es-AR') : new Date(patient.lastVisit).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {patient.totalVisits} visitas
                </p>
                <Badge 
                  className={loyaltyColors[patient.loyaltyTier]}
                  variant="secondary"
                >
                  {loyaltyIcons[patient.loyaltyTier]} {patient.loyaltyTier}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}