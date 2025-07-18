"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

const chartData = [
  { month: "Enero", appointments: 186, cancellations: 80 },
  { month: "Febrero", appointments: 305, cancellations: 200 },
  { month: "Marzo", appointments: 237, cancellations: 120 },
  { month: "Abril", appointments: 273, cancellations: 190 },
  { month: "Mayo", appointments: 209, cancellations: 130 },
  { month: "Junio", appointments: 214, cancellations: 140 },
]

const chartConfig = {
    appointments: {
      label: "Turnos",
      color: "hsl(var(--primary))",
    },
    cancellations: {
      label: "Cancelaciones",
      color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig

export default function PatientStatsChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                stroke="#888888"
                fontSize={12}
            />
            <YAxis
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                stroke="#888888"
                fontSize={12}
            />
            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="appointments" fill="var(--color-appointments)" radius={4} />
            <Bar dataKey="cancellations" fill="var(--color-cancellations)" radius={4} />
        </BarChart>
    </ChartContainer>
  )
}
