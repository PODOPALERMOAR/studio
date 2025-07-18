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
    { name: "John Doe", date: "2024-08-15", status: "Confirmed" },
    { name: "Jane Smith", date: "2024-08-15", status: "Confirmed" },
    { name: "Peter Jones", date: "2024-08-14", status: "Completed" },
    { name: "Mary Williams", date: "2024-08-14", status: "Canceled" },
    { name: "David Brown", date: "2024-08-13", status: "Completed" },
    { name: "Sarah Miller", date: "2024-08-13", status: "Completed" },
];

export default function RecentAppointments() {
    const getBadgeVariant = (status: string) => {
        if (status === 'Confirmed') return 'default';
        if (status === 'Completed') return 'secondary';
        if (status === 'Canceled') return 'destructive';
        return 'outline';
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
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
