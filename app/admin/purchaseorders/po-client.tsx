"use client"

import * as React from "react"
import { Pencil, Trash2, Check } from "lucide-react"
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
  const [items, setItems] = React.useState<{ ingredientId: string, name: string, quantity: string, price: string, unit: string }[]>([])

  const [editPoNumber, setEditPoNumber] = React.useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const [markReceivedModalOpen, setMarkReceivedModalOpen] = React.useState(false)
  const [markReceivedPoId, setMarkReceivedPoId] = React.useState<string | null>(null)

  const columns = [
    { header: "PO#", cell: (item: any) => <span className="whitespace-nowrap font-medium">{item.id}</span> },
    { header: "Supplier", cell: (item: any) => <span className="whitespace-nowrap">{item.supplier}</span> },
    ...(!activeBranchId ? [{ header: "Branch", cell: (item: any) => <span className="whitespace-nowrap">{item.branch}</span> }] : []),
    { header: "Total", cell: (item: any) => <span className="whitespace-nowrap">{formatMoney(item.total)}</span> },
    {
      header: "Status",
      cell: (item: any) => {
        return (
          <span className="whitespace-nowrap">
            <Badge variant={getStatusVariant(item.status)}>
              {item.status}
            </Badge>
          </span>
        )
      }
    },
    { header: "By", cell: (item: any) => <span className="whitespace-nowrap">{item.by}</span> },
    { header: "Date", cell: (item: any) => <span className="whitespace-nowrap">{item.date}</span> },
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
      setItems(ingredients.map(ing => {
        const existingItem = data.items.find((i: any) => i.ingredient_id.toString() === ing.id.toString());
        return {
          ingredientId: ing.id.toString(),
          name: ing.name,
          quantity: existingItem ? existingItem.quantity.toString() : "",
          price: existingItem ? existingItem.price.toString() : ing.cost.toString(),
          unit: ing.unit
        }
      }));
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
    setItems(ingredients.map(ing => ({
      ingredientId: ing.id.toString(),
      name: ing.name,
      quantity: "",
      price: ing.cost.toString(),
      unit: ing.unit
    })));
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



  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    const itemToUpdate = newItems[index] as any;
    itemToUpdate[field] = value;

    setItems(newItems);
  }

  const calculatedTotal = items.reduce((acc, curr) => {
    return acc + (Number(curr.quantity) * Number(curr.price));
  }, 0);

  const handleSave = async () => {
    const validItems = items.filter(i => Number(i.quantity) > 0);

    if (validItems.length === 0) {
      toast("Please enter a quantity for at least one item", "error");
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
          items: validItems.map(i => ({
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
          <Button onClick={handleAdd} className="bg-primary text-primary-foreground gap-2">
            Add
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
            <div className="flex justify-between items-center border-b pb-2">
              <Label className="text-base font-semibold">Ingredients List</Label>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-6 text-slate-500 border border-dashed rounded-md bg-slate-50">No ingredients available.</div>
            ) : (
              <div className="pb-4 overflow-x-auto border rounded-md">
                <table className="w-full text-[13px] text-left">
                  <thead className="text-xs text-slate-500 bg-slate-100/80 uppercase sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 font-semibold border-b">Ingredient</th>
                      <th className="px-3 py-2 font-semibold border-b w-[100px]">Qty</th>
                      <th className="px-3 py-2 font-semibold border-b w-[120px]">Unit Price</th>
                      <th className="px-3 py-2 font-semibold border-b w-[120px] text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const subtotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-1.5 font-medium text-slate-700">
                            {item.name} <span className="text-slate-400 font-normal">({item.unit})</span>
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="text"
                              className="h-7 text-[13px] bg-background border-slate-200 px-2 shadow-none focus-visible:ring-1"
                              placeholder="0"
                              value={item.quantity ? Number(item.quantity).toLocaleString('id-ID') : ""}
                              onChange={e => updateItem(idx, 'quantity', e.target.value.replace(/\D/g, ''))}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              type="text"
                              className="h-7 text-[13px] bg-background border-slate-200 px-2 shadow-none focus-visible:ring-1"
                              value={item.price ? Number(item.price).toLocaleString('id-ID') : ""}
                              onChange={e => updateItem(idx, 'price', e.target.value.replace(/\D/g, ''))}
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold text-slate-600">
                            {subtotal > 0 ? subtotal.toLocaleString('id-ID') : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {items.length > 0 && (
              <div className="flex justify-between items-center mt-2 p-3 bg-slate-100 rounded-lg font-semibold">
                <span className="text-slate-600">Total Amount</span>
                <span className="text-emerald-700 text-lg">{formatMoney(calculatedTotal)}</span>
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
        title="Delete Purchase Order"
        message="Are you sure you want to delete?"
        onConfirm={handleDelete}
        confirmText={loading ? "Deleting..." : "Delete"}
      />

      <ConfirmationModal
        isOpen={markReceivedModalOpen}
        onClose={() => setMarkReceivedModalOpen(false)}
        type="info"
        title="Mark as Received"
        message={`Are you sure you want to mark this ${markReceivedPoId} as received?`}
        onConfirm={handleMarkReceived}
        confirmText={loading ? "Processing..." : "Yes"}
      />
    </div>
  )
}
