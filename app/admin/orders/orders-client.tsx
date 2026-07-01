"use client"

import * as React from "react"
import { RefreshCw, Volume2, Pencil, Trash2, X, Clock, MapPin, Phone, User, CheckCircle2, Monitor, ShoppingBag, CreditCard, Ban, Printer, Users, FileText, Check, Eye, Copy, ChefHat } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ReceiptPrint } from "@/components/pos/receipt-print"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatStatus } from "@/lib/utils"
import { XenditQrisModal } from "@/components/pos/xendit-qris-modal"
import { XenditEwalletModal } from "@/components/pos/xendit-ewallet-modal"
import { XenditVaModal } from "@/components/pos/xendit-va-modal"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

function formatMoney(amount: number) {
  return "Rp " + Number(amount).toLocaleString("id-ID")
}

const STATUS_OPTIONS = ["NEW", "PENDING", "PAID", "PROCESSING", "READY", "COMPLETED", "CANCELLED"]

const CANCEL_REASONS = [
  "Pelanggan Berubah Pikiran / Batal",
  "Salah Input Kasir",
  "Bahan Baku / Produk Habis",
  "Pembayaran Gagal / Error",
  "Pesanan Tes / Uji Coba",
  "Lainnya"
]

function getStatusVariant(status: string): any {
  if (status === "NEW") return "default"
  if (status === "PENDING") return "warning"
  if (status === "PAID") return "success"
  if (status === "PROCESSING") return "default"
  if (status === "READY") return "success"
  if (status === "COMPLETED") return "success"
  if (status === "CANCELLED") return "destructive"
  return "default"
}

function getModeVariant(mode: string): any {
  if (mode === "DINE_IN") return "success"
  if (mode === "POS") return "cool"
  return "default"
}

function OrderDetailDrawer({ orderId, onClose, onStatusUpdate, role }: { orderId: string | null, onClose: () => void, onStatusUpdate: () => void, role?: string }) {
  const [details, setDetails] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [updating, setUpdating] = React.useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false)
  const [paymentData, setPaymentData] = React.useState<any>(null)
  const [loadingPayment, setLoadingPayment] = React.useState(false)
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false)
  const [cancelPresetReason, setCancelPresetReason] = React.useState(CANCEL_REASONS[0])
  const [cancelReason, setCancelReason] = React.useState("")
  const [checkoutSuccessModalOpen, setCheckoutSuccessModalOpen] = React.useState(false)
  const [prePaymentModalOpen, setPrePaymentModalOpen] = React.useState(false)
  const [lastTransaction, setLastTransaction] = React.useState<any>(null)
  const { toast } = useToast()

  React.useEffect(() => {
    if (!orderId) return
    setLoading(true)
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(d => {
        setDetails(d.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [orderId])

  const handleUpdateStatus = async (newStatus: string) => {
    if (!details || details.status === newStatus) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error("Failed")

      toast(`Order #${orderId} marked as ${newStatus}`, "success")

      // Update local details optimistically
      setDetails({ ...details, status: newStatus, ...(newStatus === 'PAID' ? { paid_at: new Date().toISOString() } : {}) })
      onStatusUpdate() // notify parent to refresh table
    } catch (e) {
      toast("Failed to update status", "error")
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!details) return
    setUpdating(true)

    const finalReason = cancelPresetReason === "Lainnya" ? cancelReason : cancelPresetReason;

    try {
      const res = await fetch(`/api/orders/${details.invoice_code}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: finalReason })
      })
      if (!res.ok) throw new Error("Gagal membatalkan")
      setDetails({ ...details, status: 'CANCELLED' })
      setCancelModalOpen(false)
      onStatusUpdate()
      toast("Pesanan berhasil dibatalkan", "success")
    } catch (e) {
      toast("Gagal membatalkan pesanan", "error")
    } finally {
      setUpdating(false)
    }
  }

  const handleOpenPaymentModal = async () => {
    if (!details) return
    setLoadingPayment(true)
    try {
      const res = await fetch(`/api/orders/${details.invoice_code}/payment`)
      const data = await res.json()
      setPaymentData(data)
      if (data.type === 'MANUAL') {
        handlePaymentSuccess(data)
      } else {
        setPaymentModalOpen(true)
      }
    } catch (e) {
      toast("Gagal memuat data pembayaran", "error")
    } finally {
      setLoadingPayment(false)
    }
  }

  const handlePaymentSuccess = (dataOverride?: any) => {
    handleUpdateStatus('PAID')
    setPaymentModalOpen(false)

    const pData = dataOverride || paymentData;

    setLastTransaction({
      invoiceId: details.invoice_code,
      orderType: details.order_mode,
      tableNumber: details.table_number,
      items: details.items?.map((i: any) => ({
        productName: i.product_name,
        quantity: i.quantity,
        unitPrice: Number(i.subtotal) / i.quantity,
        subtotal: Number(i.subtotal)
      })) || [],
      subtotal: Number(details.total_amount),
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: Number(details.total_amount),
      cashAmount: Number(details.total_amount),
      paymentMethod: pData?.type || 'ONLINE',
    })

    setCheckoutSuccessModalOpen(true)
    setPaymentData(null)
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
      pdf.save(`Receipt-${lastTransaction?.invoiceId || 'POS'}.pdf`)
    } catch (e) {
      toast("Failed to generate PDF", "error")
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${orderId ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-[320px] bg-card shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${orderId ? 'translate-x-0' : 'translate-x-full'}`}>
        {orderId && (
          <>
            <div className="flex items-center justify-between p-4 bg-sidebar-hover-bg/30 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShoppingBag size={14} className="text-brand-blue dark:text-blue-400" />
                  <div className="flex items-center gap-1">
                    <h2 className="font-bold text-sm tracking-tight text-foreground">{orderId}</h2>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(orderId);
                        toast("Invoice code copied", "success");
                      }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Copy Invoice"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  {details && (
                    <Badge variant={getModeVariant(details.order_mode)} className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider">
                      {formatStatus(details.order_mode)}
                    </Badge>
                  )}
                </div>
                {details && (
                  <div className="flex items-center gap-2 text-[10px] text-foreground/80 font-medium pl-5">
                    <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 text-[9px] dark:bg-muted dark:border-border">
                      <Monitor size={10} className="text-foreground/60" />
                      {formatStatus(details.order_source)}
                    </span>
                    <span className="opacity-50 dark:opacity-100 dark:text-gray-500">•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="dark:text-gray-300" />
                      {new Date(details.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} • {new Date(details.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {loading || !details ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading details...</div>
              ) : (
                <div className="space-y-3">
                  {/* Status Control */}
                  <div className="bg-sidebar-hover-bg/50 p-4 rounded-lg border border-border">
                    <div className={`grid gap-2.5 ${(!details.paid_at && details.status !== 'CANCELLED') ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-2'}`}>
                      {/* Column 1: Order Status */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">Order Status</div>
                        <div className="flex flex-col gap-2 items-start">
                          <Badge variant={getStatusVariant(details.status)} className="text-[11px] px-2.5 py-0.5 h-6">
                            {details.status}
                          </Badge>
                          {details.status === 'PAID' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-[10px] h-7 px-2.5 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white w-full max-w-[120px] justify-start"
                              onClick={() => handleUpdateStatus('PROCESSING')}
                              disabled={updating}
                            >
                              {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ChefHat className="w-3 h-3" />}
                              <span>Proses Pesanan</span>
                            </Button>
                          )}
                          {details.status === 'PROCESSING' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-[10px] h-7 px-2.5 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white w-full max-w-[120px] justify-start"
                              onClick={() => handleUpdateStatus('READY')}
                              disabled={updating}
                            >
                              {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              <span>Pesanan Siap</span>
                            </Button>
                          )}
                          {details.status === 'READY' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-[10px] h-7 px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white w-full max-w-[120px] justify-start"
                              onClick={() => handleUpdateStatus('COMPLETED')}
                              disabled={updating}
                            >
                              {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              <span>Selesaikan</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Payment */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">Payment</div>
                        <Badge
                          variant={details.status === 'CANCELLED' ? 'default' : details.paid_at ? 'success' : 'warning'}
                          className={`text-[11px] px-2.5 py-0.5 h-6 uppercase ${details.status === 'CANCELLED' ? 'bg-muted text-muted-foreground hover:bg-muted' : ''}`}
                        >
                          {details.status === 'CANCELLED' ? 'Canceled' : details.paid_at ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>

                      {/* Column 3: Actions */}
                      {(!details.paid_at && details.status !== 'CANCELLED') && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider text-center">Actions</div>
                          <div className="flex gap-2 justify-end flex-wrap">
                            {details.order_mode === 'DINE_IN' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-[10px] h-7 px-2.5 gap-1.5 opacity-80 cursor-not-allowed"
                                disabled
                                title="Pembayaran Dine-In harus dilakukan dari menu Tables (Manajemen Meja)"
                              >
                                <CreditCard className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Bayar di Meja</span>
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                className="text-[10px] h-7 px-2.5 gap-1.5 bg-blue-950 hover:bg-blue-900 text-white"
                                onClick={handleOpenPaymentModal}
                                disabled={loadingPayment || updating}
                              >
                                {loadingPayment ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CreditCard className="w-3 h-3" />
                                )}
                                <span>Bayar</span>
                              </Button>
                            )}
                            {['PENDING', 'NEW'].includes(details.status) && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-[10px] h-7 px-2.5 gap-1.5"
                                onClick={() => {
                                  setCancelPresetReason(CANCEL_REASONS[0]);
                                  setCancelReason("");
                                  setCancelModalOpen(true);
                                }}
                                disabled={updating}
                              >
                                <Ban className="w-3 h-3" />
                                <span>Batal</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-extrabold tracking-widest text-foreground/60 uppercase">Customer</h3>
                    <div className="bg-muted/50 p-2 rounded-md space-y-1 text-xs border border-border/50 text-foreground">
                      <div className="flex items-center gap-1.5"><User size={12} className="text-brand-blue dark:text-brand-blue-foreground" /> <span className="font-medium">{details.customer_name || 'Walk-in'}</span></div>
                      {details.customer_phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-foreground/70" /> <span>{details.customer_phone}</span></div>}
                      {details.table_number && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-success" /> <span>Table {details.table_number}</span></div>}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-extrabold tracking-widest text-foreground/60 uppercase">Order Items ({details.items?.length || 0})</h3>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {details.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-foreground">
                          <div>
                            <span className="font-bold mr-1.5">{item.quantity}x</span>
                            <span className="font-medium">{item.product_name}</span>
                            {item.notes && <div className="text-[10px] text-foreground/70 mt-0.5 ml-4">Note: {item.notes}</div>}
                          </div>
                          <span className="font-semibold">{formatMoney(Number(item.subtotal))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1.5 mt-1.5 border-t border-border flex justify-between font-bold text-xs text-foreground">
                      <span>Total</span>
                      <span className="mr-1.5">{formatMoney(Number(details.total_amount))}</span>
                    </div>
                  </div>

                  {/* Status Logs Timeline */}
                  <div className="space-y-1 pb-2">
                    <h3 className="text-[10px] font-extrabold tracking-widest text-foreground/60 uppercase">Status History</h3>
                    <div className="relative pl-3 border-l-2 border-border space-y-2.5 py-0.5">
                      {details.logs?.map((log: any, idx: number) => {
                        const isFirst = idx === 0;
                        return (
                          <div key={log.id} className="relative">
                            <div className={`absolute -left-[17px] w-2 h-2 rounded-full ${isFirst ? 'bg-brand-blue ring-4 ring-brand-blue/20 dark:bg-blue-400 dark:ring-blue-400/20' : 'bg-foreground/30'}`} />
                            <div className="mb-0">
                              <Badge variant={getStatusVariant(log.status)} className="text-[9px] px-1.5 py-0 h-3.5">{log.status}</Badge>
                            </div>
                            <div className="text-[11px] text-foreground/80 flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} • {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              {' • '}{log.actor_name ? `${log.actor_name} (${log.actor_role || log.actor_type})` : log.actor_type}
                            </div>
                            {log.notes && <div className="text-[10px] text-foreground/70 mt-0.5 italic leading-tight">{log.notes}</div>}
                          </div>
                        )
                      })}
                      {details.logs?.length === 0 && (
                        <div className="text-xs text-muted-foreground italic">No history logged yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {paymentData && (
        <>
          {paymentData.type === 'QRIS' ? (
            <XenditQrisModal
              open={paymentModalOpen}
              onOpenChange={(o) => { setPaymentModalOpen(o); if (!o) setPaymentData(null) }}
              paymentRequestId={paymentData.paymentRequestId || null}
              qrString={paymentData.qrString || paymentData.paymentRequestId || null}
              amount={paymentData.amount || 0}
              logoUrl={paymentData.logoUrl || undefined}
              onSuccess={handlePaymentSuccess}
              onCancel={() => { setPaymentModalOpen(false); setPaymentData(null) }}
            />
          ) : paymentData.type === 'VA' ? (
            <XenditVaModal
              open={paymentModalOpen}
              onOpenChange={(o) => { setPaymentModalOpen(o); if (!o) setPaymentData(null) }}
              paymentRequestId={paymentData.paymentRequestId || null}
              accountNumber={paymentData.vaNumber || null}
              amount={paymentData.amount || 0}
              methodName={paymentData.methodName || paymentData.methodCode || 'VA'}
              instructions={[]}
              logoUrl={paymentData.logoUrl || undefined}
              onSuccess={handlePaymentSuccess}
              onCancel={() => { setPaymentModalOpen(false); setPaymentData(null) }}
            />
          ) : (
            <XenditEwalletModal
              open={paymentModalOpen}
              onOpenChange={(o) => { setPaymentModalOpen(o); if (!o) setPaymentData(null) }}
              paymentRequestId={paymentData.paymentRequestId || null}
              actions={paymentData.redirectUrl ? [{ url_type: 'WEB', url: paymentData.redirectUrl }] : []}
              amount={paymentData.amount || 0}
              methodName={paymentData.methodName || paymentData.methodCode || 'E-Wallet'}
              channelCode={paymentData.channelCode || paymentData.methodCode || ''}
              logoUrl={paymentData.logoUrl || undefined}
              onSuccess={handlePaymentSuccess}
              onCancel={() => { setPaymentModalOpen(false); setPaymentData(null) }}
            />
          )}
        </>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        type="danger"
        title="Batalkan Pesanan?"
        confirmText={updating ? "Membatalkan..." : "Batalkan"}
        cancelText="Tutup"
        message={
          <div className="text-left mt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Pilih alasan pembatalan pesanan ini:
            </p>
            <select
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mb-3 cursor-pointer"
              value={cancelPresetReason}
              onChange={(e) => setCancelPresetReason(e.target.value)}
              disabled={updating}
            >
              {CANCEL_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {cancelPresetReason === "Lainnya" && (
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Tulis alasan pembatalan..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={updating}
                autoFocus
              />
            )}
          </div>
        }
      />


      {/* Checkout Success Modal */}
      <Dialog open={checkoutSuccessModalOpen} onOpenChange={(open) => {
        if (!open) {
          setCheckoutSuccessModalOpen(false);
          setLastTransaction(null);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogTitle className="text-center text-xl text-primary flex flex-col items-center gap-2 mt-4">
            <CheckCircle2 size={48} className="text-primary" />
            Pembayaran Berhasil!
          </DialogTitle>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              className="w-full gap-2 font-bold"
              onClick={handleDownloadPDF}
            >
              <FileText size={16} /> Download PDF
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 font-bold"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print Receipt
            </Button>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold shadow-md"
              onClick={() => {
                setCheckoutSuccessModalOpen(false)
                setLastTransaction(null)
              }}
            >
              <Check size={16} /> Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Receipt Component for Printing/PDF */}
      <div className="hidden">
        <ReceiptPrint
          transaction={lastTransaction}
          branchName="ER Coffeelab"
          cashierName={role || "Admin"}
          receiptId="receipt-print-area"
        />
      </div>
    </>
  )
}

export function OrdersClient({ initialData, role }: { initialData: any[], role?: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [orderToDelete, setOrderToDelete] = React.useState<any>(null)

  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [data, setData] = React.useState(initialData)

  // Sync with server data
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Auto-refresh every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  // Filter data by status
  const filteredData = React.useMemo(() => {
    if (statusFilter === "ALL") return data
    return data.filter(item => item.status === statusFilter)
  }, [data, statusFilter])

  const columns = [
    {
      header: "Invoice",
      cell: (item: any) => (
        <div className="flex items-center gap-1.5 group">
          <span className="font-bold font-mono text-[11px] truncate max-w-[80px]" title={item.id}>
            {item.id}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(item.id);
              toast("Invoice code copied", "success");
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy Invoice"
          >
            <Copy size={11} />
          </button>
        </div>
      )
    },
    {
      header: "Mode",
      cell: (item: any) => {
        return <Badge variant={getModeVariant(item.mode)}>{item.mode}</Badge>
      }
    },
    {
      header: "Src",
      cell: (item: any) => {
        return <Badge variant="cool">{formatStatus(item.src)}</Badge>
      }
    },
    {
      header: "Status",
      cell: (item: any) => {
        return <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
      }
    },
    {
      header: "Branch",
      cell: (item: any) => (
        <div className="truncate max-w-[100px] block" title={item.br}>
          {item.br?.replace("ER Coffeelab ", "")}
        </div>
      )
    },
    { header: "Table", cell: (item: any) => item.tbl ? `T${item.tbl}` : '-' },
    {
      header: "Cashier",
      cell: (item: any) => (
        <div className="truncate max-w-[90px] block" title={item.emp || '-'}>
          {item.emp || '-'}
        </div>
      )
    },
    { header: "Items", accessorKey: "n" as const },
    { header: "Total", cell: (item: any) => formatMoney(Number(item.tot)) },
    { header: "Time", accessorKey: "tm" as const },
    {
      header: "Customer",
      cell: (item: any) => (
        <div className="truncate max-w-[90px] block" title={item.cu}>
          {item.cu}
        </div>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            onClick={() => setSelectedOrderId(item.id)}
            className="h-[28px] w-[28px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[6px]"
            title="View Details & History"
          >
            <Eye size={11} />
          </Button>
          {(!role || role !== 'EMPLOYEE' || ['PENDING', 'NEW'].includes(item.status)) && (
            <Button
              size="icon"
              onClick={() => {
                setOrderToDelete(item);
                setDeleteConfirmOpen(true);
              }}
              className="h-[28px] w-[28px] bg-destructive hover:bg-destructive/90 text-white rounded-[6px]"
              title="Delete Order"
            >
              <Trash2 size={11} />
            </Button>
          )}
        </div>
      )
    }
  ]

  // Count per status
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: data.length }
    data.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })
    return counts
  }, [data])

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Real-time order queue"
        className="!mb-3"
        action={
          <div className="flex gap-2">
            <button onClick={() => router.refresh()} className="w-8 h-8 flex items-center justify-center rounded-lg border-none bg-muted text-foreground cursor-pointer hover:brightness-110 transition-all">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => toast("Audio alerts enabled", "success")} className="w-8 h-8 flex items-center justify-center rounded-lg border-none bg-primary text-white cursor-pointer hover:brightness-110 transition-all">
              <Volume2 size={14} />
            </button>
          </div>
        }
      />

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {["ALL", ...STATUS_OPTIONS].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${statusFilter === status
              ? 'bg-brand-blue text-white border-brand-blue'
              : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
              }`}
          >
            {formatStatus(status)}
            {statusCounts[status] !== undefined && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{statusCounts[status] || 0}</span>
            )}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        keyExtractor={item => item.id}
        dense={true}
      />

      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusUpdate={() => router.refresh()}
        role={role}
      />

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (!orderToDelete) return;
          fetch(`/api/orders/${orderToDelete.id}`, { method: 'DELETE' })
            .then(r => {
              if (r.ok) {
                toast("Order deleted successfully", "success");
                router.refresh();
              } else {
                toast("Failed to delete order", "error");
              }
            });
          setDeleteConfirmOpen(false);
        }}
        type="danger"
        title="Delete Order"
        message={<>Are you sure you want to delete order <span className="font-bold">#{orderToDelete?.id}</span>?</>}
        confirmText="Delete Order"
      />
    </div>
  )
}