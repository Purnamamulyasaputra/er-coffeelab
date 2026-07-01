"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, Copy, RefreshCw } from "lucide-react"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

interface XenditVaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentRequestId: string | null
  accountNumber: string | null
  amount: number
  methodName: string
  instructions: any[]
  onSuccess: () => void
  onCancel: () => void
  onCancelOrder?: (reason: string) => Promise<void>
  logoUrl?: string
}

export function XenditVaModal({
  open,
  onOpenChange,
  paymentRequestId,
  accountNumber,
  amount,
  methodName,
  instructions,
  onSuccess,
  onCancel,
  onCancelOrder,
  logoUrl
}: XenditVaModalProps) {
  const [status, setStatus] = useState<"PENDING" | "SUCCEEDED" | "FAILED">("PENDING")
  const [copied, setCopied] = useState(false)
  const [isCheckingManually, setIsCheckingManually] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  useEffect(() => {
    if (open) setStatus("PENDING")
  }, [open])

  useEffect(() => {
    if (!open || !paymentRequestId || status !== "PENDING") return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/xendit/status?paymentRequestId=${paymentRequestId}`)
        const data = await res.json()
        if (data.status === "SUCCEEDED") {
          clearInterval(interval)
          onSuccess()
        } else if (data.status === "FAILED") {
          setStatus("FAILED")
          clearInterval(interval)
        }
      } catch (e) {
        console.error("Polling error", e)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [open, paymentRequestId, status, onSuccess])

  const handleCopy = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center">
          {logoUrl && (
            <img src={logoUrl} alt={methodName} className="h-10 object-contain mb-2" />
          )}
          <DialogTitle className="text-center">Payment via {methodName}</DialogTitle>
          <DialogDescription className="text-center">
            Transfer the exact amount to the Virtual Account number below
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-5">
          <div className="text-3xl font-bold">
            Rp {amount.toLocaleString('id-ID')}
          </div>

          {status === "PENDING" && (
            <div className="w-full space-y-4">
              {/* VA Number */}
              <div className="bg-muted p-4 rounded-xl border flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Virtual Account Number</p>
                  <p className="text-xl font-mono font-bold tracking-widest">{accountNumber || "Loading..."}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <CheckCircle2 className="text-emerald-500" /> : <Copy />}
                </Button>
              </div>

              {/* Instructions */}
              {instructions && instructions.length > 0 && (
                <div className="bg-card border rounded-xl p-4 text-sm space-y-2">
                  <p className="font-semibold">Transfer Instructions:</p>
                  <ul className="list-decimal list-inside space-y-1 text-muted-foreground">
                    {instructions.map((inst, idx) => (
                      <li key={idx}>{inst.instruction_text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground pt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for transfer confirmation...</span>
              </div>
            </div>
          )}



          {status === "FAILED" && (
            <div className="w-full py-8 flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-xl text-red-600">
              <XCircle className="w-16 h-16 mb-3" />
              <div className="font-bold text-lg">Payment Failed</div>
            </div>
          )}
        </div>

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
        message="This order will be permanently cancelled and recorded in the system."
        confirmText="Yes, Cancel"
        cancelText="Close"
      />
    </Dialog>
  )
}
