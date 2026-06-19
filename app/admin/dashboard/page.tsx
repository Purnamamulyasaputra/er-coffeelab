"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import useSWR from "swr"
import { Package, DollarSign, TrendingUp, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"

const RevenueChart = dynamic(() => import("@/components/admin/dashboard-charts").then(mod => mod.RevenueChart), { ssr: false, loading: () => <div className="h-[230px] w-full animate-pulse bg-muted rounded-lg" /> })
const PaymentSplitChart = dynamic(() => import("@/components/admin/dashboard-charts").then(mod => mod.PaymentSplitChart), { ssr: false, loading: () => <div className="h-[230px] w-full animate-pulse bg-muted rounded-lg" /> })
const BranchPerfChart = dynamic(() => import("@/components/admin/dashboard-charts").then(mod => mod.BranchPerfChart), { ssr: false, loading: () => <div className="h-[180px] w-full animate-pulse bg-muted rounded-lg" /> })
const KPIGaugeChart = dynamic(() => import("@/components/admin/dashboard-charts").then(mod => mod.KPIGaugeChart), { ssr: false, loading: () => <div className="h-[180px] w-full animate-pulse bg-muted rounded-lg" /> })
const SourceSplitChart = dynamic(() => import("@/components/admin/dashboard-charts").then(mod => mod.SourceSplitChart), { ssr: false, loading: () => <div className="h-[170px] w-full animate-pulse bg-muted rounded-lg" /> })

const fetcher = (url: string) => fetch(url).then(res => res.json()).then(d => d.data)

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard", fetcher, { refreshInterval: 60000 })

  const kpis = data ? [
    { ic: Package, l: "Orders Today", v: String(data.kpis.ordersToday), s: data.kpis.ordersChange, c: "#3b82f6", bg: "bg-blue-500/15" },
    { ic: DollarSign, l: "Revenue", v: `IDR ${Number(data.kpis.revenue).toLocaleString("id-ID")}`, s: data.kpis.revenueChange, c: "#22c55e", bg: "bg-success/15" },
    { ic: TrendingUp, l: "AOV", v: `IDR ${Number(data.kpis.aov).toLocaleString("id-ID")}`, s: data.kpis.aovChange, c: "#3b82f6", bg: "bg-blue-500/15" },
    { ic: Users, l: "Customers", v: Number(data.kpis.customers).toLocaleString("id-ID"), s: data.kpis.customersChange, c: "#06b6d4", bg: "bg-cyan-500/15" },
  ] : []

  const scorecards = data ? [
    { l: "POS Adopt", v: data.scorecards.posAdopt, c: "#22c55e" },
    { l: "POS Time", v: data.scorecards.posTime, c: "#3b82f6" },
    { l: "Cash Var", v: data.scorecards.cashVar, c: "#f59e0b" },
    { l: "KDS Bump", v: data.scorecards.kdsBump, c: "#06b6d4" },
    { l: "Inv Acc", v: data.scorecards.invAcc, c: "#3b82f6" },
    { l: "Rating", v: data.scorecards.rating, c: "#f59e0b" },
  ] : []

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Loading analytics..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[80px] animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="col-span-1 md:col-span-2 h-[280px] animate-pulse bg-muted rounded-xl" />
          <div className="h-[280px] animate-pulse bg-muted rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="h-[230px] animate-pulse bg-muted rounded-xl" />
          <div className="h-[230px] animate-pulse bg-muted rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[220px] animate-pulse bg-muted rounded-xl" />
          <div className="h-[220px] animate-pulse bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Real-time analytics for ${data.branchName || "all branches"}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="flex flex-row items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
              <kpi.ic size={20} color={kpi.c} />
            </div>
            <div>
              <div className="text-[12px] text-muted-foreground font-semibold">{kpi.l}</div>
              <div className="text-xl font-extrabold">{kpi.v}</div>
              <div className="text-[11px] font-semibold" style={{ color: kpi.s.startsWith("-") ? "#ef4444" : "#22c55e" }}>{kpi.s}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="col-span-1 md:col-span-2 p-4">
          <div className="text-[14px] font-bold mb-3">Revenue and Orders</div>
          <RevenueChart data={data.revenueOrders} />
        </Card>
        <Card className="col-span-1 p-4">
          <div className="text-[14px] font-bold mb-3">Payment Split</div>
          <PaymentSplitChart data={data.paymentSplit} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <div className="text-[14px] font-bold mb-3">Branch Performance</div>
          <BranchPerfChart data={data.branchPerf} />
        </Card>
        <Card className="p-4">
          <div className="text-[14px] font-bold mb-3">KPI Gauges</div>
          <KPIGaugeChart data={data.gauges} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-[14px] font-bold mb-3">Source Split</div>
          <SourceSplitChart data={data.sourceData} />
        </Card>
        <Card className="p-4">
          <div className="text-[14px] font-bold mb-3">Scorecards</div>
          <div className="grid grid-cols-2 gap-2">
            {scorecards.map((s, i) => (
              <div key={i} className="bg-muted rounded-lg p-2 text-center">
                <div className="text-[10px] text-muted-foreground font-semibold">{s.l}</div>
                <div className="text-lg font-extrabold mt-0.5" style={{ color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
