import KpiCards from "@/components/admin/kpi-cards";
import PatientStatsChart from "@/components/admin/patient-stats-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RecentAppointments from "@/components/admin/recent-appointments";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Panel de Administración</h1>
      <KpiCards />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Resumen de Turnos</CardTitle>
                <CardDescription>Un resumen de turnos y cancelaciones de los últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <PatientStatsChart />
            </CardContent>
        </Card>
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Turnos Recientes</CardTitle>
                <CardDescription>Los últimos turnos agendados de todos los pacientes.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentAppointments />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
