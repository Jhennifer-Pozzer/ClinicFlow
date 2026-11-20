"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl, monthLabel, numberLabel, shortDate } from "@/lib/format";

const box = { width: 350, height: 215 };
const tick = { fontSize: 12, fill: "#475569" };
const grid = "#e8edf5";

export function EvolutionChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  const gradient = useId();
  return (
    <div
      className="h-56 min-w-0"
      role="group"
      aria-label="Gráfico de agendamentos por dia"
    >
      <ResponsiveContainer initialDimension={box} width="100%" height="100%">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ top: 8, right: 14, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDate}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tick={tick}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={tick}
            width={34}
          />
          <Tooltip
            labelFormatter={(value) => shortDate(String(value))}
            formatter={(value) => [numberLabel(Number(value)), "Agendamentos"]}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#2563eb"
            strokeWidth={2.5}
            fill={`url(#${gradient})`}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type StatusSlice = { label: string; count: number; fill: string };

export function StatusChart({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="grid items-center gap-3 min-[440px]:grid-cols-[minmax(135px,1fr)_minmax(138px,1fr)]">
      <div
        className="relative h-43 min-w-0"
        role="group"
        aria-label="Gráfico de agendamentos por status"
      >
        <ResponsiveContainer
          initialDimension={{ width: 180, height: 172 }}
          width="100%"
          height="100%"
        >
          <PieChart accessibilityLayer>
            <Pie
              data={data.filter(({ count }) => count > 0)}
              dataKey="count"
              nameKey="label"
              innerRadius="65%"
              outerRadius="91%"
              paddingAngle={2}
              isAnimationActive={false}
            />
            <Tooltip formatter={(value) => numberLabel(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid place-content-center text-center"
        >
          <p className="text-2xl font-bold tabular-nums">
            {numberLabel(total)}
          </p>
          <p className="text-xs text-muted">Total</p>
        </div>
      </div>
      <ul className="grid gap-2.5 text-sm">
        {data.map(({ label, count, fill }) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              style={{ backgroundColor: fill }}
              className="size-2.5 shrink-0 rounded-full"
            />
            <span className="text-muted">{label}</span>
            <strong className="ml-auto pl-1 tabular-nums">
              {numberLabel(count)}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 0,
});

export function RevenueChart({
  data,
}: {
  data: { month: string; cents: number }[];
}) {
  return (
    <div
      className="h-53 min-w-0"
      role="group"
      aria-label="Gráfico de receita recebida por mês"
    >
      <ResponsiveContainer initialDimension={box} width="100%" height="100%">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 15, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={monthLabel}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tick={tick}
          />
          <YAxis
            tickFormatter={(cents: number) =>
              compactCurrency.format(cents / 100)
            }
            axisLine={false}
            tickLine={false}
            tick={tick}
            width={72}
          />
          <Tooltip
            labelFormatter={(value) => monthLabel(String(value))}
            formatter={(value) => [brl(Number(value)), "Receita"]}
          />
          <Bar
            dataKey="cents"
            fill="#0d9488"
            radius={[6, 6, 0, 0]}
            maxBarSize={58}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
