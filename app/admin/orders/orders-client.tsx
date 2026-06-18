"use client"

import * as React from "react"
import { RefreshCw, Volume2, Pencil, Trash2, X, Clock, MapPin, Phone, User, CheckCircle2, Monitor, ShoppingBag } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatStatus } from "@/lib/utils"

function formatMoney(amount: number) {
  return "Rp " + Number(amount).toLocaleString("id-ID")
}

const STATUS_OPTIONS = ["NEW", "PENDING", "PAID", "PROCESSING", "READY", "COMPLETED", "CANCELLED"]

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
      setDetails({ ...details, status: newStatus })
      onStatusUpdate() // notify parent to refresh table
    } catch (e) {
      toast("Failed to update status", "error")
    } finally {
      setUpdating(false)
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
      <div className={`fixed right-0 top-0 h-full w-[400px] bg-card shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${orderId ? 'translate-x-0' : 'translate-x-full'}`}>
        {orderId && (
          <>
            <div className="flex items-center justify-between p-4 bg-sidebar-hover-bg/30 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ShoppingBag size={14} className="text-brand-blue dark:text-blue-400" />
                  <h2 className="font-bold text-sm tracking-tight text-foreground">{orderId}</h2>
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
                      {new Date(details.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
                  <div className="bg-sidebar-hover-bg/50 p-2 px-3 rounded-md border border-border flex items-center justify-between">
                    <div className="flex gap-6">
                      <div>
                        <div className="text-[10px] font-bold text-foreground/70">ORDER STATUS</div>
                        <Badge variant={getStatusVariant(details.status)} className="text-[11px] px-2.5 py-0.5 h-5 mt-1">
                          {details.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-foreground/70">PAYMENT</div>
                        <Badge variant={details.paid_at || details.payment_method_code ? 'success' : 'warning'} className="text-[11px] px-2.5 py-0.5 h-5 mt-1 uppercase">
                          {details.paid_at || details.payment_method_code ? 'PAID' : 'PENDING'}
                        </Badge>
                      </div>
                    </div>
                    {role !== "STORE_ADMIN" && (
                      <select
                        className="bg-card border border-input rounded-md flex items-center px-2 py-1 text-xs font-medium outline-none cursor-pointer disabled:opacity-50"
                        value={details.status}
                        disabled={updating}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{formatStatus(s)}</option>
                        ))}
                      </select>
                    )}
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
                      <span>{formatMoney(Number(details.total_amount))}</span>
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
                              {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              {' • '}{log.actor_type}
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
        <span className="font-bold font-mono text-[11px] truncate max-w-[80px] block" title={item.id}>
          {item.id}
        </span>
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
            <Pencil size={11} />
          </Button>
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
        message={<>Are you sure you want to delete order <span className="font-bold text-white">#{orderToDelete?.id}</span>?</>}
        confirmText="Delete Order"
      />
    </div>
  )
}
