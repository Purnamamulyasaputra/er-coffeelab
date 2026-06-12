"use client"
import * as React from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer, ComposedChart
} from "recharts"
import { useChartTheme } from "@/lib/hooks/use-chart-theme"

const PC = ["#1e3a8a", "#3b82f6", "#22c55e", "#06b6d4", "#f59e0b", "#94a3b8", "#ef4444"];

interface RevenueData { m: string; r: number; o: number }
interface PaymentData { name: string; value: number }
interface BranchData { n: string; r: number }
interface SourceData { m: string; a: number; p: number }
interface GaugeData { fulfill: number; retain: number; target: number }

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const ct = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={230} className="[&_:focus]:outline-none">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
        <XAxis dataKey="m" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
        <YAxis yAxisId="l" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
        <YAxis yAxisId="r" orientation="right" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
        <RTooltip contentStyle={{ backgroundColor: ct.tooltipBg, borderColor: ct.tooltipBorder, borderRadius: 8, color: ct.tooltipText }} />
        <Legend />
        <Bar yAxisId="l" dataKey="r" fill="#1e3a8a" name="Rev(M)" radius={[4, 4, 0, 0]} barSize={35} />
        <Line yAxisId="r" type="monotone" dataKey="o" stroke="#60a5fa" name="Orders" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function PaymentSplitChart({ data }: { data: PaymentData[] }) {
  const ct = useChartTheme()
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[230px] flex items-center justify-center text-sm text-muted-foreground">
        No payment data available
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={230} className="[&_:focus]:outline-none">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={e => `${e.name} ${((e.percent || 0) * 100).toFixed(0)}%`}>
          {data.map((_item: any, i: number) => <Cell key={i} fill={PC[i % PC.length]} />)}
        </Pie>
        <RTooltip contentStyle={{ backgroundColor: ct.tooltipBg, borderColor: ct.tooltipBorder, borderRadius: 8, color: ct.tooltipText }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function BranchPerfChart({ data }: { data: BranchData[] }) {
  const ct = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={180} className="[&_:focus]:outline-none">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
        <XAxis type="number" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
        <YAxis type="category" dataKey="n" width={80} stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
        <RTooltip contentStyle={{ backgroundColor: ct.tooltipBg, borderColor: ct.tooltipBorder, borderRadius: 8, color: ct.tooltipText }} />
        <Bar dataKey="r" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={15} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function KPIGaugeChart({ data }: { data: GaugeData }) {
  const ct = useChartTheme()
  const GD = [
    { name: "Fulfill", value: data.fulfill, fill: "#22c55e" },
    { name: "Retain", value: data.retain, fill: "#3b82f6" },
    { name: "Target", value: data.target, fill: "#f59e0b" },
  ]
  return (
    <ResponsiveContainer width="100%" height={180} className="[&_:focus]:outline-none">
      <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={GD} startAngle={180} endAngle={0}>
        <RadialBar background dataKey="value" cornerRadius={8} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        <RTooltip contentStyle={{ backgroundColor: ct.tooltipBg, borderColor: ct.tooltipBorder, borderRadius: 8, color: ct.tooltipText }} />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}

export function SourceSplitChart({ data }: { data: SourceData[] }) {
  const ct = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={170} className="[&_:focus]:outline-none">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
        <XAxis dataKey="m" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
        <YAxis stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
        <RTooltip contentStyle={{ backgroundColor: ct.tooltipBg, borderColor: ct.tooltipBorder, borderRadius: 8, color: ct.tooltipText }} />
        <Area type="monotone" dataKey="a" stackId="1" fill="#1e3a8a" stroke="#1e3a8a" name="App" />
        <Area type="monotone" dataKey="p" stackId="1" fill="#60a5fa" stroke="#60a5fa" name="POS" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
