"use client"

import * as React from "react"
import { Users, Clock, Receipt, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function PosTablesClient({ branchId }: { branchId: number }) {
  const { toast } = useToast()
  const router = useRouter()

  const { data: tablesData, mutate: mutateTables } = useSWR(`/api/tables?branchId=${branchId}`, fetcher)
  const tables = tablesData?.data || []

  const [openModal, setOpenModal] = React.useState(false)
  const [billModal, setBillModal] = React.useState(false)

  const [selectedTable, setSelectedTable] = React.useState<any>(null)
  const [guestCount, setGuestCount] = React.useState("1")
  const [sessionDetail, setSessionDetail] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  // Smart Warning Dialog State
  const [smartWarningOpen, setSmartWarningOpen] = React.useState(false)
  const [unservedCount, setUnservedCount] = React.useState(0)

  // Payment Confirm Dialog State
  const [paymentConfirmOpen, setPaymentConfirmOpen] = React.useState(false)

  // Status Change Dialog State
  const [statusConfirmOpen, setStatusConfirmOpen] = React.useState(false)
  const [statusConfirmTable, setStatusConfirmTable] = React.useState<any>(null)

  const handleTableClick = async (table: any) => {
    setSelectedTable(table)
    if (table.status === "AVAILABLE") {
      setGuestCount("1")
      setOpenModal(true)
    } else if (table.status === "OCCUPIED" && table.current_session_id) {
      setLoading(true)
      try {
        const res = await fetch(`/api/table-sessions/${table.current_session_id}`)
        const json = await res.json()
        if (res.ok) {
          setSessionDetail(json.data)
          setBillModal(true)
        } else {
          toast(json.error || "Failed to load session", "error")
        }
      } catch (err) {
        toast("Network error", "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleOpenSession = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/table-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          tableId: selectedTable.id,
          guestCount: parseInt(guestCount) || 1
        })
      })
      const json = await res.json()
      if (res.ok) {
        toast("Meja berhasil dibuka", "success")
        setOpenModal(false)
        mutateTables()

        // Optionally auto-redirect to POS
        localStorage.setItem('activeSessionId', json.data.id)
        localStorage.setItem('activeTableNumber', selectedTable.table_number)
        router.push("/pos")
      } else {
        toast(json.error || "Gagal membuka meja", "error")
      }
    } catch (err) {
      toast("Error membuka meja", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddOrder = () => {
    localStorage.setItem('activeSessionId', sessionDetail.id)
    localStorage.setItem('activeTableNumber', selectedTable.table_number)
    router.push("/pos")
  }

  const handlePayBill = async (skipWarning = false, confirmedPayment = false) => {
    // Smart Warning for unserved orders
    if (!skipWarning) {
      const count = sessionDetail?.orders?.filter((o: any) =>
        ['NEW', 'PENDING', 'PROCESSING'].includes(o.status)
      ).length || 0;

      if (count > 0) {
        setUnservedCount(count);
        setSmartWarningOpen(true);
        return;
      }
    }

    if (!confirmedPayment) {
      setPaymentConfirmOpen(true);
      return;
    }

    setLoading(true)
    try {
      // Logic for closing bill directly or routing to payment
      const res = await fetch(`/api/table-sessions/${sessionDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' })
      })
      if (res.ok) {
        toast("Tagihan dibayar, meja ditutup", "success")
        setBillModal(false)
        mutateTables()
      } else {
        toast("Gagal memproses pembayaran", "error")
      }
    } catch (err) {
      toast("Error", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (tableId: number, newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status: newStatus })
      })
      if (res.ok) {
        toast(`Status meja diubah menjadi ${newStatus}`, "success")
        setOpenModal(false)
        mutateTables()
      } else {
        toast("Gagal mengubah status meja", "error")
      }
    } catch (err) {
      toast("Error mengubah status meja", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full font-sans gap-4">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-extrabold">Manajemen Meja</h2>
        <div className="flex gap-2">
          <Badge className="bg-success/20 text-success border border-success/30 py-1 px-3">
            Tersedia: {tables.filter((t: any) => t.status === "AVAILABLE").length}
          </Badge>
          <Badge className="bg-destructive/20 text-destructive border border-destructive/30 py-1 px-3">
            Terisi: {tables.filter((t: any) => t.status === "OCCUPIED").length}
          </Badge>
          <Badge className="bg-warning/20 text-warning border border-warning/30 py-1 px-3">
            Reserved: {tables.filter((t: any) => t.status === "RESERVED").length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto min-h-0 pb-4 pr-2">
        {tables.map((table: any) => (
          <Card
            key={table.id}
            onClick={() => {
              if (table.status === 'AVAILABLE') handleTableClick(table);
              else if (table.status === 'OCCUPIED') handleTableClick(table);
              else {
                // For RESERVED or OUT OF SERVICE, ask to make AVAILABLE
                setStatusConfirmTable(table);
                setStatusConfirmOpen(true);
              }
            }}
            className={`cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex flex-col p-3 border-2 min-h-[120px] ${table.status === 'AVAILABLE' ? 'bg-[#1c1f3a]/50 border-success/30 hover:border-success/60' :
              table.status === 'OCCUPIED' ? 'bg-destructive/10 border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' :
                table.status === 'RESERVED' ? 'bg-warning/10 border-warning/50' :
                  'bg-muted/10 border-muted/50'
              }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${table.status === 'AVAILABLE' ? 'bg-success/20 text-success' :
                table.status === 'OCCUPIED' ? 'bg-destructive/20 text-destructive' :
                  table.status === 'RESERVED' ? 'bg-warning/20 text-warning' :
                    'bg-muted/20 text-muted-foreground'
                }`}>
                {table.status}
              </span>
              <span className="text-[10px] text-muted-foreground">{table.section}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-3xl font-black mb-1">{table.table_number}</span>
              {table.status === 'AVAILABLE' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users size={12} /> Kapasitas: {table.capacity}</span>
              )}
              {table.status === 'OCCUPIED' && (
                <span className="text-xs text-destructive flex items-center gap-1 font-bold">
                  <Users size={12} /> {table.guest_count || '?'} Tamu
                </span>
              )}
            </div>
            {table.status === 'OCCUPIED' && table.occupied_since && (
              <div className="text-[10px] text-center text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Clock size={10} />
                Sejak {new Date(table.occupied_since).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modal Buka Meja */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold">Buka Meja {selectedTable?.table_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label>Jumlah Tamu</Label>
                  {selectedTable?.capacity && (
                    <span className="text-xs text-muted-foreground">Maksimal: {selectedTable.capacity} orang</span>
                  )}
                </div>
                <Input
                  type="number"
                  min="1"
                  max={selectedTable?.capacity}
                  value={guestCount}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) {
                      setGuestCount(e.target.value);
                      return;
                    }
                    if (selectedTable?.capacity && val > selectedTable.capacity) {
                      setGuestCount(selectedTable.capacity.toString());
                    } else {
                      setGuestCount(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="flex w-full gap-2 mb-2 sm:mb-0">
                <Button variant="outline" className="flex-1 border-warning text-warning hover:bg-warning/10" onClick={() => handleToggleStatus(selectedTable?.id, 'RESERVED')} disabled={loading}>Reserved</Button>
                <Button variant="outline" className="flex-1 border-muted text-muted-foreground hover:bg-muted/10" onClick={() => handleToggleStatus(selectedTable?.id, 'OUT_OF_SERVICE')} disabled={loading}>Tutup</Button>
              </div>
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpenModal(false)}>Batal</Button>
                <Button className="flex-1 bg-brand-blue hover:bg-brand-blue/90" onClick={handleOpenSession} disabled={loading}>
                  Buka Sesi
                </Button>
              </div>
            </DialogFooter>
          </div>
        </div>
      </Dialog>

      {/* Modal Open Bill */}
      <Dialog open={billModal} onOpenChange={setBillModal}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-6 shrink-0 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold">Open Bill - Meja {sessionDetail?.table_number}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Users size={14} /> {sessionDetail?.guest_count} Tamu
                </p>
              </div>
              <Badge className="bg-warning text-warning-foreground capitalize">Belum dibayar</Badge>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {sessionDetail?.orders?.map((order: any, idx: number) => (
                <div key={order.id} className="border border-border/50 rounded-xl p-4 bg-background/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm">Round {idx + 1}</span>
                    <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="space-y-2">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span className="font-medium">Rp {parseInt(item.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {!sessionDetail?.orders?.length && (
                <div className="text-center py-8 text-muted-foreground">Belum ada pesanan di sesi ini.</div>
              )}
            </div>

            <div className="p-6 shrink-0 border-t border-border bg-background/30 rounded-b-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold">Total Tagihan</span>
                <span className="text-2xl font-black text-warning">
                  Rp {sessionDetail?.orders?.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0).toLocaleString('id-ID') || 0}
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setBillModal(false)}>Tutup</Button>
                <Button className="flex-1" variant="outline" onClick={handleAddOrder}>
                  <Plus size={16} className="mr-2" /> Tambah Pesanan
                </Button>
                <Button className="flex-1 bg-success hover:bg-success/90 text-white" onClick={() => handlePayBill(false)} disabled={loading || !sessionDetail?.orders?.length}>
                  <Receipt size={16} className="mr-2" /> Bayar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <ConfirmationModal
        isOpen={smartWarningOpen}
        onClose={() => setSmartWarningOpen(false)}
        onConfirm={() => {
          setSmartWarningOpen(false);
          handlePayBill(true, false);
        }}
        type="warning"
        title="Peringatan Pesanan Belum Selesai"
        message={
          <>
            Masih ada <strong className="text-white">{unservedCount}</strong> pesanan dari meja ini yang belum disajikan dari dapur (berstatus <em>Pending/Processing</em>).<br /><br />
            Apakah Anda yakin ingin melunasi tagihan dan menutup meja ini sekarang?
          </>
        }
        confirmText="Ya, Lunasi Sekarang"
      />

      <ConfirmationModal
        isOpen={paymentConfirmOpen}
        onClose={() => setPaymentConfirmOpen(false)}
        onConfirm={() => {
          setPaymentConfirmOpen(false);
          handlePayBill(true, true);
        }}
        type="success"
        title="Selesaikan Pembayaran?"
        message={`Pesanan untuk Meja ${selectedTable?.table_number || ''} telah selesai. Total tagihan adalah Rp ${sessionDetail?.orders?.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0).toLocaleString('id-ID') || 0}. Lanjutkan ke pembayaran?`}
        confirmText="Proses Pembayaran"
      />

      <ConfirmationModal
        isOpen={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={() => {
          if (statusConfirmTable) {
            handleToggleStatus(statusConfirmTable.id, 'AVAILABLE');
          }
          setStatusConfirmOpen(false);
        }}
        type="warning"
        title="Ubah Status Meja"
        message={`Apakah Anda yakin ingin mengubah status meja ${statusConfirmTable?.table_number} menjadi AVAILABLE?`}
        confirmText="Ya, Ubah Status"
      />
    </div>
  )
}
