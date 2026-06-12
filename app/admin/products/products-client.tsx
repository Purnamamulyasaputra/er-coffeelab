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

function formatMoney(amount: number) {
  return "IDR " + amount.toLocaleString("id-ID")
}

export function ProductsClient({ initialData, categories }: { initialData: any[], categories: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [catId, setCatId] = React.useState(categories[0]?.id?.toString() || "")
  const [price, setPrice] = React.useState("")
  const [cost, setCost] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [badge, setBadge] = React.useState("-")
  const [active, setActive] = React.useState(true)

  const columns = [
    { header: "No", accessorKey: "id" as const },
    { header: "Name", accessorKey: "name" as const },
    { header: "Category", accessorKey: "cat" as const },
    { header: "Price", cell: (item: any) => formatMoney(item.price) },
    { header: "Cost", cell: (item: any) => formatMoney(item.cost) },
    { 
      header: "Badge", 
      cell: (item: any) => item.badge && item.badge !== "-" ? (
        <Badge variant={item.badge === "BEST_SELLER" ? "warning" : item.badge === "POPULAR" ? "secondary" : "success"}>
          {item.badge}
        </Badge>
      ) : "-"
    },
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

  const catOptions = categories.map(c => ({ label: c.name, value: c.id.toString() }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category_id: Number(catId),
          price: Number(price),
          cost: Number(cost),
          sku,
          badge: badge === "None" ? "-" : badge,
          status: active ? "ACTIVE" : "INACTIVE"
        })
      })

      if (!res.ok) throw new Error("Failed to save product")
      
      toast("Product saved successfully!", "success")
      setOpen(false)
      router.refresh()
      
      setName("")
      setPrice("")
      setCost("")
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
        title="Products" 
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
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select options={catOptions} value={catId} onChange={e => setCatId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Price (IDR)</Label>
            <Input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cost/COGS (IDR)</Label>
            <Input type="number" placeholder="Cost" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>SKU</Label>
            <Input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Badge</Label>
            <Select 
              options={[
                {label: "None", value: "None"},
                {label: "BEST_SELLER", value: "BEST_SELLER"},
                {label: "NEW", value: "NEW"},
                {label: "POPULAR", value: "POPULAR"},
                {label: "PROMO", value: "PROMO"}
              ]} 
              value={badge} onChange={e => setBadge(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <Switch id="active-product" checked={active} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActive(e.target.checked)} />
            <Label htmlFor="active-product" className="text-[13px] font-semibold text-foreground">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading || !name || !price}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
