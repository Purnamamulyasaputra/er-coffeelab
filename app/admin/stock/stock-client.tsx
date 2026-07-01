"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"

export function StockClient({
  initialData,
  products = [],
  branches = [],
  currentBranchId,
  role
}: {
  initialData: any[],
  products?: any[],
  branches?: any[],
  currentBranchId?: number,
  role?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [isAvailable, setIsAvailable] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [selectedBranchId, setSelectedBranchId] = React.useState(currentBranchId?.toString() || branches[0]?.id?.toString() || "")
  const [selectedProductId, setSelectedProductId] = React.useState("")
  const [newStockStatus, setNewStockStatus] = React.useState("AVAILABLE")

  const selectedBranchName = branches.find(b => b.id.toString() === selectedBranchId)?.name;

  const availableProducts = React.useMemo(() => {
    return products.filter(p => {
      return !initialData.some(stock => stock.product === p.name && stock.branch === selectedBranchName);
    });
  }, [products, initialData, selectedBranchName]);

  const productOptions = availableProducts.map(p => ({ label: p.name, value: p.id.toString() }))

  React.useEffect(() => {
    if (productOptions.length > 0 && !productOptions.find(o => o.value === selectedProductId)) {
      setSelectedProductId(productOptions[0].value)
    } else if (productOptions.length === 0) {
      setSelectedProductId("")
    }
  }, [productOptions, selectedProductId])

  const branchOptions = branches.map(b => ({ label: b.name, value: b.id.toString() }))

  const handleToggleStatus = async (item: any, isAvailable: boolean) => {
    try {
      const res = await fetch(`/api/stock/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isAvailable ? "AVAILABLE" : "OUT_OF_STOCK" })
      })

      if (!res.ok) throw new Error("Failed to update stock")

      toast(`Stock updated to ${isAvailable ? "Available" : "Out of Stock"}`, "success")
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    }
  }

  const handleSave = async () => {
    if (!editId) return;
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isAvailable ? "AVAILABLE" : "OUT_OF_STOCK" })
      })

      if (!res.ok) throw new Error("Failed to update stock")

      toast("Stock updated successfully", "success")
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete stock")
      toast("Stock deleted successfully", "success")
      setDeleteModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: Number(selectedBranchId),
          product_id: Number(selectedProductId),
          stock_status: newStockStatus
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add stock")

      toast("Stock added successfully", "success")
      setAddModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const baseColumns = [
    { header: "No", cell: (_: any, index: number) => index + 1 },
    { header: "Product", accessorKey: "product" as const },
    { header: "Branch", accessorKey: "branch" as const },
    {
      header: "Stock Status",
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <Switch
            id={`stock-${item.id}`}
            checked={item.status === "AVAILABLE"}
            disabled={role === "EMPLOYEE"}
            onChange={(e: any) => handleToggleStatus(item, e.target.checked)}
          />
          <Label htmlFor={`stock-${item.id}`} className={`text-[12px] ${item.status === "AVAILABLE" ? "text-success font-bold" : "text-destructive font-bold"}`}>
            {item.status === "AVAILABLE" ? "Available" : "Out of Stock"}
          </Label>
        </div>
      )
    },
    ...(role === "SUPERADMIN" ? [{
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setDeleteId(item.id); setDeleteModalOpen(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }] : [])
  ];

  const columns = currentBranchId
    ? baseColumns.filter(col => col.header !== "Branch")
    : baseColumns;

  return (
    <div>
      <PageHeader
        title="Stock Availability"
        description="Per-branch availability"
        action={
          role === "SUPERADMIN" ? (
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus size={14} /> Add Stock
            </Button>
          ) : undefined
        }
      />

      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />


      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Delete Stock"
        message={<>Are you sure you want to delete this stock entry?</>}
        onConfirm={handleDelete}
        confirmText={loading ? "Deleting..." : "Delete"}
      />

      {/* Add Stock Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogHeader>
          <DialogTitle>Add New Stock</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {!currentBranchId && (
            <div className="flex flex-col gap-1.5">
              <Label>Branch</Label>
              <Select options={branchOptions} value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Product</Label>
            {productOptions.length > 0 ? (
              <Select options={productOptions} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} />
            ) : (
              <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/20">Semua produk sudah terdaftar di cabang ini.</div>
            )}
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            <Label>Stock Status</Label>
            <Select
              options={[
                { label: "Available", value: "AVAILABLE" },
                { label: "Out of Stock", value: "OUT_OF_STOCK" }
              ]}
              value={newStockStatus}
              onChange={e => setNewStockStatus(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button
            variant="secondary"
            onClick={() => setAddModalOpen(false)}
            disabled={loading}
            className="bg-slate-600 hover:bg-slate-700 text-white border-0 font-medium px-6"
          >
            Cancel
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddSave}
            disabled={loading || !selectedBranchId || !selectedProductId}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
