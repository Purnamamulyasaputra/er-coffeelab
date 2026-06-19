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
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"

export function SuppliersClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [contact, setContact] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")

  const columns = [
    { header: "No", cell: (_: any, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { header: "Contact", accessorKey: "contact" as const },
    { header: "Phone", accessorKey: "phone" as const },
    { header: "Email", accessorKey: "email" as const },
    { header: "POs", accessorKey: "pos" as const },
    {
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setDeleteId(item.id); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const handleEdit = (item: any) => {
    setEditId(item.id)
    setName(item.name || "")
    setContact(item.contact || "")
    setPhone(item.phone || "")
    setEmail(item.email || "")
    setOpen(true)
  }

  const handleAdd = () => {
    setEditId(null)
    setName("")
    setContact("")
    setPhone("")
    setEmail("")
    setOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const url = editId ? `/api/suppliers/${editId}` : "/api/suppliers"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, phone, email })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save supplier")

      toast(`Supplier ${editId ? "updated" : "saved"} successfully!`, "success")
      setOpen(false)
      router.refresh()

    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete supplier");

      toast("Supplier deleted successfully!", "success");
      setDeleteModalOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description={`${initialData.length} active`}
        action={
          <Button onClick={handleAdd} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        }
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label>Supplier Name</Label>
            <Input placeholder="e.g. PT Kopi" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Contact Person</Label>
            <Input placeholder="Name" value={contact} onChange={e => setContact(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Input placeholder="08..." value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="@" value={email} onChange={e => setEmail(e.target.value)} />
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
            disabled={loading || !name}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Delete Supplier"
        message="Data supplier yang dihapus tidak dapat dikembalikan."
        onConfirm={handleDelete}
        confirmText={loading ? "Deleting..." : "Delete"}
      />
    </div>
  )
}
