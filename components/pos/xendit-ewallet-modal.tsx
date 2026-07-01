"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, ExternalLink, Smartphone } from "lucide-react"
import QRCode from "react-qr-code"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

// Xendit API v2022-07-31 normalised channel codes
// OVO: push notification (requires mobile_number)
const PUSH_NOTIFICATION_WALLETS = ["OVO", "ID_OVO"]

// GoPay, ShopeePay, LinkAja, DANA, etc. — redirect / QR scan
const QR_REDIRECT_WALLETS = ["GOPAY", "ID_SHOPEEPAY", "ID_LINKAJA", "ID_ASTRAPAY", "ID_JENIUSPAY"]

interface XenditEwalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentRequestId: string | null
  actions: any[] | null
  amount: number
  methodName: string
  channelCode?: string
  onSuccess: () => void
  onCancel: () => void
  onCancelOrder?: (reason: string) => Promise<void>
  logoUrl?: string
  // Phone number for push-notification wallets (OVO / DANA)
  customerPhone?: string
  onCustomerPhoneChange?: (phone: string) => void
}

export function XenditEwalletModal({
  open,
  onOpenChange,
  paymentRequestId,
  actions,
  amount,
  methodName,
  channelCode = "",
  onSuccess,
  onCancel,
  onCancelOrder,
  logoUrl,
  customerPhone = "",
  onCustomerPhoneChange,
}: XenditEwalletModalProps) {
  const [status, setStatus] = useState<"PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED">("PENDING")
  const [isCheckingManually, setIsCheckingManually] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  useEffect(() => {
    if (open) setStatus("PENDING")
  }, [open])

  const handleManualCheck = async () => {
    if (!paymentRequestId || isCheckingManually) return
    setIsCheckingManually(true)
    try {
      const res = await fetch(`/api/payments/xendit/status?paymentRequestId=${paymentRequestId}`)
      const data = await res.json()
      if (data.status === "SUCCEEDED") {
        onSuccess()
      } else if (data.status === "FAILED") {
        setStatus("FAILED")
      }
    } catch (e) {
      console.error("Manual check error", e)
    } finally {
      setIsCheckingManually(false)
    }
  }

  const redirectUrl = actions?.find((a: any) => a.url_type === "WEB")?.url
    || actions?.find((a: any) => a.url_type === "MOBILE")?.url
    || actions?.find((a: any) => a.url)?.url

  const normalizedCode = channelCode.toUpperCase()
  const isPushWallet = PUSH_NOTIFICATION_WALLETS.includes(normalizedCode)
  const isQrWallet = QR_REDIRECT_WALLETS.includes(normalizedCode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center">
          {logoUrl && (
            <img src={logoUrl} alt={methodName} className="h-10 object-contain mb-2" />
          )}
          <DialogTitle className="text-center">Pay with {methodName}</DialogTitle>
          <DialogDescription className="text-center">
            {isPushWallet
              ? `Notification sent to customer's phone via ${methodName}`
              : `Ask customer to scan QR with the ${methodName} app`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-2 space-y-4">
          {/* Nominal */}
          <div className="text-3xl font-bold">
            Rp {amount.toLocaleString('id-ID')}
          </div>

          {/* PENDING STATE */}
          {status === "PENDING" && (
            <>
              {/* Push-notification wallets (OVO, DANA) — needs phone number */}
              {isPushWallet && (
                <div className="w-full space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                    <Smartphone className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                      Notification sent to customer's phone
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                      Ask customer to open the {methodName} app and approve the payment
                    </p>
                  </div>
                  {/* Phone number input for OVO/DANA */}
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Customer Phone Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g., 081234567890"
                      value={customerPhone}
                      onChange={(e) => onCustomerPhoneChange?.(e.target.value)}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-[13px] outline-none focus:border-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Phone number registered in the {methodName} app
                    </p>
                  </div>
                </div>
              )}

              {/* QR-based wallets (GoPay, ShopeePay, dll) */}
              {isQrWallet && redirectUrl && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="p-3 bg-white rounded-xl border-2 border-border shadow-sm">
                    <QRCode value={redirectUrl} size={150} />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Ask customer to scan the QR above using the <strong>{methodName}</strong> app
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => window.open(redirectUrl, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in browser (if paying on cashier's phone)
                  </Button>
                </div>
              )}

              {/* Fallback: other wallets with redirectUrl (like DANA) */}
              {!isQrWallet && !isPushWallet && redirectUrl && (
                <div className="flex flex-col items-center gap-5 w-full py-4 bg-muted/30 rounded-xl border border-border">
                  <div className="text-center space-y-1.5 px-4">
                    <p className="font-semibold text-[15px]">You're being redirected to {methodName}'s page</p>
                    <p className="text-xs text-muted-foreground">Follow the instructions on the next page to complete your payment.</p>
                  </div>
                  <Button
                    variant="default"
                    className="bg-[#118EEA] hover:bg-[#118EEA]/90 text-white shadow-sm px-8"
                    onClick={() => window.open(redirectUrl, '_blank')}
                  >
                    Go to {methodName}'s page
                  </Button>
                  {/* For POS terminal physical testing, keeping QR code option small */}
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Or scan with phone</p>
                    <div className="p-2 bg-white rounded-lg border border-border">
                      <QRCode value={redirectUrl} size={80} />
                    </div>
                  </div>
                </div>
              )}

              {/* No redirect URL fallback */}
              {!redirectUrl && !isPushWallet && (
                <div className="p-4 bg-muted/50 rounded-lg w-full text-center">
                  <p className="text-sm text-muted-foreground">Please check the {methodName} app on the customer's phone.</p>
                </div>
              )}

              {/* Waiting indicator */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for payment confirmation...</span>
              </div>

              {/* Manual check */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                disabled={isCheckingManually}
                onClick={handleManualCheck}
              >
                {isCheckingManually ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Check Payment Status
              </Button>
            </>
          )}

          {/* FAILED */}
          {status === "FAILED" && (
            <div className="w-full py-8 flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-xl text-red-600">
              <XCircle className="w-16 h-16 mb-3" />
              <div className="font-bold text-lg">Payment Failed</div>
              <p className="text-sm mt-1 text-muted-foreground">Please try another method or repeat the transaction.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={status === "SUCCEEDED" || cancelling}
              onClick={() => {
                if (onCancelOrder) {
                  setConfirmCancelOpen(true)
                } else {
                  onCancel()
                }
              }}
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Cancel
            </Button>
            {/* Simulasi hanya saat testing/sandbox */}
            {status === "PENDING" && process.env.NODE_ENV !== "production" && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => {
                  onSuccess()
                }}
              >
                Simulate Success
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
      <ConfirmationModal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        message="Are you sure you want to cancel this order?"
        onConfirm={async () => {
          setConfirmCancelOpen(false)
          setCancelling(true)
          try {
            await onCancelOrder?.(`Cancelled by cashier from ${methodName} screen`)
          } finally {
            setCancelling(false)
          }
        }}
        type="danger"
        title="Cancel Order?"
        confirmText="Cancel"
        cancelText="Close"
      />
    </Dialog>
  )
}
