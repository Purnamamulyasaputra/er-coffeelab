"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, RefreshCw } from "lucide-react"
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

function generateVoucherCode(prefix = "ER") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const random = Array.from({length: 5}, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `${prefix}-${random}`
}

export function VouchersClient({ initialData, role }: { initialData: any[], role?: string }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [editId, setEditId] = React.useState<number | null>(null)
  const [code, setCode] = React.useState("")
  const [type, setType] = React.useState("PERCENTAGE")
  const [value, setValue] = React.useState("")
  const [maxDiscount, setMaxDiscount] = React.useState("")
  const [minTransaction, setMinTransaction] = React.useState("0")
  const [usageQuota, setUsageQuota] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [voucherToDelete, setVoucherToDelete] = React.useState<any>(null)

  const handleOpenAdd = () => {
    setEditId(null)
    setCode(generateVoucherCode())
    setType("PERCENTAGE")
    setValue("")
    setMaxDiscount("")
    setMinTransaction("0")
    setUsageQuota("")
    
    // Default to today and 30 days from now
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setDate(today.getDate() + 30)
    
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(nextMonth.toISOString().split('T')[0])
    setIsActive(true)
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditId(item.id)
    setCode(item.code)
    setType(item.discount_type)
    setValue(item.discount_value.toString())
    setMaxDiscount(item.max_discount ? item.max_discount.toString() : "")
    setMinTransaction(item.min_transaction ? item.min_transaction.toString() : "0")
    setUsageQuota(item.usage_quota ? item.usage_quota.toString() : "")
    
    // Parse dates
    setStartDate(new Date(item.start_date || new Date()).toISOString().split('T')[0])
    setEndDate(new Date(item.end_date || new Date()).toISOString().split('T')[0])
    
    setIsActive(item.status === "ACTIVE")
    setOpen(true)
  }

  const handleSave = async () => {
    if (!code || !value || !startDate || !endDate) {
      toast("Please fill all required fields", "error")
      return
    }

    setLoading(true)
    try {
      const url = editId ? `/api/vouchers/${editId}` : "/api/vouchers"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount_type: type,
          discount_value: Number(value),
          max_discount: maxDiscount ? Number(maxDiscount) : null,
          min_transaction: Number(minTransaction),
          usage_quota: usageQuota ? Number(usageQuota) : null,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          status: isActive ? 'ACTIVE' : 'INACTIVE'
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${editId ? 'update' : 'save'} voucher`)
      }
      
      toast(`Voucher ${editId ? 'updated' : 'saved'} successfully!`, "success")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!voucherToDelete) return
    setLoading(true)
    try {
      const res = await fetch(`/api/vouchers/${voucherToDelete.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete voucher")
      }
      toast("Voucher deleted successfully", "success")
      setDeleteModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { header: "Code", accessorKey: "code" as const },
    { 
      header: "Discount", 
      cell: (item: any) => {
        if (item.discount_type === 'PERCENTAGE') {
          return `${item.discount_value}% ${item.max_discount ? `(Max Rp ${Number(item.max_discount).toLocaleString('id-ID')})` : ''}`
        }
        return `Rp ${Number(item.discount_value).toLocaleString('id-ID')}`
      } 
    },
    { header: "Min Order", cell: (item: any) => "Rp " + Number(item.min_transaction).toLocaleString('id-ID') },
    { header: "Quota", cell: (item: any) => `${item.used_count}/${item.usage_quota || 'Unltd'}` },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"}>
          {item.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      )
    },
    ...(role === "SUPERADMIN" ? [{
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEdit(item)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setVoucherToDelete(item); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
        </div>
      )
    }] : [])
  ]

  return (
    <div>
      <PageHeader 
        title="Vouchers" 
        description="Promo codes for customers" 
        action={
          role === "SUPERADMIN" ? (
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus size={14} /> Add Voucher
            </Button>
          ) : undefined
        } 
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Voucher" : "Add Voucher"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Code</Label>
            <div className="flex gap-2">
              <Input placeholder="Voucher Code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="uppercase" />
              {!editId && (
                <Button variant="outline" size="icon" onClick={() => setCode(generateVoucherCode())}>
                  <RefreshCw size={14} />
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select options={[
                {label: "Percentage", value: "PERCENTAGE"},
                {label: "Fixed Amount", value: "FIXED"}
              ]} value={type} onChange={e => setType(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Value {type === "PERCENTAGE" ? "(%)" : "(Rp)"}</Label>
              <Input type="number" placeholder="Value" value={value} onChange={e => setValue(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Max Discount (Rp)</Label>
              <Input type="number" placeholder="No limit" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} disabled={type === "FIXED"} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Min Transaction (Rp)</Label>
              <Input type="number" placeholder="0" value={minTransaction} onChange={e => setMinTransaction(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Usage Quota</Label>
            <Input type="number" placeholder="Unlimited" value={usageQuota} onChange={e => setUsageQuota(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 mb-2">
            <Switch id="active-voucher" checked={isActive} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)} />
            <Label htmlFor="active-voucher" className="text-[13px] font-semibold text-foreground">Active</Label>
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
            disabled={loading || !code || !value || !startDate || !endDate}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Voucher"
        message={<>Are you sure you want to delete voucher <span className="font-bold text-white">{voucherToDelete?.code}</span>? This action cannot be undone.</>}
        confirmText={loading ? "Deleting..." : "Delete"}
        type="danger"
      />
    </div>
  )
}
