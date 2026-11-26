"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// Categorical slots 1 & 2 of the validated reference palette, stepped per mode.
const config = {
  count: { label: "Leads", theme: { light: "#2a78d6", dark: "#3987e5" } },
  converted: { label: "Converted", theme: { light: "#eb6834", dark: "#d95926" } },
} satisfies ChartConfig;

const dayLabel = (ymd: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${ymd}T00:00:00Z`));

export function TrendChart({ data }: { data: { day: string; count: number; converted: number }[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={dayLabel} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <ChartTooltip cursor content={<ChartTooltipContent indicator="line" labelFormatter={(v) => dayLabel(String(v))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="count" type="monotone" stroke="var(--color-count)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line dataKey="converted" type="monotone" stroke="var(--color-converted)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ChartContainer>
  );
}
