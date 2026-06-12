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
import { useRouter } from "next/navigation"

function formatMoney(amount: number | null | undefined) {
  if (amount == null) return "IDR 0";
  return "IDR " + Number(amount).toLocaleString("id-ID").replace(/,/g, '.')
}

interface EmployeeData {
  id: string | number;
  name: string;
}

interface BranchData {
  id: string | number;
  name: string;
}

interface ShiftData {
  id: string | number;
  emp: string;
  branch: string;
  open: string;
  close: string | null;
  sales: number;
  diff: string;
  status: string;
  [key: string]: unknown;
}

export function ShiftsClient({ 
  initialData, employees, branches 
}: { 
  initialData: any[], employees: any[], branches: any[] 
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [employeeId, setEmployeeId] = React.useState(employees[0]?.id?.toString() || "")
  const [branchId, setBranchId] = React.useState(branches[0]?.id?.toString() || "")
  const [startingCash, setStartingCash] = React.useState("0")

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Employee", accessorKey: "emp" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Open", accessorKey: "open" as const },
    { header: "Close", accessorKey: "close" as const },
    { header: "Cash", cell: (item: ShiftData) => formatMoney(item.sales) },
    { header: "Diff", accessorKey: "diff" as const },
    { 
      header: "Status", 
      cell: (item: ShiftData) => (
        <Badge variant={item.status === "OPEN" ? "success" : "secondary"}>
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

  const employeeOptions = employees.map(e => ({ label: e.name, value: e.id.toString() }))
  const branchOptions = branches.map(b => ({ label: b.name, value: b.id.toString() }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: Number(employeeId),
          branch_id: Number(branchId),
          starting_cash: Number(startingCash)
        })
      })

      if (!res.ok) throw new Error("Failed to open shift")
      
      toast("Shift opened successfully!", "success")
      setOpen(false)
      router.refresh()
      
      setStartingCash("0")
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader 
        title="Shift Management" 
        description="POS Staff Shifts" 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add Manual Shift
          </Button>
        }
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Open Shift Manually</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Employee</Label>
            <Select options={employeeOptions} value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Branch</Label>
            <Select options={branchOptions} value={branchId} onChange={e => setBranchId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Starting Cash (Petty Cash)</Label>
            <Input type="number" placeholder="Starting Cash" value={startingCash} onChange={e => setStartingCash(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
