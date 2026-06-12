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
import { useRouter } from "next/navigation"

export function TablesClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Form State
  const [editId, setEditId] = React.useState<number | null>(null)
  const [branchId, setBranchId] = React.useState("1")
  const [tableNumber, setTableNumber] = React.useState("")
  const [section, setSection] = React.useState("Indoor")
  const [capacity, setCapacity] = React.useState("4")
  const [status, setStatus] = React.useState("AVAILABLE")
  const [sortOrder, setSortOrder] = React.useState("0")

  const [tableToDelete, setTableToDelete] = React.useState<{id: number, number: string} | null>(null)

  const handleOpenAdd = () => {
    setEditId(null)
    setTableNumber("")
    setSection("Indoor")
    setCapacity("4")
    setStatus("AVAILABLE")
    setSortOrder("0")
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditId(item.id)
    setBranchId(String(item.branch_id || 1))
    setTableNumber(item.table_number || "")
    setSection(item.section || "Indoor")
    setCapacity(String(item.capacity || 4))
    setStatus(item.status || "AVAILABLE")
    setSortOrder(String(item.sort_order || 0))
    setOpen(true)
  }

  const handleSave = async () => {
    if (!tableNumber) {
      toast("Table Number is required", "error")
      return
    }
    setLoading(true)
    try {
      const payload = {
        id: editId,
        branch_id: Number(branchId),
        table_number: tableNumber,
        section,
        capacity: Number(capacity),
        status,
        sort_order: Number(sortOrder)
      }
      const res = await fetch("/api/tables", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to save table")
      toast(`Table ${editId ? "updated" : "created"} successfully`, "success")
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (item: any) => {
    setTableToDelete({ id: item.id, number: item.table_number })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!tableToDelete) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tables?id=${tableToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete table")
      toast("Table deleted successfully", "success")
      setDeleteConfirmOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Table #", accessorKey: "table_number" as const },
    { header: "Section", accessorKey: "section" as const },
    { header: "Capacity", accessorKey: "capacity" as const },
    { header: "Sort", accessorKey: "sort_order" as const },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === "AVAILABLE" ? "success" : item.status === "OCCUPIED" ? "destructive" : "warning"}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEdit(item)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => handleDeleteClick(item)}>
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader 
        title="Table Management" 
        description={`Manage tables for your branches. Total: ${initialData.length} tables.`} 
        action={
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus size={14} /> Add Table
          </Button>
        }
      />

      <DataTable 
        data={initialData}
        columns={columns}
        keyExtractor={item => String(item.id)}
      />

      <Dialog open={open} onOpenChange={setOpen} className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Table" : "Add Table"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 overflow-y-auto px-2 -mx-2 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Table Number <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. T-01, V-12" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Section</Label>
            <select 
              value={section} 
              onChange={e => setSection(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Smoking">Smoking</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Capacity (Pax)</Label>
              <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="RESERVED">RESERVED</option>
              <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading || !tableNumber}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Table</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete table <span className="font-bold text-foreground">{tableToDelete?.number}</span>? 
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
