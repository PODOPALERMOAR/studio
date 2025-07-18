import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const recentAppointments = [
    { name: "John Doe", date: "2024-08-15", status: "Confirmado" },
    { name: "Jane Smith", date: "2024-08-15", status: "Confirmado" },
    { name: "Peter Jones", date: "2024-08-14", status: "Completado" },
    { name: "Mary Williams", date: "2024-08-14", status: "Cancelado" },
    { name: "David Brown", date: "2024-08-13", status: "Completado" },
    { name: "Sarah Miller", date: "2024-08-13", status: "Completado" },
];

export default function RecentAppointments() {
    const getBadgeVariant = (status: string) => {
        if (status === 'Confirmado') return 'default';
        if (status === 'Completado') return 'secondary';
        if (status === 'Cancelado') return 'destructive';
        return 'outline';
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {recentAppointments.map(appt => (
                    <TableRow key={appt.name}>
                        <TableCell className="font-medium">{appt.name}</TableCell>
                        <TableCell>{appt.date}</TableCell>
                        <TableCell className="text-right">
                           <Badge variant={getBadgeVariant(appt.status)} className="capitalize">{appt.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
