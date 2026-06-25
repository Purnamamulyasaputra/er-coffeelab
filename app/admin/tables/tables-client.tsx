"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, Grid, List, CheckCircle2, Users, CalendarClock, Receipt, Clock, Coffee, Calendar, Minus, Printer, CreditCard, X, Loader2, FileText } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ReceiptPrint, formatMoney } from "@/components/pos/receipt-print"
import { PaymentMethodPicker } from "@/components/pos/payment-method-picker"
import { XenditQrisModal } from "@/components/pos/xendit-qris-modal"
import { XenditEwalletModal } from "@/components/pos/xendit-ewallet-modal"
import { XenditVaModal } from "@/components/pos/xendit-va-modal"

function StatCard({ title, count }: { title: string, count: number }) {
  return (
    <div className="bg-card px-3 py-2 rounded-lg border border-border shadow-sm flex items-center gap-3 min-w-[100px]">
      <div className="font-bold text-base text-foreground/90">
        {count}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-[11px] font-semibold transition-all ${active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-background hover:text-foreground/90'
        }`}
    >
      {children}
    </button>
  );
}

export function TablesClient({ initialData, currentBranchId, isAllBranches = false, role = "STORE_ADMIN", branchName = "Cabang Utama", paymentMethods }: { initialData: any[], currentBranchId: number, isAllBranches?: boolean, role?: string, branchName?: string, paymentMethods?: any[] }) {

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [activeFilter, setActiveFilter] = React.useState('all')
  const [open, setOpen] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Form State for CRUD
  const [editId, setEditId] = React.useState<number | null>(null)
  const [branchId, setBranchId] = React.useState(String(currentBranchId))
  const [tableNumber, setTableNumber] = React.useState("")
  const [section, setSection] = React.useState("Indoor")
  const [capacity, setCapacity] = React.useState("4")
  const [status, setStatus] = React.useState("AVAILABLE")

  // Payment State
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState<"CASH" | "QRIS" | "DEBIT" | "TRANSFER">("CASH")
  const [cashAmount, setCashAmount] = React.useState("")

  const [sortOrder, setSortOrder] = React.useState("0")
  const [tableToDelete, setTableToDelete] = React.useState<{ id: number, number: string } | null>(null)

  // Action State for Grid View
  const [actionTable, setActionTable] = React.useState<any | null>(null)
  const [guestCount, setGuestCount] = React.useState("2")
  const [sessionDetail, setSessionDetail] = React.useState<any>(null)
  const [panelMode, setPanelMode] = React.useState<"open" | "view" | null>(null)
  const [customerName, setCustomerName] = React.useState("")
  const [tableNote, setTableNote] = React.useState("")
  const [finishConfirmOpen, setFinishConfirmOpen] = React.useState(false)
  const [lastTransaction, setLastTransaction] = React.useState<any>(null)

  // Xendit Modals
  const [xenditModalType, setXenditModalType] = React.useState<"QRIS"|"EWALLET"|"VA"|null>(null)
  const [xenditData, setXenditData] = React.useState<any>(null)
  const [xenditPaymentId, setXenditPaymentId] = React.useState<string | null>(null)

  const isKitchenReady = React.useMemo(() => {
    if (!sessionDetail || !sessionDetail.items || sessionDetail.items.length === 0) return true;
    return sessionDetail.items.every((item: any) => item.order_status === "READY" || item.order_status === "COMPLETED");
  }, [sessionDetail]);

  const stats = React.useMemo(() => ({
    total: initialData.length,
    available: initialData.filter(t => t.status === 'AVAILABLE').length,
    occupied: initialData.filter(t => t.status === 'OCCUPIED').length,
    reserved: initialData.filter(t => t.status === 'RESERVED').length,
  }), [initialData]);

  const tablesBySection = React.useMemo(() => {
    const groups: Record<string, any[]> = {}
    initialData.forEach(t => {
      if (activeFilter !== 'all' && t.status !== activeFilter.toUpperCase()) return;
      const sec = t.section || "Indoor"
      if (!groups[sec]) groups[sec] = []
      groups[sec].push(t)
    })
    return groups
  }, [initialData, activeFilter])

  // --- CRUD HANDLERS ---
  const handleOpenAdd = () => {
    setEditId(null)
    setBranchId(String(currentBranchId))
    setTableNumber("")
    setSection("Indoor")
    setCapacity("4")
    setStatus("AVAILABLE")
    setSortOrder("0")
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditId(item.id)
    setBranchId(String(item.branch_id || 1))
    setTableNumber(item.table_number || "")
    setSection(item.section || "Indoor")
    setCapacity(String(item.capacity || 4))
    setStatus(item.status || "AVAILABLE")
    setSortOrder(String(item.sort_order || 0))
    setOpen(true)
  }

  const handleSave = async () => {
    if (!tableNumber) {
      toast("Table Number is required", "error")
      return
    }
    setLoading(true)
    try {
      const payload = {
        id: editId,
        branch_id: Number(branchId),
        table_number: tableNumber,
        section,
        capacity: Number(capacity),
        status,
        sort_order: Number(sortOrder)
      }
      const res = await fetch("/api/tables", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to save table")
      toast(`Table ${editId ? "updated" : "created"} successfully`, "success")
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (item: any) => {
    setTableToDelete({ id: item.id, number: item.table_number })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!tableToDelete) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tables?id=${tableToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete table")
      toast("Table deleted successfully", "success")
      setDeleteConfirmOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleResetTables = () => {
    setResetConfirmOpen(true);
  }

  const confirmResetTables = async () => {
    setResetConfirmOpen(false);
    setLoading(true)
    try {
      const res = await fetch('/api/table-sessions/reset', { method: 'POST' })
      if (!res.ok) throw new Error("Gagal mereset status meja")
      toast("Status meja berhasil direset", "success")
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  // --- GRID ACTION HANDLERS ---
  const handleTableClick = async (t: any) => {
    if (isAllBranches) {
      toast("Anda harus masuk sebagai Admin Cabang untuk mengelola pesanan meja.", "error");
      return;
    }
    setActionTable(t)
    setGuestCount(String(t.capacity || 2))
    setCustomerName("")
    setTableNote("")

    const mode = (t.status === "OCCUPIED") ? "view" : "open"
    setPanelMode(mode)

    if (t.status === "OCCUPIED") {
      setSessionDetail(null)
      try {
        const res = await fetch(`/api/table-sessions?branchId=${t.branch_id || currentBranchId}&detail=true`)
        const data = await res.json()
        const s = data.data?.find((s: any) => s.table_id === t.id)
        setSessionDetail(s || null)
      } catch (e) { }
    }
  }

  const handleSetTableStatus = async (newStatus: string) => {
    if (!actionTable) return
    setLoading(true)
    try {
      const payload = {
        id: actionTable.id,
        branch_id: actionTable.branch_id,
        table_number: actionTable.table_number,
        section: actionTable.section,
        capacity: actionTable.capacity,
        status: newStatus,
        sort_order: actionTable.sort_order
      }
      const res = await fetch("/api/tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Gagal mengupdate status meja")
      toast("Status meja berhasil diupdate", "success")
      setActionTable(null)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSession = async () => {
    if (!actionTable) return
    const paxNum = Number(guestCount)
    if (paxNum > 7) {
      toast("Jumlah tamu tidak boleh lebih dari 7", "error")
      return
    }

    if (customerName) localStorage.setItem("pendingCustomerName", customerName);
    if (tableNote) localStorage.setItem("pendingTableNote", tableNote);

    setLoading(true)
    try {
      const res = await fetch("/api/table-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: actionTable.branch_id || currentBranchId,
          tableId: actionTable.id,
          guestCount: Number(guestCount)
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to open session")
      }
      const json = await res.json()
      const sessionData = Array.isArray(json.data) ? json.data[0] : json.data

      localStorage.setItem("activeSessionId", String(sessionData.id))

      router.push("/admin/pos")
    } catch (e: any) {
      toast(e.message, "error")
      setLoading(false)
    }
  }

  const handleAddMoreOrders = async () => {
    if (!actionTable) return
    setLoading(true)
    try {
      const res = await fetch(`/api/table-sessions?branchId=${actionTable.branch_id || currentBranchId}`)
      const json = await res.json()
      const session = json.data?.find((s: any) => s.table_id === actionTable.id)

      if (session) {
        localStorage.setItem("activeSessionId", String(session.id))
        router.push("/admin/pos")
      } else {
        toast("Sesi aktif tidak ditemukan untuk meja ini", "error")
        setLoading(false)
      }
    } catch (e: any) {
      toast(e.message, "error")
      setLoading(false)
    }
  }

  const handleFinishSession = async () => {
    setFinishConfirmOpen(false);
    try {
      setLoading(true);
      const res = await fetch("/api/table-sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionDetail.id, action: "close" })
      });
      if (!res.ok) throw new Error("Gagal menutup sesi");
      toast("Sesi meja berhasil ditutup", "success");
      setActionTable(null);
      setPanelMode(null);
      router.refresh();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const handleViewBill = () => {
    setPaymentModalOpen(true)
  }

  const handlePaySession = async () => {
    if (!actionTable || !sessionDetail) return
    const totalWithTax = Number(sessionDetail.grand_total || 0) * 1.11
    if (paymentMethod === "CASH" && Number(cashAmount) < totalWithTax) {
      toast("Jumlah uang tunai kurang dari total tagihan", "error")
      return
    }

    setLoading(true)
    try {
      if (paymentMethod !== "CASH" && paymentMethods) {
        const methodObj = paymentMethods.find((m: any) => m.code === paymentMethod)
        if (methodObj && methodObj.provider === 'XENDIT') {
          const xenditRes = await fetch("/api/payments/xendit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tableSessionId: sessionDetail.id,
              invoiceCode: `TBL-${sessionDetail.id}-${Date.now()}`,
              amount: totalWithTax,
              methodType: methodObj.type,
              channelCode: methodObj.code.replace('_VA', ''),
              customerPhone: "081234567890", // could ask for this if EWALLET
            })
          })
          
          const xenditData = await xenditRes.json()
          if (!xenditRes.ok) throw new Error(xenditData.error || "Xendit request failed")

          const xr = xenditData.data
          setXenditPaymentId(xr.id)
          
          if (methodObj.type === "QR_CODE") {
            setXenditData({ qrString: xr.actions?.[0]?.url || xr.payment_method?.qr_code?.channel_properties?.qr_string })
            setXenditModalType("QRIS")
            setLoading(false)
            return
          } else if (methodObj.type === "EWALLET") {
            setXenditData({ actions: xr.actions, methodName: methodObj.name })
            setXenditModalType("EWALLET")
            setLoading(false)
            return
          } else if (methodObj.type === "VIRTUAL_ACCOUNT") {
            setXenditData({ 
              accountNumber: xr.payment_method?.virtual_account?.channel_properties?.virtual_account_number,
              methodName: methodObj.name,
              instructions: methodObj.instructions || []
            })
            setXenditModalType("VA")
            setLoading(false)
            return
          }
        }
      }

      // CASH Payment handling
      const res = await fetch("/api/table-sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionDetail.id,
          action: "pay",
          paymentMethod,
          cashAmount: Number(cashAmount)
        })
      })
      
      const jsonResponse = await res.json()
      if (!res.ok) {
        throw new Error(jsonResponse.error || "Gagal memproses pembayaran")
      }
      
      toast("Pembayaran berhasil! Sesi meja telah ditutup.", "success")
      
      const receiptData = {
        invoiceId: `TBL-${sessionDetail.id}`,
        orderType: "DINE_IN",
        tableNumber: actionTable.table_number,
        subtotal: sessionDetail.subtotal || 0,
        taxAmount: sessionDetail.tax_amount || (Number(sessionDetail.grand_total) * 0.11),
        discountAmount: sessionDetail.discount_amount || 0,
        totalAmount: sessionDetail.grand_total || 0,
        paymentMethod: paymentMethod,
        cashAmount: paymentMethod === "CASH" ? Number(cashAmount) : Number(sessionDetail.grand_total || 0),
        items: sessionDetail.items || []
      }

      setLastTransaction(receiptData)
      setPaymentModalOpen(false)
      setActionTable(null)
      setPanelMode(null)
      setCashAmount("")
      setPaymentMethod("CASH")
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    const el = document.getElementById("receipt-print-area")
    if (!el) return
    try {
      const canvas = await html2canvas(el, { scale: 2 })
      const imgData = canvas.toDataURL("image/png")
      
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, Math.max(100, pdfHeight)] 
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Receipt-${lastTransaction?.invoiceId || 'TBL'}.pdf`)
    } catch (e) {
      toast("Failed to generate PDF", "error")
    }
  }

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    ...(isAllBranches ? [{ header: "Branch", accessorKey: "branch_name" as const }] : []),
    { header: "Table #", accessorKey: "table_number" as const },
    { header: "Section", accessorKey: "section" as const },
    { header: "Capacity", accessorKey: "capacity" as const },
    { header: "Sort", accessorKey: "sort_order" as const },
    {
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.status === "AVAILABLE" ? "success" : item.status === "OCCUPIED" ? "destructive" : "warning"}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEdit(item)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => handleDeleteClick(item)}>
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  return (
    <>
    <div className="print:hidden flex-1 overflow-y-auto font-sans text-foreground -m-3 sm:-m-6 p-4 sm:p-6 bg-background min-h-full">

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">
            Manajemen Meja
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {role === "SUPERADMIN" && (
            <button
              onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-foreground/90 rounded-md hover:bg-background transition-colors font-medium text-xs shadow-sm"
            >
              {viewMode === "grid" ? <><List size={14} /> <span>Manage Data</span></> : <><Grid size={14} /> <span>View Map</span></>}
            </button>
          )}

          {viewMode === "list" && (
            <>
              <button
                onClick={handleResetTables}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors font-medium text-xs shadow-sm disabled:opacity-50"
              >
                Reset Status Meja
              </button>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-xs shadow-sm"
              >
                <Plus size={14} />
                <span>Add Table</span>
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable
          data={initialData}
          columns={columns}
          keyExtractor={item => String(item.id)}
        />
      ) : (
        <>
          {/* STATS & FILTERS ROW */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">

            {/* Status Cards */}
            <div className="flex flex-wrap gap-3">
              <StatCard title="Total" count={stats.total} />
              <StatCard title="Tersedia" count={stats.available} />
              <StatCard title="Dine-in" count={stats.occupied} />
              <StatCard title="Reservasi" count={stats.reserved} />
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-1 flex overflow-x-auto w-full lg:w-auto">
              <FilterTab active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
                Semua
              </FilterTab>
              <FilterTab active={activeFilter === 'available'} onClick={() => setActiveFilter('available')}>
                Tersedia
              </FilterTab>
              <FilterTab active={activeFilter === 'occupied'} onClick={() => setActiveFilter('occupied')}>
                Dine-in
              </FilterTab>
              <FilterTab active={activeFilter === 'reserved'} onClick={() => setActiveFilter('reserved')}>
                Reservasi
              </FilterTab>
            </div>
          </div>

          <div className="space-y-6 pb-10">
            {Object.keys(tablesBySection).length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-muted-foreground/50 ">
                <Coffee size={32} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">Tidak ada meja dengan status tersebut.</p>
              </div>
            ) : (
              Object.entries(tablesBySection).map(([section, tables]) => (
                <div key={section} className="bg-transparent">
                  <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{section}</h2>
                    <span className="text-[10px] font-bold bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                      {tables.length} Meja
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {tables.map(t => {
                      const statusKey = t.status === "AVAILABLE" ? "available" : t.status === "OCCUPIED" ? "occupied" : "reserved"
                      const config = {
                        available: {
                          borderColor: 'border-border',
                          headerBg: 'bg-card',
                          badge: 'bg-muted text-muted-foreground',
                          badgeText: 'Tersedia',
                          buttonClass: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                          buttonText: 'Buka Meja',
                          icon: <CheckCircle2 size={12} />
                        },
                        occupied: {
                          borderColor: 'border-primary/50 shadow-sm',
                          headerBg: 'bg-primary/5',
                          badge: 'bg-primary text-primary-foreground shadow-sm',
                          badgeText: 'Dine-in',
                          buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
                          buttonText: 'Lihat Pesanan',
                          icon: <Users size={12} />
                        },
                        reserved: {
                          borderColor: 'border-amber-400 border-dashed bg-amber-500/10 ',
                          headerBg: 'bg-amber-500/20 ',
                          badge: 'bg-amber-500 text-white shadow-sm',
                          badgeText: 'Reservasi',
                          buttonClass: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20',
                          buttonText: 'Check-in',
                          icon: <CalendarClock size={12} />
                        }
                      }[statusKey]

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleTableClick(t)}
                          className={`cursor-pointer bg-card rounded-xl border-2 transition-all hover:-translate-y-0.5 ${config.borderColor} flex flex-col overflow-hidden`}
                        >
                          {/* Card Header */}
                          <div className={`p-3 ${config.headerBg} border-b border-border/50 flex justify-between items-start`}>
                            <div>
                              <h3 className="text-base font-bold text-foreground leading-none">{t.table_number}</h3>
                              <p className="text-[10px] font-medium text-muted-foreground mt-1">{t.section}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${config.badge}`}>
                                {config.icon}
                                {config.badgeText}
                              </span>
                              <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                <Users size={10} /> max {t.capacity}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-3 flex-1 flex flex-col justify-center min-h-[90px]">
                            {t.status === 'AVAILABLE' && (
                              <div className="text-center text-muted-foreground/50 ">
                                <Coffee size={20} className="mx-auto mb-1.5 opacity-30" />
                                <p className="text-[10px] font-medium">Meja kosong.</p>
                              </div>
                            )}
                            {t.status === 'OCCUPIED' && (
                              <div className="text-center text-muted-foreground">
                                <Receipt size={20} className="mx-auto mb-1.5 opacity-40" />
                                <p className="text-[10px] font-medium">Sedang terisi (Open Bill)</p>
                              </div>
                            )}
                            {t.status === 'RESERVED' && (
                              <div className="text-center text-amber-600">
                                <Calendar size={20} className="mx-auto mb-1.5 opacity-60" />
                                <p className="text-[10px] font-bold">Sudah dipesan</p>
                              </div>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div className="p-3 pt-0 mt-auto">
                            <button className={`w-full py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${config.buttonClass}`}>
                              {config.buttonText}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* DIALOG ADD/EDIT */}
      <Dialog open={open} onOpenChange={setOpen} className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Table" : "Add Table"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 overflow-y-auto px-2 -mx-2 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Table Number <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. T-01, V-12" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Section</Label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Smoking">Smoking</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Capacity (Pax)</Label>
              <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="bg-slate-600 hover:bg-primary/90 text-white border-0 font-medium px-6"
          >
            Cancel
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={loading || !tableNumber}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* OVERLAY SIDE PANEL (GRID VIEW) */}
      {actionTable && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-[2px]">
          {/* Area kosong untuk klik tutup */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => { setActionTable(null); setPanelMode(null); }}></div>

          {/* Side Panel Content */}
          <div className="w-[380px] sm:w-[420px] h-full bg-card shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-border relative">

            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-background shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">Meja {actionTable.table_number}</h2>
                <p className="text-xs text-muted-foreground font-medium">{actionTable.section} • {panelMode === 'open' ? 'Buka Meja Baru' : 'Detail Pesanan'}</p>
              </div>
              <button onClick={() => { setActionTable(null); setPanelMode(null); }} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">

              {/* --- FORM BUKA MEJA --- */}
              {panelMode === 'open' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-foreground/90 mb-2 tracking-wider">Jumlah Tamu (Pax) - Maksimal 7</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuestCount(String(Math.max(1, Number(guestCount) - 1)))}
                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors bg-background"
                      >
                        <Minus size={16} />
                      </button>
                      <div className="flex-1 h-10 rounded-lg border border-border flex items-center justify-center font-bold text-lg text-foreground">
                        {guestCount}
                      </div>
                      <button
                        onClick={() => {
                          const val = Number(guestCount) + 1;
                          if (val <= 7) setGuestCount(String(val));
                        }}
                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors bg-background"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">Kapasitas maksimal meja ini: {actionTable.capacity} orang</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/90 mb-2 tracking-wider">Nama Pelanggan (Opsional)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama tamu..."
                      className="w-full bg-card px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:border-primary focus:border-primary focus:ring-1 focus:ring-primary focus:ring-primary text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/90 mb-2 tracking-wider">Catatan Meja</label>
                    <textarea
                      rows={3}
                      value={tableNote}
                      onChange={e => setTableNote(e.target.value)}
                      placeholder="Catatan (contoh: minta kursi bayi)..."
                      className="w-full bg-card px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-primary focus:border-primary focus:ring-1 focus:ring-primary focus:ring-primary text-sm transition-all resize-none"
                    />
                  </div>

                  {actionTable.status === "RESERVED" && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3 mt-4">
                      <p className="text-[12px] text-amber-800 font-medium leading-tight">Meja ini sedang dipesan (Reserved).</p>
                      <Button variant="outline" size="sm" className="ml-auto text-[10px] h-6 px-2" onClick={() => handleSetTableStatus("AVAILABLE")} disabled={loading}>Batal Reservasi</Button>
                    </div>
                  )}
                  {actionTable.status === "AVAILABLE" && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <Button variant="outline" className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 font-bold" onClick={() => handleSetTableStatus("RESERVED")} disabled={loading}>
                        Tandai Reservasi
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* --- DETAIL PESANAN --- */}
              {panelMode === 'view' && (
                <div className="space-y-6">
                  {!sessionDetail ? (
                    <div className="py-10 flex justify-center text-muted-foreground/50 ">Loading detail pesanan...</div>
                  ) : (
                    <>
                      {/* Info Transaksi */}
                      <div className="bg-background p-4 rounded-xl border border-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Nomor Pesanan</span>
                          <span className="text-sm font-bold text-foreground">#{sessionDetail.id?.toString().padStart(4, '0') || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Waktu Kedatangan</span>
                          <span className="text-sm font-medium text-foreground/90">{Math.floor(sessionDetail.duration_minutes || 0)} menit lalu</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Jumlah Tamu</span>
                          <span className="text-sm font-medium text-foreground/90">{sessionDetail.guest_count} Orang</span>
                        </div>
                      </div>

                      {/* List Menu */}
                      <div>
                        <h3 className="text-xs font-bold text-foreground/90 mb-3 uppercase tracking-wider border-b border-border pb-2">Daftar Pesanan</h3>
                        <div className="space-y-3">
                          {sessionDetail.items?.length > 0 ? sessionDetail.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-start gap-3">
                              <div className="flex items-start gap-3">
                                <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded text-xs min-w-[2rem] text-center">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <p className="font-medium text-foreground text-sm leading-tight">{item.product_name}</p>
                                </div>
                              </div>
                              <span className="font-semibold text-foreground/90 text-sm whitespace-nowrap">
                                Rp {Number(item.subtotal).toLocaleString('id-ID')}
                              </span>
                            </div>
                          )) : (
                            <p className="text-xs text-muted-foreground/50 text-center py-4">Belum ada pesanan.</p>
                          )}
                        </div>
                        <button onClick={handleAddMoreOrders} disabled={loading} className="w-full mt-4 py-2 border-2 border-dashed border-border rounded-lg text-xs font-bold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2">
                          <Plus size={14} /> Tambah Menu Lain
                        </button>
                      </div>

                      {/* Total Tagihan */}
                      <div className="pt-4 border-t border-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Subtotal</span>
                          <span className="text-sm font-medium text-foreground/90">Rp {Number(sessionDetail.grand_total || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">PB1 (11%)</span>
                          <span className="text-sm font-medium text-foreground/90">Rp {(Number(sessionDetail.grand_total || 0) * 0.11).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/50 mt-2">
                          <span className="text-sm font-bold text-foreground">Total Tagihan</span>
                          <span className="text-lg font-black text-foreground">Rp {(Number(sessionDetail.grand_total || 0) * 1.11).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Panel Footer / Actions */}
            <div className="p-5 border-t border-border bg-card shrink-0">
              {panelMode === 'open' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setActionTable(null); setPanelMode(null); }}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground font-bold text-sm hover:bg-background transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleOpenSession}
                    disabled={loading}
                    className="flex-[2] py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Proses..." : "Mulai Pesanan"} <Plus size={16} />
                  </button>
                </div>
              )}

              {panelMode === 'view' && sessionDetail && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => toast("Cetak Bill diproses", "info")} className="flex-1 py-2.5 rounded-lg border border-border text-foreground/90 font-bold text-xs hover:bg-background transition-colors flex items-center justify-center gap-1.5">
                      <Printer size={14} /> Cetak Bill
                    </button>
                    <button
                      onClick={() => setFinishConfirmOpen(true)}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-bold text-xs hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Tandai Selesai
                    </button>
                  </div>
                  <button
                    onClick={handleViewBill}
                    disabled={loading || !isKitchenReady}
                    className={`w-full py-3 rounded-lg font-bold text-sm shadow-sm flex justify-center items-center gap-2 mt-1 transition-colors ${!isKitchenReady ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    <CreditCard size={16} /> Lanjut Pembayaran
                  </button>
                  {!isKitchenReady && (
                    <p className="text-[10px] text-amber-500 font-medium text-center mt-1">
                      Pembayaran tidak dapat diproses karena ada pesanan yang belum selesai di dapur (Kitchen).
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        type="danger"
        title="Delete Table"
        message={<>Are you sure you want to delete table <span className="font-bold text-white">{tableToDelete?.number}</span>?</>}
        confirmText={loading ? "Deleting..." : "Delete"}
      />

      <ConfirmationModal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={confirmResetTables}
        type="warning"
        title="Reset Status Meja"
        message="Reset semua status meja menjadi Available?"
        confirmText="Ya, Reset"
      />

      <ConfirmationModal
        isOpen={finishConfirmOpen}
        onClose={() => setFinishConfirmOpen(false)}
        onConfirm={handleFinishSession}
        type="warning"
        title="Tandai Selesai"
        message={<>Apakah Anda yakin ingin menyelesaikan sesi ini? <br /> <span className="font-bold text-white">{actionTable?.table_number}</span></>}
        confirmText={loading ? "Proses..." : "Ya, Selesai"}
      />

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setPaymentModalOpen(false)}></div>

          <div className="relative w-full max-w-md bg-background border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95vh]">
            <div className="bg-primary px-5 py-3.5 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-primary-foreground">Pembayaran Meja {actionTable?.table_number}</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="text-primary-foreground/80 hover:text-white rounded-full p-1 hover:bg-primary-foreground/20 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Order Summary */}
              <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">Rp {Number(sessionDetail?.grand_total || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">PB1 (11%)</span>
                  <span className="text-sm font-medium">Rp {(Number(sessionDetail?.grand_total || 0) * 0.11).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-foreground">Total Tagihan</span>
                  <span className="text-xl font-black text-primary">Rp {(Number(sessionDetail?.grand_total || 0) * 1.11).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Metode Pembayaran</label>
                {paymentMethods && paymentMethods.length > 0 ? (
                  <PaymentMethodPicker
                    methods={paymentMethods}
                    selected={paymentMethod}
                    onChange={(code) => setPaymentMethod(code as any)}
                  />
                ) : (
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-card px-3 py-2.5 rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm font-bold shadow-sm cursor-pointer"
                  >
                    <option value="CASH">CASH</option>
                  </select>
                )}
              </div>

              {/* Cash Input */}
              {paymentMethod === 'CASH' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Uang Diterima</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
                    <input
                      type="text"
                      value={cashAmount ? Number(cashAmount).toLocaleString('id-ID') : ''}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setCashAmount(raw);
                      }}
                      placeholder="0"
                      className="w-full bg-card pl-9 pr-3 py-2.5 rounded-lg border border-border focus:border-primary focus:outline-none text-lg font-bold shadow-sm"
                    />
                  </div>

                  {/* Quick Money Buttons */}
                  <div className="flex gap-2 mt-2.5">
                    {[10000, 20000, 50000, 100000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCashAmount(String(amount))}
                        className="flex-1 py-1.5 rounded-md border border-border bg-card text-[11px] font-bold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {amount / 1000}k
                      </button>
                    ))}
                    <button
                      onClick={() => setCashAmount(String(Math.ceil((Number(sessionDetail?.grand_total || 0) * 1.11))))}
                      className="flex-[1.5] py-1.5 rounded-md border border-border bg-card text-[11px] font-bold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      Uang Pas
                    </button>
                  </div>

                  {Number(cashAmount) > 0 && (
                    <div className="mt-3 p-2.5 bg-secondary rounded-lg flex justify-between items-center border border-border">
                      <span className="text-xs font-bold text-muted-foreground">Kembalian</span>
                      <span className="text-base font-black text-foreground">
                        Rp {Math.max(0, Number(cashAmount) - (Number(sessionDetail?.grand_total || 0) * 1.11)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-card flex gap-3 shrink-0">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-bold hover:bg-muted transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={handlePaySession}
                disabled={loading || !paymentMethod || (paymentMethod === 'CASH' && Number(cashAmount) < (Number(sessionDetail?.grand_total || 0) * 1.11))}
                className="flex-[2] py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT SUCCESS MODAL */}
      <Dialog open={!!lastTransaction} onOpenChange={(open) => {
        if (!open) setLastTransaction(null)
      }}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-emerald-600 flex flex-col items-center gap-2 mt-4">
            <CheckCircle2 size={48} />
            Pembayaran Berhasil!
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6">
          <p className="text-sm text-muted-foreground mb-1">Kembalian (Change)</p>
          <p className="text-4xl font-black text-foreground">
            {lastTransaction && formatMoney(Math.max(0, lastTransaction.cashAmount - lastTransaction.totalAmount))}
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button 
            variant="outline" 
            className="w-full gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            onClick={handleDownloadPDF}
          >
            <FileText size={16} /> Download PDF
          </Button>
          <Button 
            variant="outline" 
            className="w-full gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print Receipt
          </Button>
          <Button 
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setLastTransaction(null)}
          >
            <Check size={16} /> Selesai
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Xendit Modals */}
      <XenditQrisModal
        open={xenditModalType === "QRIS"}
        onOpenChange={(o) => { if (!o) setXenditModalType(null) }}
        paymentRequestId={xenditPaymentId}
        qrString={xenditData?.qrString}
        amount={Number(sessionDetail?.grand_total || 0) * 1.11}
        onSuccess={() => {
          setXenditModalType(null)
          const receiptData = {
            invoiceId: `TBL-${sessionDetail?.id || Date.now()}`,
            orderType: "DINE_IN",
            tableNumber: actionTable?.table_number,
            subtotal: sessionDetail?.subtotal || 0,
            taxAmount: sessionDetail?.tax_amount || (Number(sessionDetail?.grand_total) * 0.11),
            discountAmount: sessionDetail?.discount_amount || 0,
            totalAmount: Number(sessionDetail?.grand_total || 0) * 1.11,
            paymentMethod: paymentMethod,
            cashAmount: Number(sessionDetail?.grand_total || 0) * 1.11,
            items: sessionDetail?.items || []
          }
          setLastTransaction(receiptData)
          setPaymentModalOpen(false)
          setActionTable(null)
          setPanelMode(null)
          setCashAmount("")
          setPaymentMethod("CASH")
          router.refresh()
        }}
        onCancel={() => setXenditModalType(null)}
      />

      <XenditEwalletModal
        open={xenditModalType === "EWALLET"}
        onOpenChange={(o) => { if (!o) setXenditModalType(null) }}
        paymentRequestId={xenditPaymentId}
        actions={xenditData?.actions}
        amount={Number(sessionDetail?.grand_total || 0) * 1.11}
        methodName={xenditData?.methodName || "E-Wallet"}
        onSuccess={() => {
          setXenditModalType(null)
          const receiptData = {
            invoiceId: `TBL-${sessionDetail?.id || Date.now()}`,
            orderType: "DINE_IN",
            tableNumber: actionTable?.table_number,
            subtotal: sessionDetail?.subtotal || 0,
            taxAmount: sessionDetail?.tax_amount || (Number(sessionDetail?.grand_total) * 0.11),
            discountAmount: sessionDetail?.discount_amount || 0,
            totalAmount: Number(sessionDetail?.grand_total || 0) * 1.11,
            paymentMethod: paymentMethod,
            cashAmount: Number(sessionDetail?.grand_total || 0) * 1.11,
            items: sessionDetail?.items || []
          }
          setLastTransaction(receiptData)
          setPaymentModalOpen(false)
          setActionTable(null)
          setPanelMode(null)
          setCashAmount("")
          setPaymentMethod("CASH")
          router.refresh()
        }}
        onCancel={() => setXenditModalType(null)}
      />

      <XenditVaModal
        open={xenditModalType === "VA"}
        onOpenChange={(o) => { if (!o) setXenditModalType(null) }}
        paymentRequestId={xenditPaymentId}
        accountNumber={xenditData?.accountNumber}
        amount={Number(sessionDetail?.grand_total || 0) * 1.11}
        methodName={xenditData?.methodName || "Virtual Account"}
        instructions={xenditData?.instructions || []}
        onSuccess={() => {
          setXenditModalType(null)
          const receiptData = {
            invoiceId: `TBL-${sessionDetail?.id || Date.now()}`,
            orderType: "DINE_IN",
            tableNumber: actionTable?.table_number,
            subtotal: sessionDetail?.subtotal || 0,
            taxAmount: sessionDetail?.tax_amount || (Number(sessionDetail?.grand_total) * 0.11),
            discountAmount: sessionDetail?.discount_amount || 0,
            totalAmount: Number(sessionDetail?.grand_total || 0) * 1.11,
            paymentMethod: paymentMethod,
            cashAmount: Number(sessionDetail?.grand_total || 0) * 1.11,
            items: sessionDetail?.items || []
          }
          setLastTransaction(receiptData)
          setPaymentModalOpen(false)
          setActionTable(null)
          setPanelMode(null)
          setCashAmount("")
          setPaymentMethod("CASH")
          router.refresh()
        }}
        onCancel={() => setXenditModalType(null)}
      />

    </div>

    {/* RECEIPT PRINT AREA */}
    <ReceiptPrint 
      transaction={lastTransaction} 
      branchName={branchName} 
      cashierName="Admin" 
      receiptId="receipt-print-area" 
    />
    </>
  )
}
