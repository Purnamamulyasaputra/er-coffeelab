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

export function TaxConfigClient({
  initialData, branches
}: {
  initialData: any[], branches: any[]
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [branchId, setBranchId] = React.useState(branches[0]?.id?.toString() || "")
  const [name, setName] = React.useState("")
  const [rate, setRate] = React.useState("")
  const [isInclusive, setIsInclusive] = React.useState(false)
  const [isActive, setIsActive] = React.useState(true)

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Tax", accessorKey: "tax" as const },
    { header: "Rate", accessorKey: "rate" as const },
    { header: "Inclusive", accessorKey: "inclusive" as const },
    {
      header: "Active",
      cell: (item: any) => (
        <Badge variant={item.active === "ON" ? "success" : "secondary"}>
          {item.active}
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

  const branchOptions = branches.map(b => ({ label: b.name, value: b.id.toString() }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/taxconfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: Number(branchId),
          name,
          rate: Number(rate),
          is_inclusive: isInclusive,
          is_active: isActive
        })
      })

      if (!res.ok) throw new Error("Failed to save tax config")

      toast("Tax Configuration saved successfully!", "success")
      setOpen(false)
      router.refresh()

      setName("")
      setRate("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Tax Config"
        description="Per branch"
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        }
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add Tax Config</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Branch</Label>
            <Select options={branchOptions} value={branchId} onChange={e => setBranchId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tax Name</Label>
            <Input placeholder="e.g. PB1" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Rate (%)</Label>
            <Input type="number" placeholder="10" value={rate} onChange={e => setRate(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Switch id="tax-inclusive" checked={isInclusive} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsInclusive(e.target.checked)} />
            <Label htmlFor="tax-inclusive" className="text-[13px] font-semibold text-foreground">Inclusive (Harga Termasuk Pajak)</Label>
          </div>
          <div className="flex items-center gap-3 mt-2 mb-2">
            <Switch id="tax-active" checked={isActive} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)} />
            <Label htmlFor="tax-active" className="text-[13px] font-semibold text-foreground">Active</Label>
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
            disabled={loading || !name || !rate}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
