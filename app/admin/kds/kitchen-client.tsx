"use client"

import * as React from "react"
import { Clock, CheckCircle2, ChevronRight, RefreshCw, AlertCircle, Coffee, Search } from "lucide-react"

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function getElapsedMinutes(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 60000)
}

export function KitchenClient({ initialData, branchId }: { initialData: any[], branchId?: number }) {
  const [orders, setOrders] = React.useState(initialData)
  const [filter, setFilter] = React.useState("ALL") // ALL, POS, APP
  const [searchQuery, setSearchQuery] = React.useState("")

  // Refresh every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const url = branchId ? `/api/kds?branchId=${branchId}` : `/api/kds`;
        const res = await fetch(url)
        if (res.ok) {
          const result = await res.json()
          setOrders(result.data)
        }
      } catch (e) {}
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Timer refresh every minute for elapsed time colors
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const bumpOrder = async (id: number, currentStatus: string) => {
    let nextStatus = "PROCESSING"
    if (currentStatus === "PROCESSING") nextStatus = "READY"
    if (currentStatus === "READY") nextStatus = "COMPLETED"

    try {
      // Optimistic update
      setOrders(orders.map(o => o.id === id ? { ...o, order_status: nextStatus } : o))
      
      const res = await fetch(`/api/kds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      if (!res.ok) {
        // Revert on error
        const url = branchId ? `/api/kds?branchId=${branchId}` : `/api/kds`;
        const updated = await fetch(url).then(r => r.json())
        setOrders(updated.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredOrders = React.useMemo(() => {
    let res = orders
    if (filter !== "ALL") {
      res = res.filter(o => o.order_source === filter)
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      res = res.filter(o => o.invoice_code?.toLowerCase().includes(q))
    }
    return res
  }, [orders, filter, searchQuery])

  const newOrders = filteredOrders.filter(o => o.order_status === "PENDING" || o.order_status === "PAID")
  const inProgressOrders = filteredOrders.filter(o => o.order_status === "PROCESSING")
  const readyOrders = filteredOrders.filter(o => o.order_status === "READY")

  const TicketCard = ({ order }: { order: any }) => {
    const borderColor = (order.order_status === "PENDING" || order.order_status === "PAID") ? "border-l-[#ef4444]" :
                       order.order_status === "PROCESSING" ? "border-l-[#f59e0b]" : "border-l-[#22c55e]";

    return (
      <div className={`bg-card rounded-xl border-l-[4px] p-4 flex flex-col gap-4 border-y border-r border-border ${borderColor}`}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-foreground font-bold text-lg leading-none mb-1.5">#{order.invoice_code.split('-').pop()}</div>
            <div className="text-muted-foreground text-[12px]">{order.items.length} items - {order.order_mode}</div>
          </div>
          <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
            order.order_source === 'POS' ? 'bg-[#14b8a6]/20 text-[#14b8a6]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'
          }`}>
            {order.order_source}
          </div>
        </div>

        {/* Item List (Kept per user request) */}
        <div className="space-y-2.5">
          {order.customer_name && (
            <div className="text-[11px] text-brand-blue font-bold pb-1.5 border-b border-border/50">
              {order.customer_name}
            </div>
          )}
          {order.items.map((item: any) => (
            <div key={item.id} className="flex gap-2">
              <div className="text-[13px] font-bold text-muted-foreground w-4">{item.quantity}x</div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground leading-tight">{item.product_name}</div>
                {item.notes && <div className="text-[11px] text-[#ef4444] mt-0.5">Note: {item.notes}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={() => bumpOrder(order.id, order.order_status)}
          className="w-full bg-brand-blue hover:bg-brand-blue/80 text-white text-[13px] font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-1"
        >
          BUMP <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent p-6">
      {/* Header Baru */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-1">Kitchen Display</h1>
          <p className="text-[13px] text-muted-foreground font-medium">Live tickets</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Cari Invoice (contoh: INV-123)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#22c55e]/10 rounded-full border border-[#22c55e]/20">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
            <span className="text-[11px] font-bold text-[#22c55e] tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        
        {/* NEW */}
        <div className="flex flex-col overflow-hidden bg-muted/20 rounded-xl border border-border/50 p-4">
          <div className="pb-3 flex items-center gap-2 border-b border-border/50 mb-4">
            <AlertCircle className="text-[#ef4444]" size={18} />
            <h2 className="text-[15px] font-extrabold text-foreground">NEW</h2>
            <span className="text-[11px] font-bold bg-[#ef4444] text-white w-5 h-5 flex items-center justify-center rounded-full leading-none ml-auto">{newOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 pb-4">
            {newOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40">
                <Coffee size={36} className="mb-3" />
                <p className="text-[13px] font-bold">Kosong</p>
                <p className="text-[11px] font-medium mt-1">Belum ada pesanan baru</p>
              </div>
            ) : (
              newOrders.map(o => <TicketCard key={o.id} order={o} />)
            )}
          </div>
        </div>

        {/* IN PROGRESS */}
        <div className="flex flex-col overflow-hidden bg-muted/20 rounded-xl border border-border/50 p-4">
          <div className="pb-3 flex items-center gap-2 border-b border-border/50 mb-4">
            <Clock className="text-[#f59e0b]" size={18} />
            <h2 className="text-[15px] font-extrabold text-foreground">IN PROGRESS</h2>
            <span className="text-[11px] font-bold bg-[#f59e0b] text-white w-5 h-5 flex items-center justify-center rounded-full leading-none ml-auto">{inProgressOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 pb-4">
            {inProgressOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40">
                <RefreshCw size={36} className="mb-3" />
                <p className="text-[13px] font-bold">Kosong</p>
                <p className="text-[11px] font-medium mt-1">Tidak ada pesanan diproses</p>
              </div>
            ) : (
              inProgressOrders.map(o => <TicketCard key={o.id} order={o} />)
            )}
          </div>
        </div>

        {/* READY */}
        <div className="flex flex-col overflow-hidden bg-muted/20 rounded-xl border border-border/50 p-4">
          <div className="pb-3 flex items-center gap-2 border-b border-border/50 mb-4">
            <CheckCircle2 className="text-[#22c55e]" size={18} />
            <h2 className="text-[15px] font-extrabold text-foreground">READY</h2>
            <span className="text-[11px] font-bold bg-[#22c55e] text-white w-5 h-5 flex items-center justify-center rounded-full leading-none ml-auto">{readyOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 pb-4">
            {readyOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40">
                <CheckCircle2 size={36} className="mb-3" />
                <p className="text-[13px] font-bold">Kosong</p>
                <p className="text-[11px] font-medium mt-1">Semua pesanan sudah diambil</p>
              </div>
            ) : (
              readyOrders.map(o => <TicketCard key={o.id} order={o} />)
            )}
          </div>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
      `}} />
    </div>
  )
}
