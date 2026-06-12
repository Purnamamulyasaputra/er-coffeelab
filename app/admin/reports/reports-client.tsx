"use client"

import * as React from "react"
import { Download, FileText, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer
} from "recharts"
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

import { useChartTheme } from "@/lib/hooks/use-chart-theme"

const PC = ["#1e3a8a", "#3b82f6", "#22c55e", "#06b6d4", "#f59e0b", "#94a3b8", "#ef4444"]

export function ReportsClient({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = React.useState("Sales")
  const ct = useChartTheme()

  const tt = {
    backgroundColor: ct.tooltipBg,
    borderColor: ct.tooltipBorder,
    borderRadius: 8,
    color: ct.tooltipText
  }

  // Fallback to dummy data if DB is empty for a particular metric so charts don't break visually during testing
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return d.toLocaleString("en-US", { month: "short" })
  })

  let RV: any[] = []
  if (initialData?.sales?.length > 0) {
    const salesMap = new Map<string, any>(initialData.sales.map((s: any) => [s.m ? s.m.trim() : "", s]))
    RV = last6Months.map(m => {
      const existing = salesMap.get(m)
      return {
        m,
        r: existing ? Number(existing.r) : 0,
        o: existing ? Number(existing.o) : 0
      }
    })
  } else {
    RV = [
      { m: "Jan", r: 42, o: 320 }, { m: "Feb", r: 48, o: 380 }, { m: "Mar", r: 55, o: 420 },
      { m: "Apr", r: 51, o: 400 }, { m: "May", r: 62, o: 480 }, { m: "Jun", r: 68, o: 520 }
    ]
  }

  const PD = initialData?.payments?.length > 0 ? initialData.payments : [
    { name: "QRIS", value: 35 }, { name: "GoPay", value: 25 }, { name: "Cash", value: 20 },
    { name: "VA", value: 12 }, { name: "Card", value: 8 }
  ]
  const shiftsData = initialData?.shifts || []
  const productsData = initialData?.products || []

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text(`ER Coffeelab - ${activeTab} Report`, 14, 15)

    if (activeTab === "Shifts" || activeTab === "Products") {
      const isShifts = activeTab === "Shifts"
      const data = isShifts ? shiftsData : productsData
      const columns = isShifts
        ? ["ID", "Employee", "Branch", "Open", "Close", "Sales", "Orders", "Status"]
        : ["ID", "Product Name", "Category", "Sold", "Revenue"]

      const rows = data.map((item: any) => isShifts
        ? [item.id, item.employee, item.branch, item.open, item.close, item.sales, item.orders, item.status]
        : [item.id, item.name, item.category, item.sold, `IDR ${Number(item.revenue || 0).toLocaleString('id-ID')}`]
      )

      // @ts-ignore
      doc.autoTable({
        head: [columns],
        body: rows,
        startY: 20,
      })
    } else {
      doc.setFontSize(10)
      doc.text("Charts export to PDF is not supported in this basic version. Please view online.", 14, 25)
    }

    doc.save(`er-coffeelab-${activeTab.toLowerCase()}-report.pdf`)
  }

  const handleExportExcel = () => {
    let ws
    if (activeTab === "Sales") {
      ws = XLSX.utils.json_to_sheet(RV)
    } else if (activeTab === "Payments") {
      ws = XLSX.utils.json_to_sheet(PD)
    } else if (activeTab === "Shifts") {
      ws = XLSX.utils.json_to_sheet(shiftsData)
    } else {
      ws = XLSX.utils.json_to_sheet(productsData)
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, activeTab)
    XLSX.writeFile(wb, `er-coffeelab-${activeTab.toLowerCase()}-report.xlsx`)
  }

  const shiftCols = [
    { header: "No", accessorKey: "id" as const },
    { header: "Employee", accessorKey: "employee" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Open", accessorKey: "open" as const },
    { header: "Close", accessorKey: "close" as const },
    { header: "Sales", accessorKey: "sales" as const },
    { header: "Orders", accessorKey: "orders" as const },
    {
      header: "Status",
      cell: (item: any) => (
        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${item.status === "CLOSED" ? "bg-muted text-muted-foreground" : "bg-success/20 text-success"
          }`}>
          {item.status}
        </span>
      )
    },
    {
      header: "Actions",
      cell: () => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const productCols = [
    { header: "No", accessorKey: "id" as const },
    { header: "Product Name", accessorKey: "name" as const },
    { header: "Category", accessorKey: "category" as const },
    { header: "Sold", accessorKey: "sold" as const },
    {
      header: "Revenue",
      cell: (item: any) => `IDR ${Number(item.revenue || 0).toLocaleString('id-ID')}`
    },
    {
      header: "Actions",
      cell: () => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Export PDF/Excel"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg font-bold text-[13px] hover:bg-muted/80 transition-colors"
            >
              <FileText size={14} /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg font-bold text-[13px] hover:bg-muted/80 transition-colors"
            >
              <Download size={14} /> XLS
            </button>
          </div>
        }
      />

      <div className="flex gap-2 bg-muted/50 p-1 rounded-xl mb-4 overflow-x-auto scrollbar-none w-max">
        {["Sales", "Products", "Payments", "Shifts"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${activeTab === t ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Sales" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-card border-border">
            <div className="text-sm font-bold text-card-foreground mb-4">Revenue</div>
            <ResponsiveContainer width="100%" height={260} className="[&_:focus]:outline-none">
              <BarChart data={RV}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey="m" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
                <YAxis stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
                <RTooltip contentStyle={tt} />
                <Bar dataKey="r" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="text-sm font-bold text-card-foreground mb-4">Orders</div>
            <ResponsiveContainer width="100%" height={260} className="[&_:focus]:outline-none">
              <LineChart data={RV}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey="m" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
                <YAxis stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
                <RTooltip contentStyle={tt} />
                <Line type="monotone" dataKey="o" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {activeTab === "Payments" && (
        <Card className="p-4 bg-card border-border">
          <ResponsiveContainer width="100%" height={320} className="[&_:focus]:outline-none">
            <PieChart>
              <Pie
                data={PD}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                label={e => `${e.name} ${((e.percent || 0) * 100).toFixed(0)}%`}
              >
                {PD.map((_item: any, i: number) => <Cell key={i} fill={PC[i % PC.length]} />)}
              </Pie>
              <RTooltip contentStyle={tt} />
              <Legend wrapperStyle={{ fontSize: 12, color: ct.text }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {(activeTab === "Shifts" || activeTab === "Products") && (
        <div className="mt-2">
          <DataTable
            data={activeTab === "Shifts" ? shiftsData : productsData}
            columns={activeTab === "Shifts" ? shiftCols : productCols}
            keyExtractor={item => item.id}
          />
        </div>
      )}
    </div>
  )
}
