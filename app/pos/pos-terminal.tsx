"use client"

import * as React from "react"
import { Coffee, ShoppingCart, X, Circle, CreditCard, Loader2, Wifi, WifiOff, Check, Clock, Users, Monitor, Package, ClipboardList, UserCheck, RotateCcw, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

function formatMoney(amount: number) {
  return "IDR " + amount.toLocaleString("id-ID")
}

export interface POSProduct {
  id: number;
  name: string;
  price: string | number;
  cat?: string;
  image_url?: string;
}

export interface POSTax {
  tax_name: string;
  tax_rate: string | number;
}

export interface POSSession {
  shiftId?: number;
  branchId?: number;
}

export function POSTerminal({
  initialProducts,
  session,
  isEmbedded = false,
  taxes = []
}: {
  initialProducts: POSProduct[],
  session: POSSession | null,
  isEmbedded?: boolean,
  taxes?: POSTax[]
}) {
  const { toast } = useToast()
  const [posCart, setPosCart] = React.useState<(POSProduct & { quantity: number })[]>([])
  const [checkoutOpen, setCheckoutOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState("CASH")
  const [isOnline, setIsOnline] = React.useState(true)
  const [queueCount, setQueueCount] = React.useState(0)
  const [activeCategory, setActiveCategory] = React.useState("ALL")

  const categories = React.useMemo(() => {
    const cats = new Set(initialProducts.map(p => p.cat).filter(Boolean))
    return ["ALL", ...Array.from(cats)]
  }, [initialProducts])

  const displayedProducts = React.useMemo(() => {
    if (activeCategory === "ALL") return initialProducts
    return initialProducts.filter(p => p.cat === activeCategory)
  }, [initialProducts, activeCategory])

  // Apply dark mode handled by layout.tsx

  // Initialize offline status and queue
  React.useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check queue
    const queue = JSON.parse(localStorage.getItem("pos_offline_queue") || "[]")
    setQueueCount(queue.length)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Background Sync when online
  React.useEffect(() => {
    if (isOnline && queueCount > 0) {
      syncOfflineQueue()
    }
  }, [isOnline, queueCount])

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem("pos_offline_queue") || "[]")
    if (queue.length === 0) return

    toast(`Syncing ${queue.length} offline orders...`, "info")
    let synced = 0

    for (const payload of queue) {
      try {
        const res = await fetch("/api/pos/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        if (res.ok) synced++
      } catch (e) {
        // failed to sync this one, leave it
      }
    }

    const remaining = queue.slice(synced)
    localStorage.setItem("pos_offline_queue", JSON.stringify(remaining))
    setQueueCount(remaining.length)

    if (synced > 0) {
      toast(`Successfully synced ${synced} orders`, "success")
    }
  }

  // Calculate Subtotal (sum of product prices)
  const subtotal = posCart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0)

  // Calculate Taxes dynamically
  let totalTaxAmount = 0
  const taxDetails: { name: string, amount: number }[] = []

  taxes.forEach(t => {
    const rateStr = t.tax_rate.toString().replace('%', '')
    const rate = Number(rateStr) / 100
    const taxAmt = Math.round(subtotal * rate)
    totalTaxAmount += taxAmt
    taxDetails.push({ name: t.tax_name, amount: taxAmt })
  })

  const grandTotal = subtotal + totalTaxAmount
  const shiftInfo = session ? `Shift #${session.shiftId || 1} - Branch ${session.branchId}` : "Shift #1 - Admin"

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const payload = {
        orderType: "DINE_IN",
        subtotal: subtotal,
        taxAmount: totalTaxAmount,
        discountAmount: 0,
        totalAmount: grandTotal,
        paymentMethod: paymentMethod,
        items: posCart.map(c => ({
          productId: c.id,
          productName: c.name,
          quantity: c.quantity || 1,
          unitPrice: Number(c.price),
          subtotal: Number(c.price) * (c.quantity || 1)
        }))
      }

      if (!isOnline) {
        // Save to offline queue
        const queue = JSON.parse(localStorage.getItem("pos_offline_queue") || "[]")
        queue.push({ ...payload, _offline_id: Date.now() })
        localStorage.setItem("pos_offline_queue", JSON.stringify(queue))
        setQueueCount(queue.length)
        toast("Saved offline (Queue +1)", "info")
      } else {
        const res = await fetch("/api/pos/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        if (!res.ok) throw new Error("Failed to checkout")
        toast("Payment Successful", "success")
      }

      setPosCart([])
      setCheckoutOpen(false)
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : "An unknown error occurred"
      toast(errorMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex flex-col font-sans ${!isEmbedded ? 'h-screen bg-background text-foreground p-4 md:p-6' : 'h-[calc(100vh-112px)] w-full'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 shrink-0">
        <div>
          <h2 className="m-0 text-2xl font-extrabold tracking-tight">POS Terminal</h2>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center bg-[#1c1f3a] rounded-full px-3 py-1.5 border border-[#2a2d4a]">
              <span className="w-2 h-2 rounded-full bg-brand-blue mr-2"></span>
              <p className="text-[11px] font-bold text-white">{shiftInfo}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {queueCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-warning/20 text-warning inline-flex items-center gap-1 cursor-pointer" onClick={syncOfflineQueue}>
              {queueCount} QUEUED
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-success/20 text-success inline-flex items-center gap-1">
            <Circle size={8} className="fill-success" strokeWidth={0} /> OPEN
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${isOnline ? 'bg-cyan-500/20 text-cyan-500' : 'bg-destructive/20 text-destructive'}`}>
            {isOnline ? <><Wifi size={10} /> ONLINE</> : <><WifiOff size={10} /> OFFLINE</>}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Products Column */}
        <div className="md:col-span-3 bg-card border border-border rounded-xl p-3 flex flex-col min-h-0">
          
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide shrink-0">
            {categories.map((c: any) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                  activeCategory === c 
                    ? "bg-brand-blue text-brand-blue-foreground dark:bg-primary dark:text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {displayedProducts.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  setPosCart(c => {
                    const existing = c.find(item => item.id === p.id);
                    if (existing) {
                      return c.map(item => item.id === p.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item);
                    }
                    return [...c, { ...p, quantity: 1 }];
                  });
                  toast("Added to cart", "success");
                }}
                className="bg-muted rounded-[10px] p-2 cursor-pointer text-center hover:bg-muted/80 transition-colors"
              >
                <div className="w-full aspect-square rounded-lg bg-primary/10 mb-1 flex items-center justify-center overflow-hidden relative">
                  {p.image_url ? (
                    <>
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <Coffee size={20} className="text-foreground hidden absolute" />
                    </>
                  ) : (
                    <Coffee size={20} className="text-foreground" />
                  )}
                </div>
                <div className="text-[10px] font-bold leading-[1.2] min-h-[24px] text-foreground">{p.name}</div>
                <div className="text-[11px] font-extrabold text-foreground mt-0.5">{formatMoney(Number(p.price))}</div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Cart Column */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-3 flex flex-col min-h-0">
          <div className="text-[13px] font-bold text-foreground mb-1.5 flex items-center gap-1.5">
            <ShoppingCart size={15} /> Cart ({posCart.reduce((acc, c) => acc + (c.quantity || 1), 0)})
          </div>
          <div className="flex-1 overflow-y-auto min-h-[80px]">
            {posCart.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground text-[12px]">Tap products</div>
            ) : (
              posCart.map((c, ci) => (
                <div key={ci} className="flex justify-between items-center py-1.5 border-b border-border">
                  <div>
                    <div className="text-[11px] font-semibold text-foreground"><span className="font-bold mr-1.5">{c.quantity || 1}x</span>{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">{c.cat || "Reg"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-foreground">{formatMoney(Number(c.price) * (c.quantity || 1))}</div>
                    <button
                      onClick={() => {
                        setPosCart(prev => {
                          const existing = prev[ci];
                          if ((existing.quantity || 1) > 1) {
                            return prev.map((item, j) => j === ci ? { ...item, quantity: (item.quantity || 1) - 1 } : item);
                          }
                          return prev.filter((_, j) => j !== ci);
                        });
                        toast("Item removed", "info");
                      }}
                      className="bg-transparent border-none text-destructive cursor-pointer p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border pt-2 mt-1">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {taxDetails.map((td, i) => (
              <div key={i} className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                <span>{td.name}</span>
                <span>{formatMoney(td.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-[15px] font-extrabold text-foreground my-1.5">
              <span>TOTAL</span>
              <span>{formatMoney(grandTotal)}</span>
            </div>
            <button
              onClick={() => {
                if (posCart.length === 0) {
                  toast("Cart is empty", "error");
                  return;
                }
                setCheckoutOpen(true)
              }}
              className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-[13px] hover:brightness-110 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <CreditCard size={15} /> Charge
            </button>
          </div>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogHeader>
          <DialogTitle>Complete Checkout {isOnline ? "" : "(OFFLINE MODE)"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex justify-between text-[18px] font-extrabold">
            <span>Total to Pay:</span>
            <span className="text-foreground">{formatMoney(grandTotal)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground">Payment Method</label>
            <Select
              options={[
                { label: "CASH", value: "CASH" },
                { label: "QRIS", value: "QRIS" },
                { label: "DEBIT CARD", value: "DEBIT_CARD" }
              ]}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setCheckoutOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleCheckout} disabled={loading} className="gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm Payment
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
