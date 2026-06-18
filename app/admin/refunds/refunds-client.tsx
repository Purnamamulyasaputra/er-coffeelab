"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

function formatMoney(amount: number) {
  return "Rp " + Number(amount).toLocaleString("id-ID").replace(/,/g, '.')
}

export function RefundsClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [orderId, setOrderId] = React.useState("")
  const [type, setType] = React.useState("FULL")
  const [amount, setAmount] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [method, setMethod] = React.useState("CASH")

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Order", accessorKey: "order" as const },
    {
      header: "Type",
      cell: (item: any) => (
        <Badge variant={item.type === "FULL" ? "destructive" : item.type === "PARTIAL" ? "warning" : "secondary"}>
          {item.type}
        </Badge>
      )
    },
    { header: "Amount", cell: (item: any) => formatMoney(item.amount) },
    { header: "Reason", accessorKey: "reason" as const },
    { header: "Method", accessorKey: "method" as const },
    {
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.status === "PENDING" ? "warning" : "success"}>
          {item.status}
        </Badge>
      )
    },
    { header: "By", accessorKey: "by" as const },
    {
      header: "Actions",
      cell: () => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => setOpen(true)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => toast("Deleted", "error")}><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: Number(orderId), // Requires numeric order ID in this simple form
          refund_type: type,
          amount: Number(amount),
          reason,
          refund_method: method
        })
      })

      if (!res.ok) throw new Error("Failed to process refund. Order ID must be numeric internal ID.")

      toast("Refund processed successfully!", "success")
      setOpen(false)
      router.refresh()

      setOrderId("")
      setAmount("")
      setReason("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Request and approve"
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Process Refund
          </Button>
        }
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Internal Order ID (Number)</Label>
            <Input type="number" placeholder="Order ID" value={orderId} onChange={e => setOrderId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select options={[
              { label: "FULL", value: "FULL" },
              { label: "PARTIAL", value: "PARTIAL" },
              { label: "VOID", value: "VOID" }
            ]} value={type} onChange={e => setType(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Amount</Label>
            <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Method</Label>
            <Select options={[
              { label: "CASH", value: "CASH" },
              { label: "ORIGINAL_PAYMENT", value: "ORIGINAL_PAYMENT" }
            ]} value={method} onChange={e => setMethod(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button 
            variant="secondary" 
            onClick={() => setOpen(false)} 
            disabled={loading} 
            className="bg-slate-600 hover:bg-slate-700 text-white border-0 font-medium px-6"
          >
            Cancel
          </Button>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={handleSave} 
            disabled={loading || !orderId || !amount}
          >
            <Check size={16} /> {loading ? "Processing..." : "Process Refund"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
