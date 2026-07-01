"use client"

import * as React from "react"
import { Download, FileText, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer
} from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { useToast } from "@/components/ui/use-toast"

import { useChartTheme } from "@/lib/hooks/use-chart-theme"

const PC = ["#1e3a8a", "#3b82f6", "#22c55e", "#06b6d4", "#f59e0b", "#94a3b8", "#ef4444"]

export function ReportsClient({ initialData, branchId }: { initialData: any, branchId?: number }) {
  const [activeTab, setActiveTab] = React.useState("Sales")
  const [isExporting, setIsExporting] = React.useState(false)
  const ct = useChartTheme()
  const { toast } = useToast()

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
  const promosData = initialData?.promos || []

  let CD: any[] = []
  if (initialData?.customers?.length > 0) {
    const custMap = new Map<string, any>(initialData.customers.map((c: any) => [c.m ? c.m.trim() : "", c]))
    CD = last6Months.map(m => {
      const existing = custMap.get(m)
      return { m, signups: existing ? Number(existing.signups) : 0 }
    })
  } else {
    CD = [
      { m: "Jan", signups: 120 }, { m: "Feb", signups: 150 }, { m: "Mar", signups: 180 },
      { m: "Apr", signups: 140 }, { m: "May", signups: 210 }, { m: "Jun", signups: 250 }
    ]
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      doc.text(`ER Coffeelab - ${activeTab} Report`, 14, 15)

      let columns: string[] = []
      let rows: any[] = []

      if (activeTab === "Sales") {
        columns = ["Month", "Revenue (IDR)", "Total Orders"]
        rows = RV.map((item: any) => [item.m, `Rp ${Number(item.r || 0).toLocaleString('id-ID')} Juta`, item.o])
      } else if (activeTab === "Payments") {
        columns = ["Payment Method", "Total Transactions"]
        rows = PD.map((item: any) => [item.name, item.value])
      } else if (activeTab === "Shifts") {
        columns = ["ID", "Employee", "Branch", "Date", "Open", "Close", "Sales", "Orders", "Status"]
        rows = shiftsData.map((item: any) => [item.id, item.employee, item.branch, item.shift_date, item.open_time, item.close_time, `IDR ${Number(item.sales || 0).toLocaleString('id-ID')}`, item.orders, item.status])
      } else if (activeTab === "Promos") {
        columns = ["No", "Voucher Code", "Total Redeemed", "Total Discount (IDR)"]
        rows = promosData.map((item: any, i: number) => [i + 1, item.code, item.redeemed, `IDR ${Number(item.total_discount || 0).toLocaleString('id-ID')}`])
      } else if (activeTab === "Customers") {
        columns = ["Month", "New Signups"]
        rows = CD.map((item: any) => [item.m, item.signups])
      } else {
        // Products
        columns = ["No", "Product Name", "Category", "Sold", "Revenue"]
        rows = productsData.map((item: any, i: number) => [i + 1, item.name, item.category, item.sold, `IDR ${Number(item.revenue || 0).toLocaleString('id-ID')}`])
      }

      // @ts-ignore
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 25,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [42, 45, 74] },
      })

      doc.save(`er-coffeelab-${activeTab.toLowerCase()}-report.pdf`)
      toast(`Berhasil mengunduh dokumen PDF ${activeTab}`, "success")
    } catch (error) {
      console.error("Failed to export PDF", error)
      toast("Gagal mengekspor dokumen PDF.", "error")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      let dataToExport: any[] = []

      if (activeTab === "Sales") {
        dataToExport = RV.map((item: any) => ({
          Bulan: item.m,
          "Revenue (Juta)": item.r,
          "Total Orders": item.o
        }))
      } else if (activeTab === "Payments") {
        dataToExport = PD.map((item: any) => ({
          "Metode Pembayaran": item.name,
          "Jumlah Transaksi": item.value
        }))
      } else if (activeTab === "Shifts") {
        dataToExport = shiftsData.map((item: any, i: number) => ({
          No: i + 1,
          Pegawai: item.employee,
          Cabang: item.branch,
          Tanggal: item.shift_date,
          "Jam Buka": item.open_time,
          "Jam Tutup": item.close_time,
          "Penjualan (IDR)": Number(item.sales || 0),
          "Total Order": item.orders,
          Status: item.status
        }))
      } else if (activeTab === "Promos") {
        dataToExport = promosData.map((item: any, i: number) => ({
          No: i + 1,
          "Kode Voucher": item.code,
          "Total Ditukarkan": item.redeemed,
          "Total Diskon (IDR)": Number(item.total_discount || 0)
        }))
      } else if (activeTab === "Customers") {
        dataToExport = CD.map((item: any) => ({
          Bulan: item.m,
          "Pelanggan Baru": item.signups
        }))
      } else {
        // Products
        dataToExport = productsData.map((item: any, i: number) => ({
          No: i + 1,
          Produk: item.name,
          Kategori: item.category,
          Terjual: item.sold,
          "Pendapatan (IDR)": Number(item.revenue || 0)
        }))
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, activeTab)
      XLSX.writeFile(wb, `er-coffeelab-${activeTab.toLowerCase()}-report.xlsx`)
      toast(`Berhasil mengunduh dokumen Excel ${activeTab}`, "success")
    } catch (error) {
      console.error("Failed to export Excel", error)
      toast("Gagal mengekspor dokumen Excel.", "error")
    } finally {
      setIsExporting(false)
    }
  }

  const shiftCols = [
    { header: "No", accessorKey: "id" as const, cell: (_: any, index: number) => index + 1 },
    { header: "Employee", accessorKey: "employee" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Date", accessorKey: "shift_date" as const },
    { header: "Open", accessorKey: "open_time" as const },
    { header: "Close", accessorKey: "close_time" as const },
    { 
      header: "Sales", 
      cell: (item: any) => `IDR ${Number(item.sales || 0).toLocaleString('id-ID')}` 
    },
    { header: "Orders", accessorKey: "orders" as const },
    {
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.status === "CLOSED" ? "default" : "success"}>
          {item.status}
        </Badge>
      )
    }
  ]

  const productCols = [
    { header: "No", accessorKey: "id" as const, cell: (_: any, index: number) => index + 1 },
    { header: "Product Name", accessorKey: "name" as const },
    { header: "Category", accessorKey: "category" as const },
    { header: "Sold", accessorKey: "sold" as const },
    {
      header: "Revenue",
      cell: (item: any) => `IDR ${Number(item.revenue || 0).toLocaleString('id-ID')}`
    }
  ]

  const promoCols = [
    { header: "No", accessorKey: "id" as const, cell: (_: any, index: number) => index + 1 },
    { header: "Voucher Code", accessorKey: "code" as const },
    { header: "Total Redeemed", accessorKey: "redeemed" as const },
    {
      header: "Total Discount Given",
      cell: (item: any) => `IDR ${Number(item.total_discount || 0).toLocaleString('id-ID')}`
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
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg font-bold text-[13px] hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <FileText size={14} /> {isExporting ? "Memproses..." : "PDF"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg font-bold text-[13px] hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <Download size={14} /> {isExporting ? "Memproses..." : "XLS"}
            </button>
          </div>
        }
      />

      <div className="flex gap-2 bg-muted/50 p-1 rounded-xl mb-4 overflow-x-auto scrollbar-none w-max">
        {["Sales", "Products", "Payments", "Promos", "Customers", "Shifts"].map(t => (
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
                <RTooltip contentStyle={tt} formatter={(value: any) => [`Rp ${value} Juta`, 'Revenue']} />
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
                <RTooltip contentStyle={tt} formatter={(value: any) => [`${value} Orders`, 'Orders']} />
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

      {(activeTab === "Shifts" || activeTab === "Products" || activeTab === "Promos") && (
        <div className="mt-2">
          <DataTable
            data={activeTab === "Shifts" ? shiftsData : activeTab === "Promos" ? promosData : productsData}
            columns={activeTab === "Shifts" ? shiftCols : activeTab === "Promos" ? promoCols : productCols}
            keyExtractor={(item: any) => item.id || item.code || Math.random().toString()}
          />
        </div>
      )}

      {activeTab === "Customers" && (
        <Card className="p-4 bg-card border-border">
          <div className="text-sm font-bold text-card-foreground mb-4">New Signups</div>
          <ResponsiveContainer width="100%" height={320} className="[&_:focus]:outline-none">
            <LineChart data={CD}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="m" stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
              <YAxis stroke={ct.text} fontSize={11} tick={{ fill: ct.text }} />
              <RTooltip contentStyle={tt} formatter={(value: any) => [`${value} Signups`, 'Customers']} />
              <Line type="monotone" dataKey="signups" stroke="#22c55e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
