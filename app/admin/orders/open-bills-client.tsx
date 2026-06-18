"use client"

import * as React from "react"
import { Clock, Coffee, AlertCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { formatMoney } from "@/lib/utils"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export function OpenBillsClient({ branchId, role }: { branchId?: number, role?: string }) {
  const [sessions, setSessions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [closeConfirmOpen, setCloseConfirmOpen] = React.useState(false)
  const [sessionToClose, setSessionToClose] = React.useState<number | null>(null)
  const { toast } = useToast()

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/open-bills${branchId ? `?branchId=${branchId}` : ''}`)
      const data = await res.json()
      if (data.data) {
        setSessions(data.data)
      }
    } catch (e) {
      toast("Failed to fetch open bills", "error")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 30000) // auto refresh 30s
    return () => clearInterval(interval)
  }, [branchId])

  const handleForceCloseClick = (id: number) => {
    setSessionToClose(id)
    setCloseConfirmOpen(true)
  }

  const handleForceClose = async () => {
    if (!sessionToClose) return
    try {
      const res = await fetch(`/api/table-sessions/${sessionToClose}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'close' })
      })
      if (!res.ok) throw new Error("Gagal menutup")
      toast("Sesi meja ditutup", "success")
      fetchSessions()
    } catch (e) {
      toast("Gagal menutup sesi", "error")
    }
  }

  return (
    <div className="space-y-4 font-sans animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Coffee className="text-brand-blue" />
            Active Dine-In Sessions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Meja yang sedang melayani pelanggan dan pesanan yang belum dibayar.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-card animate-pulse rounded-xl border border-border"></div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center">
          <Coffee size={48} className="text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-1">Tidak ada meja aktif</h3>
          <p className="text-sm text-muted-foreground">Belum ada pelanggan Dine-In atau semua tagihan sudah lunas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {sessions.map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-3 flex flex-col shadow-sm relative overflow-hidden group hover:border-brand-blue/50 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-warning"></div>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xl font-bold text-foreground leading-none mb-1">Table {s.table_number}</div>
                  <div className="text-[10px] text-muted-foreground">{s.section || 'Indoor'} &bull; Kapasitas: {s.capacity} pax</div>
                </div>
                <Badge variant="warning" className="px-1.5 py-0 text-[10px] h-5">Unpaid</Badge>
              </div>

              <div className="flex flex-col gap-1 mb-3 text-[11px] bg-background p-2 rounded-lg border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Clock size={12} /> Duration</span>
                  <span className="font-bold">{Math.floor(s.duration_minutes)} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waktu Mulai</span>
                  <span className="font-bold">{new Date(s.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kasir</span>
                  <span className="font-bold truncate max-w-[120px]">{s.opened_by_name || 'Admin'}</span>
                </div>
                {s.branch_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cabang</span>
                    <span className="font-bold truncate max-w-[120px]">{s.branch_name}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto mb-3 min-h-[80px] pr-2 scrollbar-thin scrollbar-thumb-[#2a2d4a]">
                <div className="text-[10px] font-bold text-muted-foreground mb-1.5">Unpaid Items ({s.order_count} orders)</div>
                {s.items && s.items.length > 0 ? (
                  s.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-[12px] mb-1 pb-1 border-b border-border/50 last:border-0">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-muted-foreground">{item.quantity}x</span>
                        <span className="text-foreground leading-tight">{item.product_name}</span>
                      </div>
                      <span className="font-semibold">{formatMoney(Number(item.subtotal))}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic">Belum ada pesanan terinput...</div>
                )}
              </div>

              <div className="pt-2 border-t border-border mt-auto">
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-xs font-bold text-muted-foreground">Grand Total</span>
                  <span className="text-lg font-black text-warning">{formatMoney(Number(s.grand_total))}</span>
                </div>
                {role !== "STORE_ADMIN" && (
                  <Button 
                    variant="outline" 
                    className="w-full h-8 text-[11px] font-semibold text-destructive border-destructive/20 hover:text-destructive hover:bg-destructive/10 bg-destructive/5"
                    onClick={() => handleForceCloseClick(s.id)}
                  >
                    <AlertCircle size={14} className="mr-1.5" /> Force Close
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal 
        isOpen={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={() => {
          setCloseConfirmOpen(false);
          handleForceClose();
        }}
        type="danger"
        title="Tutup Sesi Paksa?"
        message="Yakin ingin menutup sesi meja ini secara paksa? Tindakan ini akan mengosongkan meja dan membatalkan pesanan yang belum dibayar."
        confirmText="Ya, Tutup Sesi"
      />
    </div>
  )
}
