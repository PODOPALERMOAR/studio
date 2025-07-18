import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar, Ban } from "lucide-react";

export default function KpiCards() {
    const kpis = [
        { title: "Total Revenue", value: "$45,231.89", icon: DollarSign, change: "+20.1% from last month" },
        { title: "Total Appointments", value: "+2350", icon: Calendar, change: "+180.1% from last month" },
        { title: "Active Patients", value: "+120", icon: Users, change: "+19% from last month" },
        { title: "Cancellations", value: "32", icon: Ban, change: "-2% from last month" },
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
