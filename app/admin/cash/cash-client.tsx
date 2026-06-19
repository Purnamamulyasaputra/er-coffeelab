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
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"

function formatMoney(amount: number | string) {
  return "IDR " + Number(amount).toLocaleString("id-ID").replace(/,/g, '.')
}

export function CashClient({ 
  initialData, 
  activeShift, 
  isAdmin, 
  showBranchColumn 
}: { 
  initialData: any[], 
  activeShift?: any,
  isAdmin?: boolean,
  showBranchColumn?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState("IN")
  const [amount, setAmount] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()

  const handleSave = async () => {
    if (!activeShift) {
      toast("No active shift found. Please open a shift first.", "error");
      return;
    }
    if (!amount || !reason) {
      toast("Please fill in all fields", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: activeShift.id,
          employeeId: activeShift.employee_id,
          type,
          amount: Number(amount),
          reason
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast("Cash movement saved successfully", "success");
      setOpen(false);
      setAmount("");
      setReason("");
      setType("IN");
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Failed to save cash movement", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cash?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Cash movement deleted", "success");
      setDeleteModalOpen(false);
      router.refresh();
    } catch (err) {
      toast("Failed to delete cash movement", "error");
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Employee", accessorKey: "employee" as const },
    ...(showBranchColumn ? [{ header: "Branch", accessorKey: "branch" as const }] : []),
    { 
      header: "Type", 
      cell: (item: any) => (
        <Badge variant={item.type === "IN" ? "success" : "destructive"}>
          {item.type}
        </Badge>
      )
    },
    { header: "Amount", cell: (item: any) => formatMoney(item.amount) },
    { 
      header: "Reason", 
      cell: (item: any) => (
        <div className="max-w-[150px] sm:max-w-[200px] md:max-w-[250px] truncate" title={item.reason}>
          {item.reason}
        </div>
      )
    },
    { header: "Time", accessorKey: "time" as const },
    ...(isAdmin ? [{
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setDeleteId(item.id); setDeleteModalOpen(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }] : [])
  ]

  return (
    <div>
      <PageHeader 
        title="Cash Management" 
        description="Petty cash movements and till adjustments" 
        action={
          <Button onClick={() => setOpen(true)} className="gap-2" disabled={!activeShift}>
            <Plus size={14} />
            Add
          </Button>
        }
      />
      <DataTable 
        data={initialData}
        columns={columns}
        keyExtractor={item => item.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Add Cash Movement</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          {!activeShift && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-2">
              You cannot add cash movements without an active shift. Please open a shift first.
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select 
              options={[
                {label: "IN (Uang Masuk)", value: "IN"},
                {label: "OUT (Uang Keluar)", value: "OUT"}
              ]} 
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Amount (IDR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
              <Input
                type="text"
                className="pl-10 h-12 text-lg font-bold"
                placeholder="0"
                value={amount ? Number(amount).toLocaleString("id-ID") : ""}
                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Input 
              placeholder="Reason for movement (e.g. Beli es batu)" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="default" className="gap-1.5" onClick={handleSave} disabled={loading || !activeShift}>
            <Check size={14} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Hapus Catatan Kas"
        message="Apakah Anda yakin ingin menghapus catatan pergerakan kas ini? Saldo akhir shift akan otomatis diperbarui. Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        confirmText={loading ? "Menghapus..." : "Hapus"}
      />
    </div>
  )
}
