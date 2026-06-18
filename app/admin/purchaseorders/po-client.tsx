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

function getStatusVariant(status: string): any {
  if (status === "APPROVED") return "cool"
  if (status === "RECEIVED") return "success"
  if (status === "SUBMITTED") return "warning"
  if (status === "CANCELLED") return "destructive"
  return "default"
}

export function PurchaseOrdersClient({ 
  initialData, suppliers, branches 
}: { 
  initialData: any[], suppliers: any[], branches: any[] 
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [supplierId, setSupplierId] = React.useState(suppliers[0]?.id?.toString() || "")
  const [branchId, setBranchId] = React.useState(branches[0]?.id?.toString() || "")
  const [total, setTotal] = React.useState("")

  const columns = [
    { header: "PO#", accessorKey: "id" as const },
    { header: "Supplier", accessorKey: "supplier" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Total", cell: (item: any) => formatMoney(item.total) },
    { 
      header: "Status", 
      cell: (item: any) => {
        return (
          <Badge variant={getStatusVariant(item.status)}>
            {item.status}
          </Badge>
        )
      }
    },
    { header: "By", accessorKey: "by" as const },
    { header: "Date", accessorKey: "date" as const },
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

  const supplierOptions = suppliers.map(s => ({ label: s.name, value: s.id.toString() }))
  const branchOptions = branches.map(b => ({ label: b.name, value: b.id.toString() }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/purchaseorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: Number(supplierId),
          branch_id: Number(branchId),
          total_amount: Number(total)
        })
      })

      if (!res.ok) throw new Error("Failed to save PO")
      
      toast("Purchase Order created successfully!", "success")
      setOpen(false)
      router.refresh()
      
      setTotal("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader 
        title="Purchase Orders" 
        description="Procurement" 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        } 
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add Purchase Order</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Supplier</Label>
            <Select options={supplierOptions} value={supplierId} onChange={e => setSupplierId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Branch</Label>
            <Select options={branchOptions} value={branchId} onChange={e => setBranchId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Total</Label>
            <Input type="number" placeholder="Total" value={total} onChange={e => setTotal(e.target.value)} />
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
            disabled={loading || !total}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
