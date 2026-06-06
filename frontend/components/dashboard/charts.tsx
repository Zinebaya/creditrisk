"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "8px 12px",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(22,74,65,0.12)",
}

const labelStyle = { color: "var(--muted-foreground)", fontSize: 11 }
const itemStyle = { color: "var(--foreground)", fontSize: 12, fontWeight: 600 }

export function RiskTrendChart() {
  const data = React.useMemo(
    () => [
      { m: "Jan", high: 12, med: 26, low: 62 },
      { m: "Feb", high: 14, med: 24, low: 64 },
      { m: "Mar", high: 11, med: 28, low: 61 },
      { m: "Apr", high: 9, med: 25, low: 66 },
      { m: "May", high: 10, med: 22, low: 68 },
      { m: "Jun", high: 8, med: 24, low: 71 },
      { m: "Jul", high: 7, med: 21, low: 72 },
      { m: "Aug", high: 9, med: 23, low: 70 },
      { m: "Sep", high: 6, med: 20, low: 74 },
      { m: "Oct", high: 5, med: 22, low: 76 },
      { m: "Nov", high: 7, med: 19, low: 77 },
      { m: "Dec", high: 5, med: 18, low: 80 },
    ],
    [],
  )

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="lowFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4D774E" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4D774E" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="medFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1B24A" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#F1B24A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="highFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c0392b" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#c0392b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="m" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
          <Area type="monotone" dataKey="low" stroke="#4D774E" strokeWidth={2} fill="url(#lowFill)" name="Low risk %" />
          <Area type="monotone" dataKey="med" stroke="#F1B24A" strokeWidth={2} fill="url(#medFill)" name="Medium risk %" />
          <Area type="monotone" dataKey="high" stroke="#c0392b" strokeWidth={2} fill="url(#highFill)" name="High risk %" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const distData = [
  { name: "Low risk", value: 64, color: "#4D774E" },
  { name: "Medium risk", value: 24, color: "#F1B24A" },
  { name: "High risk", value: 9, color: "#c0392b" },
  { name: "Pending review", value: 3, color: "#9DC88D" },
]

export function RiskDistributionChart() {
  return (
    <div className="h-[260px] w-full flex items-center">
      <div className="relative w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distData}
              dataKey="value"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="var(--card)"
              strokeWidth={3}
            >
              {distData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-display text-2xl font-bold tabular-nums">12,840</p>
        </div>
      </div>
      <ul className="w-1/2 space-y-2.5 pl-2">
        {distData.map((d) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-foreground">{d.name}</span>
            </span>
            <span className="text-muted-foreground tabular-nums font-mono text-xs">
              {d.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PredictionVolumeChart() {
  const data = [
    { d: "Mon", v: 1240 },
    { d: "Tue", v: 1380 },
    { d: "Wed", v: 1620 },
    { d: "Thu", v: 1490 },
    { d: "Fri", v: 1820 },
    { d: "Sat", v: 740 },
    { d: "Sun", v: 620 },
  ]
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="d" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} cursor={{ fill: "var(--secondary)", radius: 8 }} />
          <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="#164A41" name="Predictions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ApprovalRateChart() {
  const data = [
    { m: "Jan", r: 71 },
    { m: "Feb", r: 73 },
    { m: "Mar", r: 70 },
    { m: "Apr", r: 75 },
    { m: "May", r: 78 },
    { m: "Jun", r: 76 },
    { m: "Jul", r: 80 },
    { m: "Aug", r: 82 },
    { m: "Sep", r: 81 },
    { m: "Oct", r: 84 },
    { m: "Nov", r: 86 },
    { m: "Dec", r: 88 },
  ]
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="m" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} itemStyle={itemStyle} />
          <Line
            type="monotone"
            dataKey="r"
            stroke="#F1B24A"
            strokeWidth={2.5}
            dot={{ fill: "#F1B24A", r: 3 }}
            activeDot={{ r: 5 }}
            name="Approval rate %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
