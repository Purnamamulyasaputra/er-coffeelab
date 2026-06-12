"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X, GripVertical } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function BannersClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData)
  
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null)

  const [form, setForm] = React.useState({
    title: "", image_url: "", link_destination: "", placement: "HOME", sort_order: 0, status: "ACTIVE", start_date: "", end_date: ""
  })

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm({ title: "", image_url: "", link_destination: "", placement: "HOME", sort_order: data.length, status: "ACTIVE", start_date: "", end_date: "" })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      image_url: item.image_url || "",
      link_destination: item.link_destination || "",
      placement: item.placement || "HOME",
      sort_order: item.sort_order || 0,
      status: item.status || "ACTIVE",
      start_date: item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : "",
      end_date: item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : ""
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingId ? `/api/banners/${editingId}` : '/api/banners'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error("Failed to save")
      setIsModalOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/banners/${deleteConfirmId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setData(data.filter(d => d.id !== deleteConfirmId))
      setDeleteConfirmId(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { header: "Sort", cell: () => <GripVertical size={16} className="text-muted-foreground cursor-grab" /> },
    { 
      header: "Image", 
      cell: (item: any) => (
        <div className="w-16 h-8 rounded-md bg-white p-0.5 flex items-center justify-center overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-[10px] text-gray-400">N/A</div>
          )}
        </div>
      )
    },
    { header: "Title", accessorKey: "title" as const },
    { header: "Placement", accessorKey: "placement" as const },
    { 
      header: "Link", 
      cell: (item: any) => <span className="text-[11px] truncate max-w-[120px] block" title={item.link_destination}>{item.link_destination || "-"}</span>
    },
    { 
      header: "Status", 
      cell: (item: any) => (
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${
          item.status === 'ACTIVE' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'
        }`}>
          {item.status}
        </span>
      )
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
        title="Banners" 
        description="Manage app banners and promotional popups" 
        action={<Button onClick={handleOpenAdd} className="gap-2"><Plus size={14} /> Add Banner</Button>} 
      />
      <DataTable data={data} columns={columns} keyExtractor={item => item.id} />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card rounded-[14px] w-full max-w-[500px] overflow-hidden flex flex-col shadow-2xl border border-border my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-foreground">{editingId ? 'Edit Banner' : 'Add Banner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Title</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Summer Promo" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Image URL</label>
                <input required value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Placement</label>
                  <select value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                    <option value="HOME_HERO">Home Hero</option>
                    <option value="PROMO_POPUP">Promo Popup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Link Destination</label>
                <input value={form.link_destination} onChange={e => setForm({ ...form, link_destination: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. /promo/summer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Start Date</label>
                  <input type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">End Date</label>
                  <input type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-muted text-foreground hover:bg-muted/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold border border-border">Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-primary text-white hover:bg-primary/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold">{loading ? 'Saving...' : '✓ Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card rounded-[16px] w-full max-w-[340px] p-6 flex flex-col items-center text-center shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#ef4444]/10 flex items-center justify-center mb-4 border border-[#ef4444]/20"><Trash2 className="text-[#ef4444] w-6 h-6" /></div>
            <h3 className="text-[18px] font-semibold text-foreground mb-2">Confirm Delete</h3>
            <p className="text-muted-foreground text-[13px] mb-6 leading-relaxed">Are you sure you want to delete this banner?</p>
            <div className="flex w-full gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-muted text-foreground hover:bg-muted/80 rounded-xl h-11 text-[13px] font-medium border border-border">Cancel</Button>
              <Button onClick={confirmDelete} disabled={loading} className="flex-1 bg-[#ef4444] text-white hover:bg-[#dc2626] rounded-xl h-11 text-[13px] font-medium shadow-[0_4px_12px_rgba(239,68,68,0.25)]">{loading ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
