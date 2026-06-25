"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Coffee, ShoppingCart, X, Circle, CreditCard, Loader2, Wifi, WifiOff, Check, Clock, Users, Monitor, Package, ClipboardList, UserCheck, RotateCcw, FileText, Ticket, Trash2, ChefHat, ShoppingBag, CheckCircle2, Lock, User, Printer } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ReceiptPrint } from "@/components/pos/receipt-print"
import { PaymentMethodPicker } from "@/components/pos/payment-method-picker"
import { XenditQrisModal } from "@/components/pos/xendit-qris-modal"
import { XenditEwalletModal } from "@/components/pos/xendit-ewallet-modal"
import { XenditVaModal } from "@/components/pos/xendit-va-modal"

function formatMoney(amount: number) {
  return "Rp " + Number(amount).toLocaleString("id-ID")
}

export interface POSProduct {
  id: number;
  name: string;
  price: string | number;
  cat?: string;
  image_url?: string;
  stock_status?: string;
  badge?: string;
}

export interface POSTax {
  tax_name: string;
  tax_rate: string | number;
}

export interface POSSession {
  shiftId?: number;
  branchId?: number;
  branchName?: string;
  role?: string;
}

export function POSTerminal({
  initialProducts,
  session,
  isEmbedded = false,
  taxes = [],
  branchSettings,
  branchEmployees,
  activeShifts,
  paymentMethods
}: {
  initialProducts: POSProduct[],
  session: POSSession | null,
  isEmbedded?: boolean,
  taxes?: POSTax[],
  branchSettings?: {
    dineIn: boolean;
    takeAway: boolean;
  },
  branchEmployees?: any[],
  activeShifts?: any[],
  paymentMethods?: any[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [posCart, setPosCart] = React.useState<(POSProduct & { quantity: number })[]>([])
  const [checkoutOpen, setCheckoutOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState("CASH")
  const [cashAmount, setCashAmount] = React.useState("")
  const [isLocked, setIsLocked] = React.useState(session?.role !== 'SUPERADMIN')
  const [pinInput, setPinInput] = React.useState("")
  const [pinError, setPinError] = React.useState("")
  const [cashierName, setCashierName] = React.useState(session?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin Outlet')
  const [activeEmployeeId, setActiveEmployeeId] = React.useState<number | null>(null)
  const [isOnline, setIsOnline] = React.useState(true)
  const [queueCount, setQueueCount] = React.useState(0)
  const [activeCategory, setActiveCategory] = React.useState("ALL")
  const [appliedVoucher, setAppliedVoucher] = React.useState<any | null>(null)

  const [voucherModalOpen, setVoucherModalOpen] = React.useState(false)
  const [customerPhone, setCustomerPhone] = React.useState("")
  const [customerData, setCustomerData] = React.useState<any | null>(null)
  const [voucherCode, setVoucherCode] = React.useState("")
  const [validatingVoucher, setValidatingVoucher] = React.useState(false)
  const [discounts, setDiscounts] = React.useState<any[]>([])
  const [selectedDiscountId, setSelectedDiscountId] = React.useState<number | null>(null)
  const [discountModalOpen, setDiscountModalOpen] = React.useState(false)
  const [orderType, setOrderType] = React.useState<string | null>(null)

  // Session tracking
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null)
  const [activeTableNumber, setActiveTableNumber] = React.useState<string | null>(null)
  const [lastTransaction, setLastTransaction] = React.useState<any>(null)

  // Xendit Modals
  const [xenditModalType, setXenditModalType] = React.useState<"QRIS" | "EWALLET" | "VA" | null>(null)
  const [xenditData, setXenditData] = React.useState<any>(null)
  const [xenditPaymentId, setXenditPaymentId] = React.useState<string | null>(null)

  const [noteModalOpen, setNoteModalOpen] = React.useState(false)
  const [noteItemIndex, setNoteItemIndex] = React.useState<number | null>(null)
  const [noteText, setNoteText] = React.useState("")

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

    // Check for active table session
    const sessionId = localStorage.getItem('activeSessionId')
    const tableNumber = localStorage.getItem('activeTableNumber')
    if (sessionId) {
      setActiveSessionId(sessionId)
      setActiveTableNumber(tableNumber)
      setOrderType("DINE_IN") // Lock to DINE_IN
    }

    // Load pending cart if redirected from tables
    const pendingCart = localStorage.getItem("pendingPosCart")
    if (pendingCart) {
      try {
        setPosCart(JSON.parse(pendingCart))
        localStorage.removeItem("pendingPosCart")
        if (!sessionId) setOrderType("DINE_IN")
      } catch (e) { }
    } else if (!sessionId) {
      // Default order type if not in a session
      if (branchSettings?.takeAway !== false) {
        setOrderType("TAKE_AWAY")
      } else if (branchSettings?.dineIn !== false) {
        setOrderType("DINE_IN")
      }
    }

    // Fetch active discounts
    fetch("/api/discounts/active").then(r => r.json()).then(d => {
      if (d.data) setDiscounts(d.data)
    }).catch(console.error)

    // Check for saved employee login
    const savedEmpId = localStorage.getItem("pos_active_employee_id")
    const savedEmpName = localStorage.getItem("pos_cashier_name")
    if (savedEmpId && savedEmpName && session?.role !== 'SUPERADMIN') {
      const hasActiveShift = activeShifts?.some(s => Number(s.employee_id) === Number(savedEmpId));
      if (hasActiveShift) {
        setActiveEmployeeId(Number(savedEmpId))
        setCashierName(savedEmpName)
        setIsLocked(false)
      } else {
        localStorage.removeItem("pos_active_employee_id")
        localStorage.removeItem("pos_cashier_name")
        setIsLocked(true)
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [session?.role])

  // Handle return from Xendit E-Wallet redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const returnStatus = params.get('status')

    // Only process if we have a pending xendit order in localStorage
    const pendingStr = localStorage.getItem('xendit_pending_order')
    if (!pendingStr) return

    // Clean URL params immediately
    if (params.has('status')) {
      window.history.replaceState({}, '', '/admin/pos')
    }

    const pending = JSON.parse(pendingStr)
    const paymentRequestId = pending.paymentRequestId

    if (!paymentRequestId) return

    localStorage.removeItem('xendit_pending_order')

    const handleXenditReturn = async () => {
      const verify = async () => {
        try {
          const res = await fetch(`/api/payments/xendit/status?paymentRequestId=${paymentRequestId}`)
          const data = await res.json()
          return data.status
        } catch (e) {
          console.error('Status check error', e)
          return null
        }
      }

      let resolvedStatus = returnStatus?.toUpperCase()

      // If Xendit said SUCCEEDED, still verify via API to update DB
      if (resolvedStatus === 'SUCCEEDED') {
        await verify()
      } else if (!resolvedStatus || resolvedStatus === 'CANCELLED') {
        // No status or cancelled — check actual status from Xendit
        resolvedStatus = await verify()
      }

      if (resolvedStatus === 'SUCCEEDED') {
        setLastTransaction({
          invoiceId: pending.invoiceId,
          orderType: pending.orderType,
          items: pending.items,
          subtotal: pending.subtotal,
          totalAmount: pending.totalAmount,
          cashAmount: pending.totalAmount,
          paymentMethod: pending.paymentMethod,
          paymentMethodName: pending.paymentMethodName,
        })
        toast('Pembayaran berhasil!', 'success')
      } else if (resolvedStatus === 'FAILED') {
        toast('Pembayaran gagal. Pesanan dibatalkan.', 'error')
        // Cancel the order in database
        try {
          if (pending.orderId) {
            await fetch(`/api/orders/${pending.orderId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'CANCELLED' })
            })
          }
        } catch (e) { }
      } else {
        toast('Pembayaran dibatalkan oleh pengguna.', 'info')
        // Cancel the order in database
        try {
          if (pending.orderId) {
            await fetch(`/api/orders/${pending.orderId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'CANCELLED' })
            })
          }
        } catch (e) { }
      }
    }

    handleXenditReturn()
  }, [])

  // Lock screen state
  const isSuperAdmin = session?.role === "SUPERADMIN"

  const handlePinSubmit = async () => {
    setLoading(true)
    try {
      // Testing Mode Logic: Check against dynamically assigned test PINs (1000, 1001, etc.)
      // In production, this MUST be an API call to verify bcrypt hashes.
      if (branchEmployees && branchEmployees.length > 0) {
        const matchedEmp = branchEmployees.find((emp, index) => {
          const testPin = String(1001 + index).padStart(4, '0')
          return testPin === pinInput
        })

        if (matchedEmp) {
          const hasOpenShift = activeShifts && activeShifts.some(s => s.employee_id === matchedEmp.id)
          if (!hasOpenShift) {
            setPinError("Anda belum Open Shift. Buka shift di menu Shifts terlebih dahulu.")
            setLoading(false)
            return
          }
          setCashierName(matchedEmp.name)
          setActiveEmployeeId(matchedEmp.id)
          setIsLocked(false)
          setPinError("")
          localStorage.setItem("pos_active_employee_id", matchedEmp.id.toString())
          localStorage.setItem("pos_cashier_name", matchedEmp.name)
          toast(`Shift Opened: Welcome ${matchedEmp.name}`, "success")
          return
        }
      } else if (pinInput === "1234") {
        // Fallback if no employees loaded
        setCashierName("Admin (Fallback)")
        setActiveEmployeeId(null)
        setIsLocked(false)
        setPinError("")
        toast("Shift Opened: Welcome Admin", "success")
        return
      }

      setPinError("Invalid PIN")
    } catch (err) {
      setPinError("Connection error")
    } finally {
      setLoading(false)
      setPinInput("")
    }
  }

  // Background Sync when online
  React.useEffect(() => {
    if (isOnline && queueCount > 0) {
      syncOfflineQueue()
    }
  }, [isOnline, queueCount])

  const handleSearchCustomer = async () => {
    if (!customerPhone) {
      toast("Please enter a phone number", "error")
      return
    }
    setValidatingVoucher(true)
    try {
      const res = await fetch(`/api/customers/by-phone?phone=${customerPhone}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Customer not found")
      setCustomerData(data.data)
    } catch (err: any) {
      toast(err.message, "error")
      setCustomerData(null)
    } finally {
      setValidatingVoucher(false)
    }
  }

  const handleValidateVoucher = async () => {
    if (!customerData) return
    if (!voucherCode) {
      toast("Please enter a voucher code", "error")
      return
    }
    setValidatingVoucher(true)
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCode.toUpperCase(),
          customerId: customerData.id,
          subtotal
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to validate voucher")

      setAppliedVoucher(data.data)
      setSelectedDiscountId(null) // Can't mix discount and voucher
      toast("Voucher applied successfully", "success")
      setVoucherModalOpen(false)
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setValidatingVoucher(false)
    }
  }

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

  let discountAmount = 0
  let discountName = ""

  if (appliedVoucher) {
    if (subtotal >= Number(appliedVoucher.min_transaction)) {
      discountAmount = appliedVoucher.discount_type === 'PERCENTAGE'
        ? Math.min(subtotal * (Number(appliedVoucher.discount_value) / 100), Number(appliedVoucher.max_discount || Infinity))
        : Number(appliedVoucher.discount_value)
      discountName = `Voucher: ${appliedVoucher.code}`
    }
  } else if (selectedDiscountId) {
    const d = discounts.find(d => d.id === selectedDiscountId)
    if (d) {
      if (d.scope === 'ORDER') {
        discountAmount = d.type === 'PERCENTAGE'
          ? subtotal * (Number(d.value) / 100)
          : Number(d.value)
      } else {
        // ITEM scope: apply to the highest priced item in cart for simplicity
        if (posCart.length > 0) {
          const maxPriceItem = posCart.reduce((prev, current) => (Number(prev.price) > Number(current.price)) ? prev : current)
          discountAmount = d.type === 'PERCENTAGE'
            ? Number(maxPriceItem.price) * (Number(d.value) / 100)
            : Number(d.value)
          discountAmount = Math.min(discountAmount, Number(maxPriceItem.price)) // Can't exceed item price
        }
      }
      discountName = d.name
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount)

  taxes.forEach(t => {
    const rateStr = t.tax_rate.toString().replace('%', '')
    const rate = Number(rateStr) / 100
    const taxAmt = Math.round(discountedSubtotal * rate)
    totalTaxAmount += taxAmt
    taxDetails.push({ name: t.tax_name, amount: taxAmt })
  })

  const grandTotal = discountedSubtotal + totalTaxAmount
  const shiftInfo = session ? session.branchName || 'Branch ' + session.branchId : "Admin"

  const handleCheckout = async () => {
    if (orderType === "DINE_IN" && !activeSessionId) {
      toast("Silakan pilih meja dari menu Tables terlebih dahulu untuk pesanan Dine In.", "error")
      return
    }

    setLoading(true)
    try {
      const payload = {
        branchId: session?.branchId,
        orderType: orderType,
        subtotal: subtotal,
        taxAmount: totalTaxAmount,
        discountAmount: discountAmount,
        totalAmount: grandTotal,
        paymentMethod: activeSessionId ? null : paymentMethod,
        cashAmount: paymentMethod === 'CASH' ? Number(cashAmount) : 0,
        tableSessionId: activeSessionId ? Number(activeSessionId) : null,
        voucherId: appliedVoucher?.id || null,
        customerId: customerData?.id || null,
        employeeId: activeEmployeeId,
        items: posCart.map((c: any) => ({
          productId: c.id,
          productName: c.name,
          quantity: c.quantity || 1,
          unitPrice: Number(c.price),
          subtotal: Number(c.price) * (c.quantity || 1),
          notes: c.notes || null
        })),
        isAdmin: isEmbedded
      }

      let jsonResponse: any;
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

        jsonResponse = await res.json()
        if (!res.ok) throw new Error("Failed to checkout")

        // Handle Xendit payment response
        if (paymentMethod !== 'CASH' && paymentMethods) {
          const methodObj = paymentMethods.find((m: any) => m.code === paymentMethod)
          if (methodObj && methodObj.provider === 'XENDIT') {
            const xenditRes = await fetch("/api/payments/xendit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: jsonResponse.orderId,
                invoiceCode: jsonResponse.invoiceCode,
                amount: grandTotal,
                methodType: methodObj.type,
                channelCode: methodObj.code.replace('_VA', ''),
                customerPhone: customerPhone,
              })
            })

            const xenditData = await xenditRes.json()
            if (!xenditRes.ok) throw new Error(xenditData.error || "Xendit request failed")

            setCheckoutOpen(false)

            const xr = xenditData.data
            setXenditPaymentId(xr.id)

            if (methodObj.type === "QR_CODE") {
              setXenditData({ qrString: xr.actions?.[0]?.url || xr.payment_method?.qr_code?.channel_properties?.qr_string, orderId: jsonResponse?.orderId, invoiceCode: jsonResponse?.invoiceCode, logoUrl: methodObj.logo_url })
              setXenditModalType("QRIS")
              setLoading(false)
              return
            } else if (methodObj.type === "EWALLET" || methodObj.type === "E_WALLET") {
              const actions = xr.actions || []
              const redirectUrl = actions.find((a: any) => a.url_type === "WEB")?.url 
                               || actions.find((a: any) => a.url_type === "MOBILE")?.url 
                               || actions.find((a: any) => a.url)?.url

              if (redirectUrl) {
                // Save pending order data + paymentRequestId to localStorage before redirecting
                localStorage.setItem('xendit_pending_order', JSON.stringify({
                  paymentRequestId: xr.id,
                  orderId: jsonResponse.orderId,
                  invoiceId: String(jsonResponse.orderId).padStart(4, '0'),
                  orderType: payload.orderType,
                  items: posCart.map((c: any) => ({
                    productName: c.name,
                    quantity: c.quantity || 1,
                    unitPrice: Number(c.price),
                    subtotal: Number(c.price) * (c.quantity || 1)
                  })),
                  subtotal: subtotal,
                  totalAmount: grandTotal,
                  paymentMethod: paymentMethod,
                  paymentMethodName: methodObj.name,
                }))
                // Clear cart
                setPosCart([])
                setCashAmount("")
                setCustomerPhone("")
                setCustomerData(null)
                setAppliedVoucher(null)
                setVoucherCode("")
                setSelectedDiscountId(null)
                setCheckoutOpen(false)
                setLoading(false)
                // Redirect current tab to Xendit payment page
                window.location.href = redirectUrl
                return
              } else {
                // Fallback: no redirect URL, show modal
                setXenditData({ actions, methodName: methodObj.name, redirectUrl: null, channelCode: methodObj.code, orderId: jsonResponse?.orderId, invoiceCode: jsonResponse?.invoiceCode, logoUrl: methodObj.logo_url })
                setXenditModalType("EWALLET")
                setLoading(false)
                return
              }
            } else if (methodObj.type === "VIRTUAL_ACCOUNT") {
              setXenditData({
                accountNumber: xr.payment_method?.virtual_account?.channel_properties?.virtual_account_number,
                methodName: methodObj.name,
                instructions: methodObj.instructions || [],
                orderId: jsonResponse?.orderId,
                invoiceCode: jsonResponse?.invoiceCode,
                logoUrl: methodObj.logo_url
              })
              setXenditModalType("VA")
              setLoading(false)
              return
            }
          }
        }

        toast("Payment Successful", "success")
      }

      const invoiceIdStr = jsonResponse?.orderId ? String(jsonResponse.orderId).padStart(4, '0') : `OFFLINE-${Date.now()}`;

      if (activeSessionId) {
        localStorage.removeItem('activeSessionId')
        localStorage.removeItem('activeTableNumber')
        setActiveSessionId(null)
        setActiveTableNumber(null)
        toast("Pesanan dikirim ke Dapur (Open Bill)", "success")
        router.push("/admin/tables")
      } else {
        // Normal POS checkout -> show receipt modal
        setLastTransaction({
          ...payload,
          invoiceId: invoiceIdStr,
          cashAmount: Number(cashAmount) || payload.totalAmount
        })
      }

      setPosCart([])
      setAppliedVoucher(null)
      setCustomerData(null)
      setCustomerPhone("")
      setVoucherCode("")
      setCashAmount("")
      setSelectedDiscountId(null)
      setDiscountModalOpen(false)
      setCheckoutOpen(false)
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : "An unknown error occurred"
      toast(errorMsg, "error")
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
      pdf.save(`Receipt-${lastTransaction?.invoiceId || 'POS'}.pdf`)
    } catch (e) {
      toast("Failed to generate PDF", "error")
    }
  }

  // Handle keyboard input for PIN
  React.useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;

      if (e.key >= '0' && e.key <= '9') {
        setPinInput(prev => prev.length < 4 ? prev + e.key : prev);
      } else if (e.key === 'Backspace') {
        setPinInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter' && pinInput.length === 4) {
        // Trigger submit
        const submitBtn = document.getElementById('pin-submit-btn');
        if (submitBtn) submitBtn.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, loading, pinInput]);

  if (isLocked) {
    return (
      <div className={`flex flex-col items-center justify-center bg-background ${!isEmbedded ? 'min-h-screen' : 'h-[calc(100vh-112px)] w-full'} p-4`}>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* PIN Lock Card */}
          <div className="bg-card text-card-foreground p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] w-full max-w-[260px] sm:max-w-[280px] text-center border border-border shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
              <UserCheck size={20} />
            </div>
            <h2 className="text-lg font-bold mb-1">Open Shift</h2>
            <p className="text-muted-foreground mb-4 text-[12px]">Enter your PIN to continue</p>

            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${pinInput.length > i
                    ? 'bg-primary scale-110 shadow-sm'
                    : 'bg-muted border border-border scale-100'
                    }`}
                />
              ))}
            </div>

            <div className="h-5 mb-2">
              {pinError && <p className="text-destructive text-xs font-medium animate-in fade-in slide-in-from-top-1">{pinError}</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="ghost"
                  className="h-12 w-full rounded-xl text-lg font-semibold bg-transparent hover:bg-muted active:scale-95 transition-all"
                  onClick={() => setPinInput(prev => prev.length < 4 ? prev + num : prev)}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="h-12 w-full rounded-xl text-lg font-semibold bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                onClick={() => setPinInput(prev => prev.slice(0, -1))}
              >
                <RotateCcw size={18} />
              </Button>
              <Button
                variant="ghost"
                className="h-12 w-full rounded-xl text-lg font-semibold bg-transparent hover:bg-muted active:scale-95 transition-all"
                onClick={() => setPinInput(prev => prev.length < 4 ? prev + "0" : prev)}
              >
                0
              </Button>
              <Button
                id="pin-submit-btn"
                className="h-12 w-full rounded-xl text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-95 transition-all"
                disabled={pinInput.length !== 4 || loading}
                onClick={handlePinSubmit}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={20} />}
              </Button>
            </div>
          </div>

          {/* Developer Testing Helper Card */}
          {branchEmployees && branchEmployees.length > 0 && (
            <div className="bg-card text-card-foreground p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] w-full max-w-[260px] sm:max-w-[280px] border border-border shrink-0">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Coffee size={16} />
                <p className="text-[11px] uppercase font-bold">Testing Mode</p>
              </div>
              <p className="text-sm font-semibold mb-3">Employee PINs</p>
              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {branchEmployees.map((emp, index) => {
                  const testPin = String(1001 + index).padStart(4, '0')
                  return (
                    <div
                      key={emp.id}
                      className="text-left px-3 py-2.5 text-[13px] rounded-xl bg-muted/50 flex justify-between items-center border border-border/50 gap-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate">{emp.name}</span>
                        <span className="text-[10px] text-muted-foreground">{emp.role}</span>
                      </div>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md tracking-wider">
                        {testPin}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`print:hidden flex flex-col font-sans ${!isEmbedded ? 'h-full bg-background text-foreground p-3 md:p-4' : 'h-[calc(100vh-112px)] w-full'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3 shrink-0">
          <div>
            <h2 className="m-0 text-xl font-extrabold tracking-tight">POS Terminal</h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">

              {activeSessionId && (
                <div className="flex items-center bg-brand-blue/20 rounded-full px-3 py-1.5 border border-brand-blue/30">
                  <span className="w-2 h-2 rounded-full bg-brand-blue mr-2"></span>
                  <p className="text-[11px] font-bold text-brand-blue">DINE IN - Table {activeTableNumber}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {queueCount > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-warning/20 text-warning inline-flex items-center gap-1 cursor-pointer" onClick={syncOfflineQueue}>
                {queueCount} QUEUED
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${isOnline ? 'bg-cyan-500/20 text-cyan-500' : 'bg-destructive/20 text-destructive'}`}>
              {isOnline ? <><Wifi size={10} /> ONLINE</> : <><WifiOff size={10} /> OFFLINE</>}
            </span>
            {!isSuperAdmin && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button
                  onClick={() => {
                    setIsLocked(true)
                    localStorage.removeItem("pos_active_employee_id")
                    localStorage.removeItem("pos_cashier_name")
                    setActiveEmployeeId(null)
                    setCashierName("Cashier")
                  }}
                  className="group flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-background border border-border hover:bg-muted hover:border-primary/50 transition-all shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <User size={12} />
                  </div>
                  <span className="text-[12px] font-bold text-foreground">{cashierName}</span>
                  <div className="w-px h-3 bg-border mx-0.5"></div>
                  <Lock size={12} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                </button>
              </>
            )}
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
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${activeCategory === c
                    ? "bg-brand-blue text-brand-blue-foreground dark:bg-primary dark:text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
                {displayedProducts.map(p => {
                  const isOutOfStock = p.stock_status === "OUT_OF_STOCK";

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isOutOfStock) {
                          toast("This product is currently out of stock", "error");
                          return;
                        }
                        setPosCart(c => {
                          const ex = c.find(x => x.id === p.id);
                          if (ex) return c.map(x => x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x);
                          return [...c, { ...p, quantity: 1 }];
                        });
                        toast("Added to cart", "success");
                      }}
                      className={`bg-muted rounded-lg p-1.5 text-center transition-colors relative ${isOutOfStock ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:bg-muted/80"
                        }`}
                    >
                      {isOutOfStock && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                          <div className="bg-destructive text-white px-2 py-1 rounded text-xs font-bold -rotate-12 border-2 border-white/20 shadow-xl backdrop-blur-sm">
                            SOLD OUT
                          </div>
                        </div>
                      )}
                      <div className="w-full aspect-square rounded bg-primary/10 mb-1 flex items-center justify-center overflow-hidden relative">
                        {p.badge && p.badge !== "-" && (
                          <div className="absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded-[4px] text-[8px] font-extrabold bg-foreground/90 text-background backdrop-blur-sm shadow-sm leading-none tracking-wider uppercase">
                            {p.badge.replace('_', ' ')}
                          </div>
                        )}
                        {p.image_url ? (
                          <>
                            <img
                              src={`/api/image?url=${encodeURIComponent(p.image_url)}`}
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
                      <div className="text-[9px] font-bold leading-[1.2] min-h-[22px] text-foreground flex items-center justify-center">{p.name}</div>
                      <div className="text-[10px] font-extrabold text-foreground mt-0.5">{formatMoney(Number(p.price))}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Column */}
          <div className="md:col-span-2 bg-card border border-border rounded-xl p-3 flex flex-col min-h-0">
            <div className="text-[13px] font-bold text-foreground mb-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShoppingCart size={15} /> Cart ({posCart.reduce((acc, c) => acc + (c.quantity || 1), 0)})
              </div>

              {/* Order Type Toggle */}
              <div className="flex bg-muted p-0.5 rounded border border-border">
                {branchSettings?.dineIn !== false && (
                  <button
                    onClick={() => {
                      if (activeSessionId) return;
                      setOrderType("DINE_IN");
                      if (posCart.length > 0) {
                        localStorage.setItem("pendingPosCart", JSON.stringify(posCart));
                      }
                      router.push("/admin/tables");
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${orderType === "DINE_IN" ? "bg-card shadow-sm text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground border border-transparent"}`}
                  >
                    Dine In
                  </button>
                )}
                {branchSettings?.takeAway !== false && (
                  <button
                    onClick={async () => {
                      setOrderType("TAKE_AWAY")
                      if (activeSessionId) {
                        try {
                          await fetch("/api/table-sessions", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId: Number(activeSessionId), action: "close" })
                          });
                        } catch (e) {
                          console.error("Failed to close table session", e);
                        }
                        localStorage.removeItem("activeSessionId")
                        localStorage.removeItem("activeTableNumber")
                        setActiveSessionId(null)
                        setActiveTableNumber(null)
                        toast("Mengubah ke pesanan Take Away.", "success")
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${orderType === "TAKE_AWAY" ? "bg-card shadow-sm text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground border border-transparent"}`}
                  >
                    Take Away
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[80px]">
              {posCart.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground text-[12px]">Tap products</div>
              ) : (
                posCart.map((c, ci) => (
                  <div key={ci} className="flex flex-col py-2 border-b border-border gap-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[12px] font-semibold text-foreground leading-tight">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{c.cat || "Reg"}</div>
                      </div>
                      <div className="text-[12px] font-bold text-foreground">
                        {formatMoney(Number(c.price) * (c.quantity || 1))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => {
                          setNoteItemIndex(ci);
                          setNoteText((c as any).notes || "");
                          setNoteModalOpen(true);
                        }}
                        className="text-[10px] px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 cursor-pointer border-none flex items-center"
                      >
                        {(c as any).notes ? `📝 ${(c as any).notes}` : "+ Note"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center border border-border rounded-md bg-background overflow-hidden h-7">
                          <button
                            className="w-7 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors font-medium border-r border-border"
                            onClick={() => {
                              setPosCart(prev => {
                                const existing = prev[ci];
                                if ((existing.quantity || 1) > 1) {
                                  return prev.map((item, j) => j === ci ? { ...item, quantity: (item.quantity || 1) - 1 } : item);
                                }
                                return prev.filter((_, j) => j !== ci);
                              });
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="w-9 h-full text-center text-[12px] font-bold bg-transparent border-none py-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none"
                            value={c.quantity || 1}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              if (valStr === '') {
                                // Allow empty string temporarily so user can delete and re-type
                                setPosCart(prev => prev.map((item, j) => j === ci ? { ...item, quantity: '' as any } : item));
                                return;
                              }
                              let val = parseInt(valStr);
                              if (isNaN(val) || val < 1) val = 1;
                              if (val > 999) val = 999;
                              setPosCart(prev => prev.map((item, j) => j === ci ? { ...item, quantity: val } : item));
                            }}
                            onBlur={(e) => {
                              // If left empty, default to 1
                              if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                                setPosCart(prev => prev.map((item, j) => j === ci ? { ...item, quantity: 1 } : item));
                              }
                            }}
                          />
                          <button
                            className="w-7 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors font-medium border-l border-border"
                            onClick={() => {
                              setPosCart(prev => prev.map((item, j) => j === ci ? { ...item, quantity: (item.quantity || 1) + 1 } : item));
                            }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setPosCart(prev => prev.filter((_, j) => j !== ci));
                            toast("Item removed", "info");
                          }}
                          className="bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md h-7 w-7 flex items-center justify-center transition-colors cursor-pointer border-none shrink-0"
                          title="Remove Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border pt-2 mt-1">
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  className="flex-1 h-8 text-[11px] border-dashed border-primary/50 text-primary hover:bg-primary/10 gap-1.5"
                  onClick={() => setDiscountModalOpen(true)}
                  disabled={posCart.length === 0 || appliedVoucher !== null}
                >
                  <Ticket size={12} /> {selectedDiscountId ? "Change Discount" : "Apply Discount"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-8 text-[11px] border-dashed border-purple-500/50 text-purple-400 hover:bg-purple-500/10 gap-1.5"
                  onClick={() => setVoucherModalOpen(true)}
                  disabled={posCart.length === 0 || selectedDiscountId !== null}
                >
                  <Ticket size={12} /> {appliedVoucher ? "Change Voucher" : "Apply Voucher"}
                </Button>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[11px] text-success mb-0.5">
                  <span className="truncate max-w-[150px]">{discountName || "Discount"}</span>
                  <span>-{formatMoney(discountAmount)}</span>
                </div>
              )}
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
                  if (!orderType) {
                    toast("Silakan pilih Dine In atau Take Away terlebih dahulu", "error");
                    return;
                  }

                  if (orderType === "DINE_IN" && !activeSessionId) {
                    toast("Pesanan Dine In harus dari menu Tables. Silakan hapus pesanan atau ganti ke Take Away.", "error");
                    return;
                  }

                  setCheckoutOpen(true)
                }}
                className={`w-full py-2.5 text-white rounded-lg font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md ${activeSessionId
                  ? "bg-slate-800 hover:bg-slate-900 shadow-slate-800/20"
                  : "bg-primary hover:bg-primary/90 shadow-primary/20"
                  }`}
              >
                {activeSessionId ? <ChefHat size={16} /> : <CreditCard size={16} />}
                {activeSessionId ? "Send to Kitchen" : "Charge"}
              </button>
            </div>
          </div>
        </div>

        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen} className="sm:max-w-[420px]">
          <DialogHeader className="border-b border-border pb-3 mb-1">
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              {activeSessionId ? (
                <>
                  <ChefHat className="text-foreground" size={22} />
                  <span className="text-foreground">Kirim Pesanan ke Dapur</span>
                </>
              ) : (
                <>
                  <CreditCard className="text-primary" size={22} />
                  <span className="text-foreground">Pembayaran Tagihan {isOnline ? "" : "(Offline)"}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1 overflow-y-auto max-h-[85vh] pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            {/* Summary Box */}
            <div className="bg-card border border-border p-3 rounded-xl flex flex-col gap-1 shrink-0">
              <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                <span>{activeSessionId ? "Total yang ditambahkan" : "Total yang Dibayar"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs font-medium">Grand Total</span>
                <span className="text-foreground text-xl font-black">{formatMoney(grandTotal)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1 shrink-0">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tipe Pesanan</label>
              <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-lg text-xs font-bold text-foreground shadow-sm">
                {orderType === "DINE_IN" ? <Users size={16} className="text-foreground" /> : orderType === "TAKE_AWAY" ? <ShoppingBag size={16} className="text-amber-500" /> : "-"}
                {orderType === "DINE_IN" ? "Dine In (Makan di Tempat)" : orderType === "TAKE_AWAY" ? "Take Away (Bawa Pulang)" : "-"}
              </div>
            </div>

            {!activeSessionId && (
              <div className="flex flex-col gap-1.5 mt-1 shrink-0">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Metode Pembayaran</label>
                {paymentMethods ? (
                  <PaymentMethodPicker
                    methods={paymentMethods}
                    selected={paymentMethod}
                    onChange={setPaymentMethod}
                  />
                ) : (
                  <Select
                    options={[
                      { label: "Cash", value: "CASH" },
                      { label: "QRIS", value: "QRIS" },
                      { label: "Kartu Debit", value: "DEBIT_CARD" }
                    ]}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                )}

                {paymentMethod === 'CASH' && (
                  <div className="animate-in slide-in-from-top-2 duration-200 mt-1.5 shrink-0">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">Rp</span>
                      <input
                        type="text"
                        value={cashAmount ? Number(cashAmount).toLocaleString('id-ID') : ''}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setCashAmount(raw);
                        }}
                        placeholder="0"
                        className="w-full bg-card pl-9 pr-3 py-2 rounded-lg border border-border focus:border-primary focus:outline-none text-base font-bold shadow-sm text-foreground"
                      />
                    </div>

                    {/* Quick Money Buttons */}
                    <div className="flex gap-2 mt-2 shrink-0">
                      {[10000, 20000, 50000, 100000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setCashAmount(String(amount))}
                          className="flex-1 py-1 rounded-md border border-border bg-card text-[10px] font-bold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                          {amount / 1000}k
                        </button>
                      ))}
                      <button
                        onClick={() => setCashAmount(String(Math.ceil(grandTotal)))}
                        className="flex-[1.5] py-1 rounded-md border border-border bg-card text-[10px] font-bold text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        Uang Pas
                      </button>
                    </div>

                    {Number(cashAmount) > 0 && (
                      <div className="mt-2 p-2 bg-primary/5 rounded-lg flex justify-between items-center border border-primary/20 shrink-0">
                        <span className="text-[11px] font-bold text-primary">Kembalian</span>
                        <span className="text-sm font-black text-primary">
                          Rp {Math.max(0, Number(cashAmount) - grandTotal).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Phone input for OVO / DANA */}
                {(paymentMethod === 'OVO' || paymentMethod === 'DANA') && (
                  <div className="animate-in slide-in-from-top-2 duration-200 mt-1.5 shrink-0">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Nomor HP Pelanggan ({paymentMethod})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">+62</span>
                      <input
                        type="tel"
                        value={customerPhone.replace(/^\+62/, '')}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '')
                          setCustomerPhone('+62' + val)
                        }}
                        placeholder="8xxxxxxxxxx"
                        className="w-full bg-card pl-12 pr-3 py-2 rounded-lg border border-border focus:border-primary focus:outline-none text-base font-bold shadow-sm text-foreground"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Notifikasi pembayaran akan dikirim ke nomor ini</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="mt-3 gap-2 shrink-0">
            <Button variant="outline" className="flex-1 font-bold bg-card text-foreground hover:bg-muted border-border py-3 text-sm" onClick={() => setCheckoutOpen(false)} disabled={loading}>Batal</Button>
            <Button
              onClick={handleCheckout}
              disabled={loading || (!activeSessionId && !paymentMethod) || (!activeSessionId && paymentMethod === 'CASH' && Number(cashAmount) < grandTotal)}
              className={`flex-[2] font-bold gap-1.5 text-white shadow-md py-3 text-sm ${activeSessionId
                ? "bg-slate-800 hover:bg-slate-900 shadow-slate-800/20"
                : "bg-primary hover:bg-primary/90 shadow-primary/20"
                }`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : activeSessionId ? <ChefHat size={16} /> : <CheckCircle2 size={16} />}
              {activeSessionId ? "Kirim ke Dapur" : "Konfirmasi Pembayaran"}
            </Button>
          </DialogFooter>
        </Dialog>

        <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen} className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Ketik catatan di sini..."
              autoFocus
            />
          </div>
          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => setNoteModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (noteItemIndex !== null) {
                setPosCart(prev => prev.map((item, j) => j === noteItemIndex ? { ...item, notes: noteText } : item));
              }
              setNoteModalOpen(false)
            }}>Save Note</Button>
          </DialogFooter>
        </Dialog>

        {/* Discount Picker Dialog */}
        <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4 max-h-[60vh] overflow-y-auto">
            {discounts.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">No active discounts available.</div>
            ) : (
              discounts.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDiscountId(d.id); setDiscountModalOpen(false); setAppliedVoucher(null); }}
                  className={`flex justify-between items-center p-3 rounded-lg border text-left cursor-pointer transition-colors ${selectedDiscountId === d.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                >
                  <div>
                    <div className="font-bold text-[13px]">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.scope === 'ORDER' ? 'Order' : 'Item'} Scope</div>
                  </div>
                  <div className="font-bold text-[13px] text-success">
                    {d.type === 'PERCENTAGE' ? `${d.value}%` : `Rp ${Number(d.value).toLocaleString('id-ID')}`}
                  </div>
                </button>
              ))
            )}
            {selectedDiscountId && (
              <Button variant="outline" className="mt-2 text-destructive border-destructive hover:bg-destructive/10" onClick={() => { setSelectedDiscountId(null); setDiscountModalOpen(false); }}>
                Remove Applied Discount
              </Button>
            )}
          </div>
        </Dialog>

        {/* Voucher Picker Dialog */}
        <Dialog open={voucherModalOpen} onOpenChange={setVoucherModalOpen}>
          <DialogHeader>
            <DialogTitle>Apply Voucher</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="bg-muted p-3 rounded-lg border border-border">
              <h4 className="text-[13px] font-bold mb-2">Step 1: Find Customer</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Phone Number customer"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={!!customerData}
                />
                {!customerData ? (
                  <Button onClick={handleSearchCustomer} disabled={validatingVoucher || !customerPhone} className="h-9">Search</Button>
                ) : (
                  <Button variant="outline" onClick={() => { setCustomerData(null); setAppliedVoucher(null); }} className="h-9">Change</Button>
                )}
              </div>
              {customerData && (
                <div className="mt-2 text-[12px] text-success font-medium flex items-center gap-1.5">
                  <Check size={14} /> Found: {customerData.name} ({customerData.loyaltyTier})
                </div>
              )}
            </div>

            <div className={`p-3 rounded-lg border ${customerData ? 'border-primary bg-primary/5' : 'border-border bg-muted/50 opacity-50 pointer-events-none'}`}>
              <h4 className="text-[13px] font-bold mb-2">Step 2: Enter Voucher Code</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Voucher Code"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring uppercase"
                />
                <Button onClick={handleValidateVoucher} disabled={validatingVoucher || !voucherCode || !customerData} className="h-9">Validate</Button>
              </div>
              {appliedVoucher && (
                <div className="mt-3 bg-success/10 border border-success/30 p-2 rounded text-[12px] text-success">
                  <div className="font-bold mb-1">Voucher Applied!</div>
                  <div>{appliedVoucher.discount_type === 'PERCENTAGE' ? `${appliedVoucher.discount_value}% Off` : `Rp ${Number(appliedVoucher.discount_value).toLocaleString('id-ID')} Off`}</div>
                </div>
              )}
            </div>

            {appliedVoucher && (
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10 w-full" onClick={() => { setAppliedVoucher(null); setVoucherModalOpen(false); }}>
                Remove Applied Voucher
              </Button>
            )}
          </div>
        </Dialog>

        {/* Xendit Modals */}
        <XenditQrisModal
          open={xenditModalType === "QRIS"}
          onOpenChange={(o) => { if (!o) setXenditModalType(null) }}
          paymentRequestId={xenditPaymentId}
          qrString={xenditData?.qrString}
          amount={grandTotal}
          logoUrl={xenditData?.logoUrl}
          onSuccess={async () => {
          setXenditModalType(null)
          
          if (xenditData?.orderId) {
            try {
              await fetch(`/api/orders/${xenditData.orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
              })
            } catch (e) {
              console.error("Failed to update status on simulation success", e)
            }
          }

          // Handle successful Xendit completion
          setLastTransaction({ 
            invoiceId: xenditData?.invoiceCode || "PAID", 
            orderType: orderType, 
            items: posCart.map((c: any) => ({
              productName: c.name,
              quantity: c.quantity || 1,
              unitPrice: Number(c.price),
              subtotal: Number(c.price) * (c.quantity || 1)
            })),
            subtotal: subtotal, 
            totalAmount: grandTotal, 
            cashAmount: grandTotal, 
            paymentMethod: paymentMethod 
          })
          setPosCart([])
            setCashAmount("")
            setCustomerPhone("")
            setCustomerData(null)
            setAppliedVoucher(null)
            setVoucherCode("")
            setSelectedDiscountId(null)
          }}
          onCancel={() => setXenditModalType(null)}
          onCancelOrder={async (reason) => {
            if (xenditData?.invoiceCode) {
              await fetch(`/api/orders/${xenditData.invoiceCode}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancelReason: reason })
              })
            }
            setXenditModalType(null)
            setXenditData(null)
            setPosCart([])
            setCashAmount("")
          }}
        />

        <XenditEwalletModal
          open={xenditModalType === "EWALLET"}
          onOpenChange={(o) => { if (!o) setXenditModalType(null) }}
          paymentRequestId={xenditPaymentId}
          actions={xenditData?.actions}
          amount={grandTotal}
          methodName={xenditData?.methodName || "E-Wallet"}
          channelCode={xenditData?.channelCode || ""}
          logoUrl={xenditData?.logoUrl}
          onSuccess={async () => {
          setXenditModalType(null)
          
          if (xenditData?.orderId) {
            try {
              await fetch(`/api/orders/${xenditData.orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
              })
            } catch (e) {
              console.error("Failed to update status on simulation success", e)
            }
          }

          // Handle successful Xendit completion
          setLastTransaction({ 
            invoiceId: xenditData?.invoiceCode || "PAID", 
            orderType: orderType, 
            items: posCart.map((c: any) => ({
              productName: c.name,
              quantity: c.quantity || 1,
              unitPrice: Number(c.price),
              subtotal: Number(c.price) * (c.quantity || 1)
            })),
            subtotal: subtotal, 
            totalAmount: grandTotal, 
            cashAmount: grandTotal, 
            paymentMethod: paymentMethod 
          })
            setPosCart([])
            setCashAmount("")
            setCustomerPhone("")
            setCustomerData(null)
            setAppliedVoucher(null)
            setVoucherCode("")
            setSelectedDiscountId(null)
          }}
          onCancel={() => setXenditModalType(null)}
          onCancelOrder={async (reason) => {
            if (xenditData?.invoiceCode) {
              await fetch(`/api/orders/${xenditData.invoiceCode}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancelReason: reason })
              })
            }
            setXenditModalType(null)
            setXenditData(null)
            setPosCart([])
            setCashAmount("")
          }}
        />

        <XenditVaModal
          open={xenditModalType === "VA"}
          onOpenChange={(o) => { if (!o) setXenditModalType(null) }}
          paymentRequestId={xenditPaymentId}
          accountNumber={xenditData?.accountNumber}
          amount={grandTotal}
          methodName={xenditData?.methodName || "Virtual Account"}
          instructions={xenditData?.instructions || []}
          logoUrl={xenditData?.logoUrl}
          onSuccess={async () => {
          setXenditModalType(null)
          
          if (xenditData?.orderId) {
            try {
              await fetch(`/api/orders/${xenditData.orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
              })
            } catch (e) {
              console.error("Failed to update status on simulation success", e)
            }
          }

          // Handle successful Xendit completion
          setLastTransaction({ 
            invoiceId: xenditData?.invoiceCode || "PAID", 
            orderType: orderType, 
            items: posCart.map((c: any) => ({
              productName: c.name,
              quantity: c.quantity || 1,
              unitPrice: Number(c.price),
              subtotal: Number(c.price) * (c.quantity || 1)
            })),
            subtotal: subtotal, 
            totalAmount: grandTotal, 
            cashAmount: grandTotal, 
            paymentMethod: paymentMethod 
          })
            setPosCart([])
            setCashAmount("")
            setCustomerPhone("")
            setCustomerData(null)
            setAppliedVoucher(null)
            setVoucherCode("")
            setSelectedDiscountId(null)
          }}
          onCancel={() => setXenditModalType(null)}
          onCancelOrder={async (reason) => {
            if (xenditData?.orderId) {
              await fetch(`/api/orders/${xenditData.orderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancelReason: reason })
              })
            }
            setXenditModalType(null)
            setXenditData(null)
            setPosCart([])
            setCashAmount("")
          }}
        />

        {/* CHECKOUT SUCCESS MODAL */}
        <Dialog open={!!lastTransaction} onOpenChange={(open) => {
          if (!open) setLastTransaction(null)
        }}>
          <DialogHeader>
          <DialogTitle className="text-center text-xl text-primary flex flex-col items-center gap-2 mt-4">
            <CheckCircle2 size={48} className="text-primary" />
            Pembayaran Berhasil!
          </DialogTitle>
        </DialogHeader>
        {lastTransaction?.paymentMethod === 'CASH' && (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-muted-foreground mb-1">Kembalian (Change)</p>
            <p className="text-4xl font-black text-foreground">
              {formatMoney(Math.max(0, lastTransaction.cashAmount - lastTransaction.totalAmount))}
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleDownloadPDF}
            >
              <FileText size={16} /> Download PDF
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print Receipt
            </Button>
            <Button
              className="w-full gap-2"
              onClick={() => setLastTransaction(null)}
            >
              <Check size={16} /> Selesai
            </Button>
          </DialogFooter>
        </Dialog>
      </div>

      {/* RECEIPT PRINT AREA */}
      <ReceiptPrint
        transaction={lastTransaction}
        branchName={shiftInfo}
        cashierName={cashierName}
        receiptId="receipt-print-area"
      />
    </>
  )
}
