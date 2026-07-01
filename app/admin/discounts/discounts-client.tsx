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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export function DiscountsClient({ initialData, role }: { initialData: any[], role?: string }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [editId, setEditId] = React.useState<number | null>(null)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState("PERCENTAGE")
  const [value, setValue] = React.useState("")
  const [scope, setScope] = React.useState("ORDER")
  const [isActive, setIsActive] = React.useState(true)

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [discountToDelete, setDiscountToDelete] = React.useState<any>(null)

  const handleOpenAdd = () => {
    setEditId(null)
    setName("")
    setType("PERCENTAGE")
    setValue("")
    setScope("ORDER")
    setIsActive(true)
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditId(item.id)
    setName(item.name)
    setType(item.type)
    setValue(item.value.toString())
    setScope(item.scope)
    setIsActive(item.status === "ACTIVE")
    setOpen(true)
  }

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { header: "Type", cell: (item: any) => item.type === "PERCENTAGE" ? "Percentage" : "Fixed Amount" },
    { header: "Value", cell: (item: any) => item.type === "PERCENTAGE" ? `${item.value}%` : `Rp ${Number(item.value).toLocaleString('id-ID')}` },
    { header: "Scope", cell: (item: any) => item.scope === "ORDER" ? "Order" : "Item" },
    {
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.status === "ACTIVE" ? "success" : "destructive"}>
          {item.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      )
    },
    ...(role === "SUPERADMIN" ? [{
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEdit(item)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setDiscountToDelete(item); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
        </div>
      )
    }] : [])
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const url = editId ? `/api/discounts/${editId}` : "/api/discounts"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          value: Number(value),
          scope,
          requires_pin: false, // Legacy field, no longer used in UI
          is_active: isActive
        })
      })

      if (!res.ok) throw new Error(`Failed to ${editId ? 'update' : 'save'} discount`)

      toast(`Discount ${editId ? 'updated' : 'saved'} successfully!`, "success")
      setOpen(false)
      router.refresh()

      setName("")
      setValue("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!discountToDelete) return
    setLoading(true)
    try {
      const res = await fetch(`/api/discounts/${discountToDelete.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete discount")
      }
      toast("Discount deleted successfully", "success")
      setDeleteModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Discounts"
        description="POS presets"
        action={
          role === "SUPERADMIN" ? (
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus size={14} /> Add
            </Button>
          ) : undefined
        }
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Discount" : "Add Discounts"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select options={[
              { label: "Percentage", value: "PERCENTAGE" },
              { label: "Fixed Amount", value: "FIXED" }
            ]} value={type} onChange={e => setType(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Value</Label>
            <Input type="number" placeholder="Value" value={value} onChange={e => setValue(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Scope</Label>
            <Select options={[
              { label: "Order", value: "ORDER" },
              { label: "Item", value: "ITEM" }
            ]} value={scope} onChange={e => setScope(e.target.value)} />
          </div>
          <div className="flex flex-col gap-4 mt-3 mb-2">
            <div className="flex items-center gap-3">
              <Switch id="active-disc" checked={isActive} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)} />
              <Label htmlFor="active-disc" className="text-[13px] font-semibold text-foreground">Active</Label>
            </div>
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
            disabled={loading || !name || !value}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Discount"
        message={<>Are you sure you want to delete?</>}
        confirmText={loading ? "Deleting..." : "Delete"}
        type="danger"
      />
    </div>
  )
}
