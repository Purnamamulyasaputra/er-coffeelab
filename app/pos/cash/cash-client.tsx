"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"

import { Plus, Pencil, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"



function formatMoney(amount: number) {
  return "IDR " + amount.toLocaleString("id-ID")
}

export function CashClient({ initialData, activeShift }: { initialData: any[], activeShift?: any }) {
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Shift ID", accessorKey: "shiftId" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { 
      header: "Type", 
      cell: (item: any) => (
        <Badge variant={item.type === "IN" ? "success" : "destructive"}>
          {item.type}
        </Badge>
      )
    },
    { header: "Amount", cell: (item: any) => formatMoney(item.amount) },
    { header: "Reason", accessorKey: "reason" as const },
    { header: "Time", accessorKey: "time" as const },
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
        title="Cash Management" 
        description="Petty cash movements and till adjustments" 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} />
            Add
          </Button>
        }
      />
      <DataTable 
        data={initialData}
        columns={columns}
        keyExtractor={item => item.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add Cash Movement</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select options={[
              {label: "IN", value: "IN"},
              {label: "OUT", value: "OUT"}
            ]} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Amount (IDR)</Label>
            <Input type="number" placeholder="50000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Input placeholder="Reason for movement" />
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
