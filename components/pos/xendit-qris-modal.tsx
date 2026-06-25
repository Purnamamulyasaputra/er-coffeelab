"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import QRCode from "qrcode"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

interface XenditQrisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentRequestId: string | null
  qrString: string | null
  amount: number
  onSuccess: () => void
  onCancel: () => void
  onCancelOrder?: (reason: string) => Promise<void>
  logoUrl?: string
}

export function XenditQrisModal({
  open,
  onOpenChange,
  paymentRequestId,
  qrString,
  amount,
  onSuccess,
  onCancel,
  onCancelOrder,
  logoUrl
}: XenditQrisModalProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<"PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED">("PENDING")
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  useEffect(() => {
    if (open && qrString) {
      QRCode.toDataURL(qrString, { width: 300, margin: 2 }, (err, url) => {
        if (!err) setQrImageUrl(url)
      })
      setStatus("PENDING")
    }
  }, [open, qrString])

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
    }, 5000)

    return () => clearInterval(interval)
  }, [open, paymentRequestId, status, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="flex flex-col items-center">
          {logoUrl && (
            <img src={logoUrl} alt="QRIS" className="h-10 object-contain" />
          )}
          <DialogTitle className="text-center">Bayar dengan QRIS</DialogTitle>
          <DialogDescription className="text-center">
            Scan QR Code di bawah dengan aplikasi e-wallet atau mobile banking Anda
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-3xl font-bold">
            Rp {amount.toLocaleString('id-ID')}
          </div>

          {status === "PENDING" && qrImageUrl && (
            <div className="p-3 bg-white rounded-xl shadow-sm border inline-block">
              <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
          )}

          {status === "PENDING" && !qrImageUrl && (
            <div className="w-48 h-48 flex items-center justify-center bg-muted/30 rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}



          {status === "FAILED" && (
            <div className="w-64 h-64 flex flex-col items-center justify-center bg-destructive/10 rounded-xl text-destructive">
              <XCircle className="w-16 h-16 mb-4" />
              <div className="font-semibold text-lg">Pembayaran Gagal</div>
            </div>
          )}

          {status === "PENDING" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Menunggu pembayaran...</span>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 mt-2 px-2 pb-2">
          <Button
            variant="outline"
            className="flex-1 rounded-lg"
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
            Batal
          </Button>
          {status === "PENDING" && (
            <Button variant="default" className="flex-1 rounded-lg" onClick={() => {
              onSuccess()
            }}>
              Simulasi Sukses
            </Button>
          )}
        </div>
      </DialogContent>
      <ConfirmationModal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        message="Apakah Anda yakin ingin membatalkan pesanan ini?"
        onConfirm={async () => {
          setConfirmCancelOpen(false)
          setCancelling(true)
          try {
            await onCancelOrder?.("Dibatalkan oleh kasir dari layar QRIS")
          } finally {
            setCancelling(false)
          }
        }}
        type="danger"
        title="Batalkan Pesanan?"
        confirmText="Batalkan"
        cancelText="Tutup"
      />
    </Dialog>
  )
}
