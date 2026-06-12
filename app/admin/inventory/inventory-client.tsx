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
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

function formatMoney(amount: number) {
  return "IDR " + amount.toLocaleString("id-ID").replace(/,/g, '.')
}

export function InventoryClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [unit, setUnit] = React.useState("g")
  const [cost, setCost] = React.useState("")
  const [min, setMin] = React.useState("")
  const [category, setCategory] = React.useState("COFFEE_BEAN")

  const columns = [
    { header: "SKU", accessorKey: "sku" as const },
    { header: "Name", accessorKey: "name" as const },
    { header: "Unit", accessorKey: "unit" as const },
    { header: "Cost", cell: (item: any) => formatMoney(item.cost) },
    { header: "Stock", accessorKey: "stock" as const },
    { header: "Min", accessorKey: "min" as const },
    { 
      header: "Status", 
      cell: (item: any) => {
        const isOk = Number(item.stock) >= Number(item.min)
        return (
          <Badge variant={isOk ? "success" : "destructive"}>
            {isOk ? "OK" : "LOW"}
          </Badge>
        )
      }
    },
    {
      header: "Actions",
      cell: () => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => setOpen(true)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => toast("Deleted", "error")}><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          name,
          unit,
          cost: Number(cost),
          min: Number(min),
          category
        })
      })

      if (!res.ok) throw new Error("Failed to save ingredient")
      
      toast("Ingredient saved successfully!", "success")
      setOpen(false)
      router.refresh()
      
      setName("")
      setSku("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader 
        title="Ingredients" 
        description={`${initialData.length} materials`} 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        } 
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add Ingredients</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>SKU</Label>
            <Input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Unit</Label>
            <Select 
              options={[
                {label: "g", value: "g"},
                {label: "ml", value: "ml"},
                {label: "pcs", value: "pcs"}
              ]} 
              value={unit} onChange={e => setUnit(e.target.value)} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cost/Unit</Label>
            <Input type="number" placeholder="Cost/Unit" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Min Alert</Label>
            <Input type="number" placeholder="Min Alert" value={min} onChange={e => setMin(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select 
              options={[
                {label: "COFFEE_BEAN", value: "COFFEE_BEAN"},
                {label: "SYRUP", value: "SYRUP"},
                {label: "MILK", value: "MILK"}
              ]} 
              value={category} onChange={e => setCategory(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading || !name || !sku}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
