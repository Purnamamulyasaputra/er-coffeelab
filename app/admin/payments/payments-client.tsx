"use client"

import * as React from "react"
import { Plus, GripVertical, Pencil, Trash2, X } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function PaymentsClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    type: "E_WALLET",
    provider: "XENDIT",
    logo_url: "",
    admin_fee_flat: 0,
    admin_fee_pct: "0.00",
    is_active: true,
    is_redirect: false,
    sort_order: 0
  })

  // Synchronize data if initialData changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({
      name: "",
      code: "",
      type: "E_WALLET",
      provider: "XENDIT",
      logo_url: "",
      admin_fee_flat: 0,
      admin_fee_pct: "0.00",
      is_active: true,
      is_redirect: false,
      sort_order: data.length
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      code: item.code,
      type: item.type,
      provider: item.provider || "XENDIT",
      logo_url: item.logo_url || "",
      admin_fee_flat: item.admin_fee_flat || 0,
      admin_fee_pct: item.admin_fee_pct || "0.00",
      is_active: item.is_active ?? (item.status === 'ACTIVE'),
      is_redirect: item.is_redirect || false,
      sort_order: item.sort_order || 0
    })
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return
    setLoading(true)
    try {
      const res = await fetch(`/api/payments/${deleteConfirmId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete payment method")
      setData(data.filter(u => u.id !== deleteConfirmId))
      setDeleteConfirmId(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingId ? `/api/payments/${editingId}` : '/api/payments'
      const method = editingId ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        admin_fee_flat: Number(formData.admin_fee_flat),
        sort_order: Number(formData.sort_order)
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to save")

      setIsModalOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { header: "No", accessorKey: "id" as const },
    { header: "Code", accessorKey: "code" as const },
    { header: "Name", accessorKey: "name" as const },
    { 
      header: "Type", 
      cell: (item: any) => {
        switch (item.type) {
          case 'E_WALLET': return 'E-Wallet';
          case 'VIRTUAL_ACCOUNT': return 'VA';
          case 'QR_CODE': return 'QR Code';
          case 'OVER_THE_COUNTER': return 'OTC Retail';
          case 'CASH': return 'Cash';
          case 'EDC': return 'EDC';
          default: return item.type;
        }
      }
    },
    { header: "Provider", accessorKey: "provider" as const },
    { 
      header: "Fee", 
      cell: (item: any) => {
        const flat = Number(item.admin_fee_flat || 0);
        const pct = item.admin_fee_pct || item.fee || "0";
        const cleanPct = pct.includes('%') ? pct : pct + '%';
        if (flat > 0 && Number(pct.replace('%','')) > 0) return `Rp ${flat} + ${cleanPct}`;
        if (flat > 0) return `Rp ${flat}`;
        if (Number(pct.replace('%','')) > 0) return cleanPct;
        return "0%";
      }
    },
    { 
      header: "Active", 
      cell: (item: any) => {
        const isActive = item.is_active ?? (item.status === 'ACTIVE')
        return (
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${
              isActive
                ? 'bg-[#22c55e]/20 text-[#22c55e]'
                : 'bg-[#ef4444]/20 text-[#ef4444]'
            }`}
          >
            {isActive ? 'ON' : 'OFF'}
          </span>
        )
      }
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" onClick={() => handleOpenEdit(item)} className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" onClick={() => setDeleteConfirmId(item.id)} className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader 
        title="Payment Configuration" 
        description="Manage payment methods, MDR fees, and integration providers" 
        action={<Button onClick={handleOpenAdd} className="gap-2"><Plus size={14} /> Add Method</Button>} 
      />
      <DataTable data={data} columns={columns} keyExtractor={item => item.id} />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-card rounded-[14px] w-full max-w-[500px] overflow-hidden flex flex-col shadow-2xl border border-border my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-foreground">{editingId ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] placeholder:text-muted-foreground/50"
                    placeholder="e.g. GoPay"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Code</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] placeholder:text-muted-foreground/50"
                    placeholder="e.g. GOPAY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="E_WALLET">E-Wallet</option>
                    <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
                    <option value="QR_CODE">QR Code</option>
                    <option value="OVER_THE_COUNTER">Over The Counter</option>
                    <option value="CASH">Cash</option>
                    <option value="EDC">Debit/Credit (EDC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Provider</label>
                  <select
                    value={formData.provider}
                    onChange={e => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="XENDIT">Xendit</option>
                    <option value="MANUAL">Manual / POS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Logo URL</label>
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px] placeholder:text-muted-foreground/50"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Admin Fee (Flat Rp)</label>
                  <input
                    type="number"
                    value={formData.admin_fee_flat}
                    onChange={e => setFormData({ ...formData, admin_fee_flat: Number(e.target.value) })}
                    className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Admin Fee (Percentage %)</label>
                  <input
                    type="text"
                    value={formData.admin_fee_pct}
                    onChange={e => setFormData({ ...formData, admin_fee_pct: e.target.value })}
                    className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-brand-blue transition-colors text-[13px]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`w-10 h-[22px] rounded-full transition-colors relative ${formData.is_active ? 'bg-[#22c55e]' : 'bg-muted border border-border'}`}
                  >
                    <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${formData.is_active ? 'left-5' : 'left-[3px] bg-[#8b8fa8]'}`} />
                  </button>
                  <span className="text-[13px] font-medium text-foreground">Active</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_redirect: !formData.is_redirect })}
                    className={`w-10 h-[22px] rounded-full transition-colors relative ${formData.is_redirect ? 'bg-[#8b5cf6]' : 'bg-muted border border-border'}`}
                  >
                    <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${formData.is_redirect ? 'left-5' : 'left-[3px] bg-[#8b8fa8]'}`} />
                  </button>
                  <span className="text-[13px] font-medium text-foreground">Is Redirect?</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-muted text-foreground hover:bg-muted/80 hover:text-foreground px-5 py-2 h-auto rounded-lg text-[12px] font-semibold border border-border">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary text-white hover:bg-primary/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold">
                  {loading ? 'Saving...' : '✓ Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div 
            className="bg-card rounded-[16px] w-full max-w-[340px] p-6 flex flex-col items-center text-center shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[#ef4444]/10 flex items-center justify-center mb-4 border border-[#ef4444]/20">
              <Trash2 className="text-[#ef4444] w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-semibold text-foreground mb-2">Delete Payment Method</h3>
            <p className="text-muted-foreground text-[13px] mb-6 leading-relaxed">
              Are you sure you want to delete this payment method?
            </p>
            <div className="flex w-full gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setDeleteConfirmId(null)} 
                className="flex-1 bg-muted text-foreground hover:bg-muted/80 rounded-xl h-11 text-[13px] font-medium border border-border"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete} 
                disabled={loading} 
                className="flex-1 bg-destructive text-white hover:bg-destructive/90 rounded-xl h-11 text-[13px] font-medium shadow-[0_4px_12px_rgba(239,68,68,0.25)]"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
