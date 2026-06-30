"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
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
  initialData, suppliers, branches, ingredients, activeBranchId
}: {
  initialData: any[], suppliers: any[], branches: any[], ingredients: any[], activeBranchId?: number
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [supplierId, setSupplierId] = React.useState(suppliers[0]?.id?.toString() || "")
  const [branchId, setBranchId] = React.useState(activeBranchId?.toString() || branches[0]?.id?.toString() || "")
  const [items, setItems] = React.useState<{ ingredientId: string, quantity: string, price: string, unit: string }[]>([])

  const [editPoNumber, setEditPoNumber] = React.useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const [markReceivedModalOpen, setMarkReceivedModalOpen] = React.useState(false)
  const [markReceivedPoId, setMarkReceivedPoId] = React.useState<string | null>(null)

  const columns = [
    { header: "PO#", accessorKey: "id" as const },
    { header: "Supplier", accessorKey: "supplier" as const },
    ...(!activeBranchId ? [{ header: "Branch", accessorKey: "branch" as const }] : []),
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
      cell: (item: any) => (
        <div className="flex gap-1">
          {item.status === 'SUBMITTED' && (
            <Button
              size="icon"
              className="h-[34px] w-[34px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px]"
              onClick={() => { setMarkReceivedPoId(item.id); setMarkReceivedModalOpen(true); }}
              disabled={loading}
              title="Mark as Received"
            >
              <Check size={14} />
            </Button>
          )}
          {item.status !== 'RECEIVED' && (
            <>
              <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleEdit(item.id)}><Pencil size={14} /></Button>
              <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setDeleteId(item.id); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
            </>
          )}
        </div>
      )
    }
  ]

  const supplierOptions = suppliers.map(s => ({ label: s.name, value: s.id.toString() }))
  const branchOptions = branches.map(b => ({ label: b.name, value: b.id.toString() }))
  const ingredientOptions = ingredients.map(i => ({ label: `${i.name} (${i.unit})`, value: i.id.toString() }))

  const handleMarkReceived = async () => {
    if (!markReceivedPoId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/purchaseorders/${markReceivedPoId}`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast("PO marked as received! Stock has been added.", "success");
      setMarkReceivedModalOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = async (poNumber: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchaseorders/${poNumber}`);
      if (!res.ok) throw new Error("Failed to fetch PO details");
      const data = await res.json();

      setEditPoNumber(poNumber);
      setSupplierId(data.po.supplier_id.toString());
      setBranchId(data.po.branch_id.toString());
      setItems(data.items.map((i: any) => ({
        ingredientId: i.ingredient_id.toString(),
        quantity: i.quantity.toString(),
        price: i.price.toString(),
        unit: i.unit
      })));
      setOpen(true);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = () => {
    setEditPoNumber(null);
    setSupplierId(suppliers[0]?.id?.toString() || "");
    setBranchId(activeBranchId?.toString() || branches[0]?.id?.toString() || "");
    setItems([]);
    setOpen(true);
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/purchaseorders/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete PO");

      toast("Purchase Order deleted successfully", "success");
      setDeleteModalOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const addItem = () => {
    if (ingredients.length === 0) return;
    const firstIng = ingredients[0];
    setItems([...items, { ingredientId: firstIng.id.toString(), quantity: "1", price: firstIng.cost.toString(), unit: firstIng.unit }])
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    const itemToUpdate = newItems[index] as any;
    itemToUpdate[field] = value;

    // Auto update price and unit when ingredient changes
    if (field === 'ingredientId') {
      const ing = ingredients.find(i => i.id.toString() === value);
      if (ing) {
        itemToUpdate.price = ing.cost.toString();
        itemToUpdate.unit = ing.unit;
      }
    }

    setItems(newItems);
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  }

  const calculatedTotal = items.reduce((acc, curr) => {
    return acc + (Number(curr.quantity) * Number(curr.price));
  }, 0);

  const handleSave = async () => {
    if (items.length === 0) {
      toast("Please add at least one item", "error");
      return;
    }

    setLoading(true)
    try {
      const url = editPoNumber ? `/api/purchaseorders/${editPoNumber}` : "/api/purchaseorders"
      const method = editPoNumber ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: Number(supplierId),
          branch_id: Number(branchId),
          total_amount: calculatedTotal,
          items: items.map(i => ({
            ingredient_id: Number(i.ingredientId),
            quantity: Number(i.quantity),
            price: Number(i.price),
            unit: i.unit
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save PO")

      toast(`Purchase Order ${editPoNumber ? "updated" : "created"} successfully!`, "success")
      setOpen(false)
      setItems([])
      router.refresh()
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
          <Button onClick={handleAdd} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        }
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen} className="max-w-3xl flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>{editPoNumber ? `Edit ${editPoNumber}` : "Add Purchase Order"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2 overflow-y-auto px-1 flex-1">
          <div className={`grid ${!activeBranchId ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            <div className="flex flex-col gap-1.5">
              <Label>Supplier</Label>
              <Select options={supplierOptions} value={supplierId} onChange={e => setSupplierId(e.target.value)} />
            </div>
            {!activeBranchId && (
              <div className="flex flex-col gap-1.5">
                <Label>Branch</Label>
                <Select options={branchOptions} value={branchId} onChange={e => setBranchId(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Items</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="h-8 gap-1"><Plus size={14} /> Add Item</Button>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-6 text-slate-500 border border-dashed rounded-md bg-slate-50">No items added yet.</div>
            ) : (
              <div className="flex flex-col gap-4 pb-48">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-end">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Label className="text-sm">Ingredient</Label>
                      <Select options={ingredientOptions} value={item.ingredientId} onChange={e => updateItem(idx, 'ingredientId', e.target.value)} />
                    </div>
                    <div className="w-24 flex flex-col gap-1.5">
                      <Label className="text-sm">Qty ({item.unit})</Label>
                      <Input
                        type="text"
                        className="bg-background"
                        value={item.quantity ? Number(item.quantity).toLocaleString('id-ID') : ""}
                        onChange={e => updateItem(idx, 'quantity', e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="w-32 flex flex-col gap-1.5">
                      <Label className="text-sm">Unit Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-500">Rp</span>
                        <Input
                          type="text"
                          className="pl-8 bg-background"
                          value={item.price ? Number(item.price).toLocaleString('id-ID') : ""}
                          onChange={e => updateItem(idx, 'price', e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10 mb-[1px]" onClick={() => removeItem(idx)}>
                      <X size={16} />
                    </Button>
                  </div>
                ))}

                <div className="flex justify-between items-center mt-4 p-4 bg-slate-100 rounded-lg font-semibold">
                  <span className="text-slate-600">Total Amount</span>
                  <span className="text-emerald-700 text-xl">{formatMoney(calculatedTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4 pt-4 border-t">
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
            disabled={loading || items.length === 0}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save PO"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Hapus Purchase Order"
        message="Apakah Anda yakin ingin menghapus purchase order ini?"
        onConfirm={handleDelete}
        confirmText={loading ? "Menghapus..." : "Hapus"}
      />

      <ConfirmationModal
        isOpen={markReceivedModalOpen}
        onClose={() => setMarkReceivedModalOpen(false)}
        type="info"
        title="Tandai Diterima"
        message={`Apakah Anda yakin ingin menandai ${markReceivedPoId} sebagai diterima?`}
        onConfirm={handleMarkReceived}
        confirmText={loading ? "Memproses..." : "Ya"}
      />
    </div>
  )
}
