"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export function StockClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  const columns = [
    { header: "No", accessorKey: "id" as const },
    { header: "Product", accessorKey: "product" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Stock", accessorKey: "stock" as const },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === "AVAILABLE" ? "success" : "destructive"}>
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

  return (
    <div>
      <PageHeader 
        title="Stock Availability" 
        description="Per-branch availability" 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add Stock
          </Button>
        }
      />

      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Stock Quantity</Label>
            <Input type="number" placeholder="Stock" />
          </div>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <Switch id="stock-avail" defaultChecked />
            <Label htmlFor="stock-avail" className="text-[13px] font-semibold text-foreground">Available</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={() => { setOpen(false); toast("Saved", "success"); }}>
            <Check size={14} /> Save
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
