'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Crown
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { PatientProfile } from '@/lib/firestore-schema';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientsQuery = query(
        collection(db, 'patients'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(patientsQuery);
      const patientsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastVisit: doc.data().lastVisit?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as PatientProfile[];
      
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phoneNumber?.includes(searchTerm) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'vip') return matchesSearch && (patient.loyaltyTier === 'VIP' || patient.loyaltyTier === 'PLATINUM');
    if (selectedFilter === 'new') return matchesSearch && patient.loyaltyTier === 'NEW';
    if (selectedFilter === 'active') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return matchesSearch && patient.lastVisit >= sixMonthsAgo;
    }
    
    return matchesSearch;
  });

  const getLoyaltyBadge = (tier: string) => {
    const colors = {
      NEW: 'bg-gray-100 text-gray-800',
      REGULAR: 'bg-blue-100 text-blue-800',
      VIP: 'bg-purple-100 text-purple-800',
      PLATINUM: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={colors[tier as keyof typeof colors] || colors.NEW}>
        {tier === 'PLATINUM' && <Crown className="h-3 w-3 mr-1" />}
        {tier}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando pacientes...</p>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Gestión de Pacientes
            </h1>
            <p className="text-gray-600 mt-1">
              Administra la información de todos los pacientes
            </p>
          </div>
          
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Paciente</span>
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
              >
                Todos ({patients.length})
              </Button>
              <Button
                variant={selectedFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('active')}
              >
                Activos
              </Button>
              <Button
                variant={selectedFilter === 'vip' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('vip')}
              >
                VIP/Platinum
              </Button>
              <Button
                variant={selectedFilter === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('new')}
              >
                Nuevos
              </Button>
            </div>
          </div>
        </Card>

        {/* Patients Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lealtad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turnos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Visita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {patient.name?.charAt(0).toUpperCase() || 'P'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.phoneNumber && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {patient.phoneNumber}
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {patient.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLoyaltyBadge(patient.loyaltyTier || 'NEW')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.totalAppointments || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {patient.lastVisit?.toLocaleDateString('es-AR') || 'Nunca'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pacientes</p>
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{patients.length}</div>
            <p className="text-sm text-gray-600">Total Pacientes</p>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {patients.filter(p => {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return p.lastVisit >= sixMonthsAgo;
              }).length}
            </div>
            <p className="text-sm text-gray-600">Activos (6 meses)</p>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {patients.filter(p => p.loyaltyTier === 'VIP' || p.loyaltyTier === 'PLATINUM').length}
            </div>
            <p className="text-sm text-gray-600">VIP/Platinum</p>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {patients.filter(p => {
                const thisMonth = new Date();
                thisMonth.setDate(1);
                return p.createdAt >= thisMonth;
              }).length}
            </div>
            <p className="text-sm text-gray-600">Nuevos este mes</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}