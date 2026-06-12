"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

function formatMoney(amount: number | null) {
  if (amount === null) return "-"
  return "IDR " + amount.toLocaleString("id-ID").replace(/,/g, '.')
}

export function AttendanceClient({ 
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

  const columns = [
    { header: "Employee", accessorKey: "emp" as const },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Date", accessorKey: "date" as const },
    { header: "In", accessorKey: "in" as const },
    { header: "Out", accessorKey: "out" as const },
    { header: "Hours", accessorKey: "hours" as const },
    { header: "Cost", cell: (item: any) => formatMoney(item.cost) },
    {
      header: "Actions",
      cell: () => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => toast("Deleted", "error")}><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const employeeOptions = employees.map(e => ({ label: e.name, value: e.id.toString() }))
  const branchOptions = branches.map(b => ({ label: b.name, value: b.id.toString() }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: Number(employeeId),
          branch_id: Number(branchId)
        })
      })

      if (!res.ok) throw new Error("Failed to record attendance")
      
      toast("Clock In recorded successfully!", "success")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader 
        title="Attendance" 
        description="Clock records" 
        action={
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus size={14} /> Add (Clock In)
          </Button>
        } 
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Manual Clock In</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 px-1">
          <div className="flex flex-col gap-1.5">
            <Label>Employee</Label>
            <Select options={employeeOptions} value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Branch</Label>
            <Select options={branchOptions} value={branchId} onChange={e => setBranchId(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading}>
            <Check size={14} /> {loading ? "Saving..." : "Clock In"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
