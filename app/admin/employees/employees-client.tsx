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
  return "IDR " + amount.toLocaleString("id-ID").replace(/,/g, '.')
}

export function EmployeesClient({ initialData, branches }: { initialData: any[], branches: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [branchId, setBranchId] = React.useState(branches[0]?.id?.toString() || "")
  const [role, setRole] = React.useState("BARISTA")
  const [pin, setPin] = React.useState("")
  const [rate, setRate] = React.useState("25000")

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { 
      header: "Role", 
      cell: (item: any) => {
        let color = "text-muted-foreground"
        if (item.role === "BARISTA") color = "text-[#6c72cb]" 
        if (item.role === "CASHIER") color = "text-[#06b6d4]" 
        if (item.role === "SHIFT_LEAD") color = "text-[#8b5cf6]" 
        return <span className={`bg-muted px-2 py-0.5 rounded-md text-[10px] font-bold ${color}`}>{item.role}</span>
      }
    },
    { header: "Rate/Hr", cell: (item: any) => formatMoney(item.rate) },
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
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          branch_id: Number(branchId),
          role,
          pin,
          rate: Number(rate)
        })
      })

      if (!res.ok) throw new Error("Failed to save employee")
      
      toast("Employee saved successfully!", "success")
      setOpen(false)
      router.refresh()
      
      setName("")
      setPin("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader 
        title="Employees" 
        description={`${initialData.length} staff`} 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        } 
      />

      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Branch</Label>
            <Select 
              options={branchOptions} 
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select 
              options={[
                {label: "BARISTA", value: "BARISTA"},
                {label: "CASHIER", value: "CASHIER"},
                {label: "SHIFT_LEAD", value: "SHIFT_LEAD"},
                {label: "MANAGER", value: "MANAGER"}
              ]} 
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>PIN</Label>
            <Input type="password" placeholder="4-6 digit PIN" maxLength={6} value={pin} onChange={e => setPin(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hourly Rate (IDR)</Label>
            <Input type="number" placeholder="Rate" value={rate} onChange={e => setRate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading || !name || !pin}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
