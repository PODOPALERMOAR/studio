import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar, Ban } from "lucide-react";

export default function KpiCards() {
    const kpis = [
        { title: "Ingresos Totales", value: "$45,231.89", icon: DollarSign, change: "+20.1% desde el mes pasado" },
        { title: "Turnos Totales", value: "+2350", icon: Calendar, change: "+180.1% desde el mes pasado" },
        { title: "Pacientes Activos", value: "+120", icon: Users, change: "+19% desde el mes pasado" },
        { title: "Cancelaciones", value: "32", icon: Ban, change: "-2% desde el mes pasado" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map(kpi => (
                <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <p className="text-xs text-muted-foreground">{kpi.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
