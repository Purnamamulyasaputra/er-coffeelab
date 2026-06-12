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

export function DiscountsClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [type, setType] = React.useState("PERCENTAGE")
  const [value, setValue] = React.useState("")
  const [scope, setScope] = React.useState("ORDER")
  const [requiresPin, setRequiresPin] = React.useState(true)
  const [isActive, setIsActive] = React.useState(true)

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { header: "Type", accessorKey: "type" as const },
    { header: "Value", accessorKey: "val" as const },
    { header: "Scope", accessorKey: "scope" as const },
    { header: "PIN Req", accessorKey: "pinReq" as const },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === "ON" ? "success" : "secondary"}>
          {item.status}
        </Badge>
      )
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
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          value: Number(value),
          scope,
          requires_pin: requiresPin,
          is_active: isActive
        })
      })

      if (!res.ok) throw new Error("Failed to save discount")
      
      toast("Discount saved successfully!", "success")
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

  return (
    <div>
      <PageHeader 
        title="Discounts" 
        description="POS presets" 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        } 
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add Discounts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select options={[
              {label: "PERCENTAGE", value: "PERCENTAGE"},
              {label: "FIXED", value: "FIXED"}
            ]} value={type} onChange={e => setType(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Value</Label>
            <Input type="number" placeholder="Value" value={value} onChange={e => setValue(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Scope</Label>
            <Select options={[
              {label: "ORDER", value: "ORDER"},
              {label: "ITEM", value: "ITEM"}
            ]} value={scope} onChange={e => setScope(e.target.value)} />
          </div>
          <div className="flex flex-col gap-4 mt-3 mb-2">
            <div className="flex items-center gap-3">
              <Switch id="pin-req" checked={requiresPin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequiresPin(e.target.checked)} />
              <Label htmlFor="pin-req" className="text-[13px] font-semibold text-foreground">PIN Required</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="active-disc" checked={isActive} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)} />
              <Label htmlFor="active-disc" className="text-[13px] font-semibold text-foreground">Active</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading || !name || !value}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
