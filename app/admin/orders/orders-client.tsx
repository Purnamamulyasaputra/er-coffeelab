"use client"

import * as React from "react"
import { RefreshCw, Volume2, Pencil, Trash2, X, Clock, MapPin, Phone, User, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

function formatMoney(amount: number) {
  return "IDR " + amount.toLocaleString("id-ID")
}

const STATUS_OPTIONS = ["PENDING", "PROCESSING", "READY", "COMPLETED", "CANCELLED", "REFUNDED"]

function OrderDetailDrawer({ orderId, onClose, onStatusUpdate }: { orderId: string | null, onClose: () => void, onStatusUpdate: () => void }) {
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
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-bold text-lg">Order #{orderId}</h2>
                {details && <p className="text-sm text-muted-foreground">{details.order_mode} • {details.order_source}</p>}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loading || !details ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading details...</div>
              ) : (
                <div className="space-y-6">
                  {/* Status Control */}
                  <div className="bg-sidebar-hover-bg/50 p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground mb-1">CURRENT STATUS</div>
                      <div className="font-extrabold text-brand-blue">{details.status}</div>
                    </div>
                    <select 
                      className="bg-card border border-input rounded-md px-2 py-1 text-sm font-medium outline-none cursor-pointer disabled:opacity-50"
                      value={details.status}
                      disabled={updating}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold tracking-widest text-muted-foreground uppercase">Customer</h3>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm border border-border/50">
                      <div className="flex items-center gap-2"><User size={14} className="text-brand-blue" /> <span className="font-medium">{details.customer_name || 'Walk-in'}</span></div>
                      {details.customer_phone && <div className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground" /> <span>{details.customer_phone}</span></div>}
                      {details.table_number && <div className="flex items-center gap-2"><MapPin size={14} className="text-success" /> <span>Table {details.table_number}</span></div>}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold tracking-widest text-muted-foreground uppercase">Order Items ({details.items?.length || 0})</h3>
                    <div className="space-y-3">
                      {details.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <span className="font-bold mr-2">{item.quantity}x</span>
                            <span className="font-medium">{item.product_name}</span>
                            {item.notes && <div className="text-xs text-muted-foreground mt-0.5 ml-6">Note: {item.notes}</div>}
                          </div>
                          <span className="font-semibold">{formatMoney(Number(item.subtotal))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 mt-3 border-t border-border flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatMoney(Number(details.total_amount))}</span>
                    </div>
                  </div>

                  {/* Status Logs Timeline */}
                  <div className="space-y-2 pb-6">
                    <h3 className="text-xs font-extrabold tracking-widest text-muted-foreground uppercase">Status History</h3>
                    <div className="relative pl-4 border-l-2 border-border space-y-4 py-2">
                      {details.logs?.map((log: any, idx: number) => {
                        const isLast = idx === details.logs.length - 1;
                        return (
                          <div key={log.id} className="relative">
                            <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full ${isLast ? 'bg-brand-blue ring-4 ring-brand-blue/20' : 'bg-muted-foreground'}`} />
                            <div className="text-sm font-bold">{log.status}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock size={12} />
                              {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              {' • '}{log.actor_type}
                            </div>
                            {log.notes && <div className="text-xs text-muted-foreground mt-1 italic">{log.notes}</div>}
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

export function OrdersClient({ initialData }: { initialData: any[] }) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null)

  const columns = [
    { header: "Invoice", accessorKey: "id" as const },
    { 
      header: "Mode", 
      cell: (item: any) => {
        let color = "bg-primary/20 text-primary" // PICKUP
        if (item.mode === "DELIVERY") color = "bg-brand-blue/20 text-brand-blue"
        if (item.mode === "DINE_IN") color = "bg-success/20 text-success"
        if (item.mode === "POS") color = "bg-cyan-500/20 text-cyan-500"
        
        return <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${color}`}>{item.mode}</span>
      }
    },
    { 
      header: "Src", 
      cell: (item: any) => {
        let color = item.src === "POS" ? "bg-cyan-500/20 text-cyan-500" : "bg-primary/20 text-primary"
        return <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${color}`}>{item.src}</span>
      }
    },
    { 
      header: "Status", 
      cell: (item: any) => {
        let color = "bg-secondary/50 text-muted-foreground" // COMPLETED
        if (item.status === "PAID") color = "bg-warning/20 text-warning"
        if (item.status === "PENDING" || item.status === "NEW") color = "bg-muted text-foreground"
        if (item.status === "PROCESSING") color = "bg-cyan-500/20 text-cyan-500"
        if (item.status === "READY") color = "bg-success/20 text-success"
        if (item.status === "CANCELLED") color = "bg-destructive/20 text-destructive"
        
        return <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase ${color}`}>{item.status}</span>
      }
    },
    { header: "Branch", accessorKey: "br" as const },
    { header: "Items", accessorKey: "n" as const },
    { header: "Total", cell: (item: any) => formatMoney(Number(item.tot)) },
    { header: "Time", accessorKey: "tm" as const },
    { header: "Customer", accessorKey: "cu" as const },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-2">
          <Button 
            size="icon"
            onClick={() => setSelectedOrderId(item.id)} 
            className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"
            title="View Details & History"
          >
            <Pencil size={14} />
          </Button>
          <Button 
            size="icon"
            onClick={() => {
              if (confirm("Are you sure you want to delete order #" + item.id + "?")) {
                fetch(`/api/orders/${item.id}`, { method: 'DELETE' })
                  .then(r => r.ok ? router.refresh() : toast("Failed to delete order", "error"));
              }
            }} 
            className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"
            title="Delete Order"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader 
        title="Orders" 
        description="Real-time order queue" 
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

      <DataTable 
        data={initialData}
        columns={columns}
        keyExtractor={item => item.id}
      />

      <OrderDetailDrawer 
        orderId={selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
        onStatusUpdate={() => router.refresh()}
      />
    </div>
  )
}
