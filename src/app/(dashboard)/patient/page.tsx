import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentScheduler from "@/components/patient/appointment-scheduler";
import AppointmentsList from "@/components/patient/appointments-list";
import VoucherValidator from "@/components/patient/voucher-validator";

export default function PatientDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Patient Dashboard</h1>
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">Book Appointment</TabsTrigger>
          <TabsTrigger value="appointments">My Appointments</TabsTrigger>
          <TabsTrigger value="voucher">Upload Voucher</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <AppointmentScheduler />
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          <AppointmentsList />
        </TabsContent>
        <TabsContent value="voucher" className="mt-4">
          <VoucherValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
