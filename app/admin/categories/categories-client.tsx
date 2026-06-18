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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"

export function CategoriesClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [sort, setSort] = React.useState("1")
  const [active, setActive] = React.useState(true)

  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  const openAddModal = () => {
    setEditId(null)
    setName("")
    setSort((initialData.length + 1).toString())
    setActive(true)
    setOpen(true)
  }

  const openEditModal = (item: any) => {
    setEditId(item.id)
    setName(item.name || "")
    setSort(item.sort?.toString() || "1")
    setActive(item.status === "ACTIVE")
    setOpen(true)
  }

  const columns = [
    { header: "No", cell: (_: any, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { header: "Products", accessorKey: "products" as const },
    { header: "Sort", accessorKey: "sort" as const },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === "ACTIVE" ? "success" : "destructive"}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => openEditModal(item)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => {
            setDeleteId(item.id)
            setDeleteModalOpen(true)
          }}>
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const url = editId ? `/api/categories/${editId}` : "/api/categories"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sort_order: Number(sort),
          status: active ? "ACTIVE" : "INACTIVE"
        })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save category")
      }
      
      toast(editId ? "Category updated successfully!" : "Category added successfully!", "success")
      setOpen(false)
      router.refresh()
      
      setName("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/categories/${deleteId}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to delete category")
      }
      toast("Category deleted successfully!", "success")
      setDeleteModalOpen(false)
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
        title="Categories" 
        description={`${initialData.length} items`} 
        action={
          <Button onClick={openAddModal} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        }
      />

      <DataTable 
        data={initialData}
        columns={columns}
        keyExtractor={item => item.id.toString()}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Sort</Label>
            <Input type="number" placeholder="Sort" value={sort} onChange={e => setSort(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <Switch id="active-category" checked={active} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActive(e.target.checked)} />
            <Label htmlFor="active-category" className="text-[13px] font-semibold text-foreground">Active</Label>
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
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Products assigned to this category might need to be reassigned."
        confirmText={loading ? "Deleting..." : "Yes, Delete"}
        type="danger"
      />
    </div>
  )
}
