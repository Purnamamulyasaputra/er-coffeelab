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
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

function formatMoney(amount: number | string) {
  return "Rp " + Number(amount).toLocaleString("id-ID").replace(/,/g, '.')
}

function getRoleVariant(role: string): any {
  if (role === "BARISTA") return "default"
  if (role === "CASHIER") return "success"
  if (role === "SHIFT_LEAD") return "cool"
  if (role === "MANAGER") return "warning"
  return "secondary"
}

function formatRole(role: string) {
  if (!role) return "";
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function EmployeesClient({ initialData, branches }: { initialData: any[], branches: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [editId, setEditId] = React.useState<number | null>(null)
  const [name, setName] = React.useState("")
  const [branchId, setBranchId] = React.useState(branches[0]?.id?.toString() || "")
  const [role, setRole] = React.useState("BARISTA")
  const [pin, setPin] = React.useState("")
  const [rate, setRate] = React.useState("25000")

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [employeeToDelete, setEmployeeToDelete] = React.useState<any>(null)

  const handleOpenAdd = () => {
    setEditId(null)
    setName("")
    setBranchId(branches.length === 1 ? branches[0]?.id?.toString() || "" : "")
    setRole("")
    setPin("")
    setRate("")
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditId(item.id)
    setName(item.name)
    setBranchId(item.branch_id?.toString() || (branches[0]?.id?.toString() || ""))
    setRole(item.role)
    setPin("")
    setRate(item.rate?.toString() || "0")
    setOpen(true)
  }

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { header: "Branch", accessorKey: "branch" as const },
    {
      header: "Role",
      cell: (item: any) => {
        return <Badge variant={getRoleVariant(item.role)}>{formatRole(item.role)}</Badge>
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
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEdit(item)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setEmployeeToDelete(item); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const branchOptions = branches.map(b => ({ label: b.name, value: b.id.toString() }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const url = editId ? `/api/employees/${editId}` : "/api/employees"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          branch_id: Number(branchId),
          role,
          ...(pin ? { pin } : {}),
          rate: Number(rate)
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save employee")
      }

      toast(editId ? "Employee updated successfully!" : "Employee saved successfully!", "success")
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

  const confirmDelete = async () => {
    if (!employeeToDelete) return
    setLoading(true)
    try {
      const res = await fetch(`/api/employees/${employeeToDelete.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete employee")
      }
      toast("Employee deleted successfully", "success")
      setDeleteModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
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
          <Button onClick={handleOpenAdd} className="gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white">
            <Plus size={14} /> Add Employee
          </Button>
        }
      />

      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          {branches.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label>Branch</Label>
              <Select
                options={branchOptions}
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select
              options={[
                { label: "Barista", value: "BARISTA" },
                { label: "Cashier", value: "CASHIER" },
                { label: "Shift Lead", value: "SHIFT_LEAD" },
                { label: "Manager", value: "MANAGER" }
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
            <Label>Hourly Rate</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] font-bold">Rp</div>
              <Input
                type="text"
                placeholder="0"
                className="pl-9"
                value={rate === "0" || !rate ? "" : Number(rate).toLocaleString('id-ID')}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setRate(val);
                }}
              />
            </div>
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
            disabled={loading || !name || !role || (!editId && !pin) || !rate || (branches.length > 1 && !branchId)}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={<>Are you sure you want to delete <span className="font-bold text-white">{employeeToDelete?.name}</span>? This action cannot be undone.</>}
        confirmText={loading ? "Deleting..." : "Delete"}
        type="danger"
      />
    </div>
  )
}
