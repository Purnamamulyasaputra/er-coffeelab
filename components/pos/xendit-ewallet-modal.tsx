"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw, Smartphone } from "lucide-react"
import QRCode from "react-qr-code"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

// E-wallets that use push notification to phone (not QR/redirect)
const PUSH_NOTIFICATION_WALLETS = ["OVO", "DANA"]

// E-wallets that use redirect / QR scan
const QR_REDIRECT_WALLETS = ["GOPAY", "SHOPEEPAY", "LINKAJA", "ASTRAPAY", "JENIUSPAY"]

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
  logoUrl
}: XenditEwalletModalProps) {
  const [status, setStatus] = useState<"PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED">("PENDING")
  const [isCheckingManually, setIsCheckingManually] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  useEffect(() => {
    if (open) setStatus("PENDING")
  }, [open])

  // Polling dihapus sesuai request, gunakan cek manual atau simulasi sukses

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

  const isPushWallet = PUSH_NOTIFICATION_WALLETS.includes(channelCode.toUpperCase())
  const isQrWallet = QR_REDIRECT_WALLETS.includes(channelCode.toUpperCase())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center">
          {logoUrl && (
            <img src={logoUrl} alt={methodName} className="h-10 object-contain mb-2" />
          )}
          <DialogTitle className="text-center">Bayar dengan {methodName}</DialogTitle>
          <DialogDescription className="text-center">
            {isPushWallet
              ? `Notifikasi dikirim ke HP pelanggan via ${methodName}`
              : `Minta pelanggan scan QR dengan aplikasi ${methodName}`}
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
              {/* QR-based wallets (GoPay, ShopeePay, dll) */}
              {isQrWallet && redirectUrl && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="p-3 bg-white rounded-xl border-2 border-border shadow-sm">
                    <QRCode value={redirectUrl} size={150} />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Minta pelanggan scan QR di atas menggunakan aplikasi <strong>{methodName}</strong>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => window.open(redirectUrl, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka di browser (jika bayar di HP kasir)
                  </Button>
                </div>
              )}

              {/* Push-notification wallets (OVO, DANA) */}
              {isPushWallet && (
                <div className="w-full p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                  <Smartphone className="w-10 h-10 mx-auto mb-2 text-blue-950" />
                  <p className="font-semibold text-sm text-blue-500 dark:text-blue-950">
                    Notifikasi dikirim ke HP pelanggan
                  </p>
                  <p className="text-xs text-blue-300 dark:text-blue-950 mt-1">
                    Minta pelanggan buka aplikasi {methodName} dan setujui pembayaran
                  </p>
                </div>
              )}

              {/* Fallback: wallet lain yang punya redirectUrl tapi bukan kategori di atas */}
              {!isQrWallet && !isPushWallet && redirectUrl && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="p-3 bg-white rounded-xl border-2 border-border shadow-sm">
                    <QRCode value={redirectUrl} size={150} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => window.open(redirectUrl, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buka Halaman {methodName}
                  </Button>
                </div>
              )}

              {/* No redirect URL fallback */}
              {!redirectUrl && !isPushWallet && (
                <div className="p-4 bg-muted/50 rounded-lg w-full text-center">
                  <p className="text-sm text-muted-foreground">Silakan cek aplikasi {methodName} di HP pelanggan.</p>
                </div>
              )}

              {/* Waiting indicator */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Menunggu konfirmasi pembayaran...</span>
              </div>
            </>
          )}



          {/* FAILED */}
          {status === "FAILED" && (
            <div className="w-full py-8 flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-xl text-red-600">
              <XCircle className="w-16 h-16 mb-3" />
              <div className="font-bold text-lg">Pembayaran Gagal</div>
              <p className="text-sm mt-1 text-muted-foreground">Silakan coba metode lain atau ulangi transaksi.</p>
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
              Batal
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
                Simulasi Sukses
              </Button>
            )}
          </div>
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
            await onCancelOrder?.(`Dibatalkan oleh kasir dari layar ${methodName}`)
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
