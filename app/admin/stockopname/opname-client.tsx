"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, Eye } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export function StockOpnameClient({ 
  initialData, employees, branches, currentBranchId, role 
}: { 
  initialData: any[], employees: any[], branches: any[], currentBranchId?: number, role?: string 
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [employeeId, setEmployeeId] = React.useState(employees[0]?.id?.toString() || "")
  const [branchId, setBranchId] = React.useState(currentBranchId ? currentBranchId.toString() : (branches[0]?.id?.toString() || ""))

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [opnameToDelete, setOpnameToDelete] = React.useState<any>(null)

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Branch", accessorKey: "branch" as const },
    { header: "Employee", accessorKey: "employee" as const },
    { header: "Date", cell: (item: any) => <span className="whitespace-nowrap">{item.date}</span> },
    { header: "Items", accessorKey: "items" as const },
    { header: "Variance", accessorKey: "variance" as const },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === "COMPLETED" ? "success" : (item.status === "IN_PROGRESS" || item.status === "DRAFT") ? "warning" : "secondary"}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Link href={`/admin/stockopname/${item.id}`}>
            <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]">
              {item.status === "COMPLETED" ? <Eye size={14} /> : <Pencil size={14} />}
            </Button>
          </Link>
          {role !== "EMPLOYEE" && (
            <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setOpnameToDelete(item); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
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
      const res = await fetch("/api/stockopname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conducted_by: Number(employeeId),
          branch_id: Number(branchId)
        })
      })

      if (!res.ok) throw new Error("Failed to start stock opname")
      
      toast("Stock Opname draft created!", "success")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!opnameToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stockopname/${opnameToDelete.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete stock opname");

      toast("Stock opname deleted successfully", "success");
      setDeleteModalOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader 
        title="Stock Opname" 
        description="Physical count" 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={14} /> Add
          </Button>
        } 
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Start Stock Opname</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 px-1">
          {(!currentBranchId && branches.length > 1) && (
            <div className="flex flex-col gap-1.5">
              <Label>Branch</Label>
              <Select options={branchOptions} value={branchId} onChange={e => setBranchId(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Conducted By (Employee)</Label>
            <Select options={employeeOptions} value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
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
            disabled={loading}
          >
            <Check size={16} /> {loading ? "Saving..." : "Start Opname"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Delete Stock Opname"
        message="Are you sure you want to delete this stock opname?"
        onConfirm={handleDelete}
        confirmText={loading ? "Deleting..." : "Delete"}
      />
    </div>
  )
}
