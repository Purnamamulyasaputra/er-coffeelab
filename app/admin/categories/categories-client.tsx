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
import { useRouter } from "next/navigation"

export function CategoriesClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [sort, setSort] = React.useState("1")
  const [active, setActive] = React.useState(true)

  const columns = [
    { header: "No", accessorKey: "id" as const },
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
      cell: () => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => setOpen(true)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => toast("Deleted", "error")}>
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sort_order: Number(sort),
          status: active ? "ACTIVE" : "INACTIVE"
        })
      })

      if (!res.ok) throw new Error("Failed to save category")
      
      toast("Category saved successfully!", "success")
      setOpen(false)
      router.refresh()
      
      setName("")
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
          <Button onClick={() => setOpen(true)} className="gap-2">
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
          <DialogTitle>Add Categories</DialogTitle>
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
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading || !name}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
