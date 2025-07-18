import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
  
const appointments = [
    {
      id: '1',
      doctor: 'Dr. Smith',
      service: 'Routine Check-up',
      date: '2024-08-15',
      time: '10:00 AM',
      status: 'Confirmed',
    },
    {
      id: '2',
      doctor: 'Dr. Jones',
      service: 'Nail Trimming',
      date: '2024-08-20',
      time: '02:30 PM',
      status: 'Confirmed',
    },
    {
      id: '3',
      doctor: 'Dr. Smith',
      service: 'Fungal Infection Treatment',
      date: '2024-07-22',
      time: '09:00 AM',
      status: 'Completed',
    },
    {
      id: '4',
      doctor: 'Dr. Smith',
      service: 'Routine Check-up',
      date: '2024-06-11',
      time: '11:00 AM',
      status: 'Canceled',
    },
]
  
export default function AppointmentsList() {
    const getBadgeVariant = (status: string) => {
        if (status === 'Confirmed') return 'default';
        if (status === 'Completed') return 'secondary';
        if (status === 'Canceled') return 'destructive';
        return 'outline';
    }

    return (
      <Card>
        <CardHeader>
            <CardTitle>My Appointments</CardTitle>
            <CardDescription>View your upcoming and past appointments.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {appointments.map((appt) => (
                    <TableRow key={appt.id}>
                    <TableCell className="font-medium">{appt.doctor}</TableCell>
                    <TableCell>{appt.service}</TableCell>
                    <TableCell>{appt.date} at {appt.time}</TableCell>
                    <TableCell>
                        <Badge variant={getBadgeVariant(appt.status)}>
                            {appt.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {appt.status === 'Confirmed' && (
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm">Reschedule</Button>
                                <Button variant="destructive" size="sm">Cancel</Button>
                            </div>
                        )}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    )
}
