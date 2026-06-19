"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"

import { Plus, Pencil, Trash2, Check, LogOut, Wallet, UserCheck, Play, LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

function formatMoney(amount: number | null | undefined) {
  if (amount == null) return "IDR 0";
  const num = Number(amount);
  const formatted = Math.abs(num).toLocaleString("id-ID").replace(/,/g, '.');
  return num < 0 ? `-IDR ${formatted}` : `IDR ${formatted}`;
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
  initialData, employees, branches, isAdmin, showBranchColumn
}: {
  initialData: any[], employees: any[], branches: any[], isAdmin?: boolean, showBranchColumn?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [employeeId, setEmployeeId] = React.useState(employees[0]?.id?.toString() || "")
  const [branchId, setBranchId] = React.useState(branches[0]?.id?.toString() || "")
  const [startingCash, setStartingCash] = React.useState("0")

  const [closeOpen, setCloseOpen] = React.useState(false)
  const [activeShift, setActiveShift] = React.useState<ShiftData | null>(null)
  const [actualCash, setActualCash] = React.useState("")

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Employee", accessorKey: "emp" as const },
    ...(showBranchColumn ? [{ header: "Branch", accessorKey: "branch" as const }] : []),
    { header: "Open", accessorKey: "open" as const },
    { header: "Close", accessorKey: "close" as const },
    { header: "Starting", cell: (item: ShiftData) => <span className="font-medium text-muted-foreground">{formatMoney(item.starting as number)}</span> },
    { header: "Actual", cell: (item: ShiftData) => <span className="font-medium">{formatMoney(item.sales)}</span> },
    { 
      header: "Diff", 
      cell: (item: ShiftData) => {
        if (!item.diff || item.diff === "-" || isNaN(Number(item.diff))) {
          return <span className="text-muted-foreground font-medium">-</span>;
        }
        const diffNum = Number(item.diff);
        const formatted = Math.abs(diffNum).toLocaleString("id-ID").replace(/,/g, '.');
        
        if (diffNum < 0) {
          return <span className="inline-flex items-center text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-md text-[11px] tracking-wide whitespace-nowrap">- IDR {formatted}</span>;
        } else if (diffNum > 0) {
          return <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px] tracking-wide whitespace-nowrap">+ IDR {formatted}</span>;
        } else {
          return <span className="inline-flex items-center text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded-md text-[11px] tracking-wide whitespace-nowrap">IDR 0</span>;
        }
      } 
    },
    {
      header: "Status",
      cell: (item: ShiftData) => (
        <Badge variant={item.status === "OPEN" ? "success" : "default"}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          {item.status === 'OPEN' && (
            <Button size="icon" className="h-[34px] w-[34px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-[10px]" title="Close Shift" onClick={() => {
              setActiveShift(item);
              setActualCash("");
              setCloseOpen(true);
            }}>
              <LogOut size={14} />
            </Button>
          )}
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => setOpen(true)}>
            <Pencil size={14} />
          </Button>
          {isAdmin && (
            <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => handleDelete(item.id)}>
              <Trash2 size={14} />
            </Button>
          )}
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
          employee_id: Number(employeeId) || Number(employees[0]?.id),
          branch_id: Number(branchId) || Number(branches[0]?.id),
          starting_cash: Number(startingCash)
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to open shift");
      }

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

  const handleCloseShift = async () => {
    if (!activeShift) return
    if (!actualCash) {
      toast("Actual cash is required", "error")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/shifts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeShift.id,
          action: "close",
          actual_cash: Number(actualCash)
        })
      })

      if (!res.ok) throw new Error("Failed to close shift")

      toast("Shift closed successfully!", "success")
      setCloseOpen(false)
      setActiveShift(null)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    setLoading(true)
    try {
      const res = await fetch(`/api/shifts?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete shift")
      toast("Shift deleted successfully", "success")
      router.refresh()
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
            <Plus size={14} /> Open Shift
          </Button>
        }
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen} className="sm:max-w-[400px]">
        <DialogHeader className="mb-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Play size={24} />
          </div>
          <DialogTitle className="text-center text-xl">Open Shift</DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">Start a new session</p>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2 px-1">
          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold text-foreground">Cashier Name</Label>
            <Select options={employeeOptions} value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
          </div>
          {isAdmin && (
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-foreground">Branch Location</Label>
              <Select options={branchOptions} value={branchId} onChange={e => setBranchId(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold text-foreground">Starting Cash (Petty Cash)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
              <Input
                type="text"
                className="pl-10 h-12 text-lg font-bold"
                placeholder="0"
                value={startingCash ? Number(startingCash).toLocaleString("id-ID") : ""}
                onChange={e => setStartingCash(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6 sm:justify-between flex-row-reverse">
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 h-11 px-8" onClick={handleSave} disabled={loading}>
            {loading ? "Opening..." : "Open Shift"}
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto h-11" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen} className="sm:max-w-[400px]">
        <DialogHeader className="mb-4">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4 text-destructive">
            <LogOut size={24} />
          </div>
          <DialogTitle className="text-center text-xl">Close Shift</DialogTitle>
          <p className="text-center text-sm font-semibold text-foreground mt-1">
            {activeShift?.emp}
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2 px-1">
          <div className="flex flex-col gap-1.5">
            <Label className="font-semibold text-foreground">Actual Ending Cash</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
              <Input
                type="text"
                className="pl-10 h-12 text-lg font-bold"
                placeholder="0"
                value={actualCash ? Number(actualCash).toLocaleString("id-ID") : ""}
                onChange={e => setActualCash(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6 sm:justify-between flex-row-reverse">
          <Button variant="destructive" className="w-full sm:w-auto h-11 px-8" onClick={handleCloseShift} disabled={loading}>
            {loading ? "Closing..." : "Close Shift"}
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto h-11" onClick={() => setCloseOpen(false)} disabled={loading}>Cancel</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
