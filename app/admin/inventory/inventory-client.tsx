"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, AlertTriangle } from "lucide-react"
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
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

function formatMoney(amount: number | string) {
  return "Rp " + Number(amount).toLocaleString("id-ID")
}

function formatNumber(amount: number | string) {
  return Number(amount).toLocaleString("id-ID", { maximumFractionDigits: 2 })
}

export function InventoryClient({ initialData, role = "SUPERADMIN", branchId }: { initialData: any[], role?: string, branchId?: number | null }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [editId, setEditId] = React.useState<number | null>(null)
  const [name, setName] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [unit, setUnit] = React.useState("g")
  const [cost, setCost] = React.useState("")
  const [min, setMin] = React.useState("")
  const [category, setCategory] = React.useState("COFFEE_BEAN")

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<any>(null)

  const handleOpenAdd = () => {
    setEditId(null)
    setName("")
    setSku("")
    setUnit("g")
    setCost("")
    setMin("")
    setCategory("COFFEE_BEAN")
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditId(item.id)
    setName(item.name)
    setSku(item.sku)
    setUnit(item.unit)
    setCost(item.cost.toString())
    setMin(item.min.toString())
    setCategory(item.category || "COFFEE_BEAN")
    setOpen(true)
  }

  const getStockStatus = (stock: number, min: number) => {
    if (stock === 0) return { label: "Out", variant: "destructive", pulse: true }
    if (stock < min) return { label: "Critical", variant: "destructive", pulse: false }
    if (stock < min * 1.5) return { label: "Low", variant: "warning", pulse: false }
    return { label: "OK", variant: "success", pulse: false }
  }

  const columns = [
    { header: "SKU", accessorKey: "sku" as const },
    { header: "Name", accessorKey: "name" as const },
    { header: "Unit", accessorKey: "unit" as const },
    { header: "Cost", cell: (item: any) => formatMoney(item.cost) },
    { header: "Stock", cell: (item: any) => formatNumber(item.stock) },
    { header: "Min", cell: (item: any) => formatNumber(item.min) },
    {
      header: "Status",
      cell: (item: any) => {
        const status = getStockStatus(Number(item.stock), Number(item.min))
        return (
          <Badge variant={status.variant as any} className={status.pulse ? "animate-pulse" : ""}>
            {status.label}
          </Badge>
        )
      }
    },
    ...(role === "SUPERADMIN" ? [{
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEdit(item)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setItemToDelete(item); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
        </div>
      )
    }] : [])
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const url = editId ? `/api/inventory/${editId}` : "/api/inventory"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          name,
          unit,
          cost: Number(cost),
          min: Number(min),
          category
        })
      })

      if (!res.ok) throw new Error(`Failed to ${editId ? 'update' : 'save'} ingredient`)

      toast(`Ingredient ${editId ? 'updated' : 'saved'} successfully!`, "success")
      setOpen(false)
      router.refresh()

      setName("")
      setSku("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory/${itemToDelete.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete ingredient")
      }
      toast("Ingredient deleted successfully", "success")
      setDeleteModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const criticalItems = initialData.filter(item => {
    const status = getStockStatus(Number(item.stock), Number(item.min))
    return status.label === "Critical" || status.label === "Out"
  })

  return (
    <div>
      <PageHeader
        title="Ingredients"
        description={`${initialData.length} materials`}
        action={
          role === "SUPERADMIN" ? (
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus size={14} /> Add
            </Button>
          ) : null
        }
      />

      {criticalItems.length > 0 && (
        <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-destructive/20 p-2 rounded-full mt-0.5">
            <AlertTriangle size={16} className="text-destructive" />
          </div>
          <div>
            <h4 className="text-destructive font-bold text-[14px]">Stock Alert</h4>
            <p className="text-destructive/80 text-[12px] mt-0.5">
              You have {criticalItems.length} ingredient(s) that are low on stock or completely out of stock. Please reorder soon.
            </p>
          </div>
        </div>
      )}

      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Ingredient" : "Add Ingredient"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>SKU</Label>
            <Input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Unit</Label>
            <Select
              options={[
                { label: "g", value: "g" },
                { label: "ml", value: "ml" },
                { label: "pcs", value: "pcs" }
              ]}
              value={unit} onChange={e => setUnit(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cost/Unit</Label>
            <Input type="number" placeholder="Cost/Unit" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Min Alert</Label>
            <Input type="number" placeholder="Min Alert" value={min} onChange={e => setMin(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              options={[
                { label: "Coffee Bean", value: "COFFEE_BEAN" },
                { label: "Syrup", value: "SYRUP" },
                { label: "Milk", value: "MILK" },
                { label: "Food", value: "FOOD" },
                { label: "Packaging", value: "PACKAGING" },
                { label: "Other", value: "OTHER" }
              ]}
              value={category} onChange={e => setCategory(e.target.value)}
            />
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
            disabled={loading || !name || !sku}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Ingredient"
        message={`Are you sure you want to delete?`}
        confirmText={loading ? "Deleting..." : "Delete"}
        type="danger"
      />
    </div>
  )
}
