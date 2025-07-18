import KpiCards from "@/components/admin/kpi-cards";
import PatientStatsChart from "@/components/admin/patient-stats-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RecentAppointments from "@/components/admin/recent-appointments";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
      <KpiCards />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Appointments Overview</CardTitle>
                <CardDescription>A summary of appointments and cancellations over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <PatientStatsChart />
            </CardContent>
        </Card>
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>The most recent appointments across all patients.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentAppointments />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
