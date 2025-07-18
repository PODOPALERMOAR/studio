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
      service: 'Control de rutina',
      date: '2024-08-15',
      time: '10:00 AM',
      status: 'Confirmado',
    },
    {
      id: '2',
      doctor: 'Dr. Jones',
      service: 'Corte de uñas',
      date: '2024-08-20',
      time: '02:30 PM',
      status: 'Confirmado',
    },
    {
      id: '3',
      doctor: 'Dr. Smith',
      service: 'Tratamiento de hongos',
      date: '2024-07-22',
      time: '09:00 AM',
      status: 'Completado',
    },
    {
      id: '4',
      doctor: 'Dr. Smith',
      service: 'Control de rutina',
      date: '2024-06-11',
      time: '11:00 AM',
      status: 'Cancelado',
    },
]
  
export default function AppointmentsList() {
    const getBadgeVariant = (status: string) => {
        if (status === 'Confirmado') return 'default';
        if (status === 'Completado') return 'secondary';
        if (status === 'Cancelado') return 'destructive';
        return 'outline';
    }

    return (
      <Card>
        <CardHeader>
            <CardTitle>Mis Turnos</CardTitle>
            <CardDescription>Mirá tus turnos próximos y pasados.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Doctor/a</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {appointments.map((appt) => (
                    <TableRow key={appt.id}>
                    <TableCell className="font-medium">{appt.doctor}</TableCell>
                    <TableCell>{appt.service}</TableCell>
                    <TableCell>{appt.date} a las {appt.time}</TableCell>
                    <TableCell>
                        <Badge variant={getBadgeVariant(appt.status)}>
                            {appt.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {appt.status === 'Confirmado' && (
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm">Reprogramar</Button>
                                <Button variant="destructive" size="sm">Cancelar</Button>
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
