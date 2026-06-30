"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, X, GripVertical } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export function ContentClient({ initialStaticPages, initialMerchandise }: { initialStaticPages: any[], initialMerchandise: any[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"PAGES" | "MERCH">("PAGES")
  
  // Data State
  const [pagesData, setPagesData] = React.useState(initialStaticPages)
  const [merchData, setMerchData] = React.useState(initialMerchandise)
  
  // Modal State
  const [isPageModalOpen, setIsPageModalOpen] = React.useState(false)
  const [isMerchModalOpen, setIsMerchModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [deleteConfirmInfo, setDeleteConfirmInfo] = React.useState<{id: number, type: 'page'|'merch'} | null>(null)

  React.useEffect(() => {
    setPagesData(initialStaticPages)
    setMerchData(initialMerchandise)
  }, [initialStaticPages, initialMerchandise])

  // Form States
  const [pageForm, setPageForm] = React.useState({ slug: "", title: "", content: "" })
  const [merchForm, setMerchForm] = React.useState({
    name: "", description: "", image_url: "", price: 0, personalizable: false, badge: "", status: "ACTIVE", sort_order: 0
  })

  // === STATIC PAGES ===
  const handleOpenAddPage = () => {
    setEditingId(null)
    setPageForm({ slug: "", title: "", content: "" })
    setIsPageModalOpen(true)
  }

  const handleOpenEditPage = (item: any) => {
    setEditingId(item.id)
    setPageForm({ slug: item.slug, title: item.title, content: item.content })
    setIsPageModalOpen(true)
  }

  const handleSubmitPage = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingId ? `/api/content/static-pages/${editingId}` : '/api/content/static-pages'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageForm)
      })
      if (!res.ok) throw new Error("Failed to save page")
      setIsPageModalOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // === MERCHANDISE ===
  const handleOpenAddMerch = () => {
    setEditingId(null)
    setMerchForm({
      name: "", description: "", image_url: "", price: 0, personalizable: false, badge: "", status: "ACTIVE", sort_order: merchData.length
    })
    setIsMerchModalOpen(true)
  }

  const handleOpenEditMerch = (item: any) => {
    setEditingId(item.id)
    setMerchForm({
      name: item.name, description: item.description || "", image_url: item.image_url || "", price: item.price, 
      personalizable: item.personalizable, badge: item.badge || "", status: item.status, sort_order: item.sort_order || 0
    })
    setIsMerchModalOpen(true)
  }

  const handleSubmitMerch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingId ? `/api/content/merchandise/${editingId}` : '/api/content/merchandise'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...merchForm, price: Number(merchForm.price) })
      })
      if (!res.ok) throw new Error("Failed to save merchandise")
      setIsMerchModalOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // === DELETE ===
  const confirmDelete = async () => {
    if (!deleteConfirmInfo) return
    setLoading(true)
    try {
      const { id, type } = deleteConfirmInfo
      const url = type === 'page' ? `/api/content/static-pages/${id}` : `/api/content/merchandise/${id}`
      const res = await fetch(url, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      
      if (type === 'page') setPagesData(pagesData.filter(d => d.id !== id))
      else setMerchData(merchData.filter(d => d.id !== id))
      
      setDeleteConfirmInfo(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // === COLUMNS ===
  const pageColumns = [
    { header: "Title", accessorKey: "title" as const },
    { header: "Slug", accessorKey: "slug" as const },
    { 
      header: "Last Updated", 
      cell: (item: any) => new Date(item.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" onClick={() => handleOpenEditPage(item)} className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" onClick={() => setDeleteConfirmInfo({id: item.id, type: 'page'})} className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const merchColumns = [
    { header: "Sort", cell: () => <GripVertical size={16} className="text-muted-foreground cursor-grab" /> },
    { 
      header: "Image", 
      cell: (item: any) => (
        <div className="w-8 h-8 rounded-md bg-white p-1 flex items-center justify-center">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-[10px] text-gray-400">N/A</div>
          )}
        </div>
      )
    },
    { header: "Name", accessorKey: "name" as const },
    { 
      header: "Price", 
      cell: (item: any) => `Rp ${Number(item.price).toLocaleString('id-ID')}`
    },
    { header: "Badge", accessorKey: "badge" as const },
    { 
      header: "Personalizable", 
      cell: (item: any) => item.personalizable ? "Yes" : "No"
    },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === 'ACTIVE' ? 'success' : item.status === 'SOLD_OUT' ? 'warning' : 'destructive'}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" onClick={() => handleOpenEditMerch(item)} className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" onClick={() => setDeleteConfirmInfo({id: item.id, type: 'merch'})} className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader 
        title="Content Management" 
        description="Manage static pages and merchandise catalog" 
        action={
          <Button 
            onClick={activeTab === 'PAGES' ? handleOpenAddPage : handleOpenAddMerch} 
            className="gap-2"
          >
            <Plus size={14} /> Add {activeTab === 'PAGES' ? 'Page' : 'Merchandise'}
          </Button>
        } 
      />

      {/* TABS */}
      <div className="flex gap-1 bg-card p-1 border border-border rounded-xl w-fit mb-6">
        <button
          onClick={() => setActiveTab('PAGES')}
          className={`px-6 py-2 rounded-lg text-[13px] font-semibold transition-all ${activeTab === 'PAGES' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Static Pages
        </button>
        <button
          onClick={() => setActiveTab('MERCH')}
          className={`px-6 py-2 rounded-lg text-[13px] font-semibold transition-all ${activeTab === 'MERCH' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Merchandise Catalog
        </button>
      </div>

      {activeTab === 'PAGES' ? (
        <DataTable data={pagesData} columns={pageColumns} keyExtractor={item => item.id} />
      ) : (
        <DataTable data={merchData} columns={merchColumns} keyExtractor={item => item.id} />
      )}

      {/* STATIC PAGE MODAL */}
      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setIsPageModalOpen(false)}>
          <div className="bg-card rounded-[14px] w-full max-w-[600px] overflow-hidden flex flex-col shadow-2xl border border-border my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-foreground">{editingId ? 'Edit Page' : 'Add Page'}</h2>
              <button onClick={() => setIsPageModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitPage} className="px-5 pb-5 pt-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Title</label>
                  <input required value={pageForm.title} onChange={e => setPageForm({ ...pageForm, title: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Terms & Conditions" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Slug</label>
                  <input required value={pageForm.slug} onChange={e => setPageForm({ ...pageForm, slug: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. terms-conditions" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Content (HTML)</label>
                <textarea required value={pageForm.content} onChange={e => setPageForm({ ...pageForm, content: e.target.value })} rows={10} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] font-mono leading-relaxed outline-none focus:border-brand-blue" placeholder="<h1>Title</h1><p>Content here...</p>" />
              </div>
              <div className="flex justify-end gap-2.5 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsPageModalOpen(false)} className="bg-muted text-foreground hover:bg-muted/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold border border-border">Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-primary text-white hover:bg-primary/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold">{loading ? 'Saving...' : '✓ Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERCHANDISE MODAL */}
      {isMerchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setIsMerchModalOpen(false)}>
          <div className="bg-card rounded-[14px] w-full max-w-[600px] overflow-hidden flex flex-col shadow-2xl border border-border my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-foreground">{editingId ? 'Edit Merchandise' : 'Add Merchandise'}</h2>
              <button onClick={() => setIsMerchModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitMerch} className="px-5 pb-5 pt-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Name</label>
                  <input required value={merchForm.name} onChange={e => setMerchForm({ ...merchForm, name: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Tumbler Coffeelab" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Price (Rp)</label>
                  <input required type="number" value={merchForm.price} onChange={e => setMerchForm({ ...merchForm, price: Number(e.target.value) })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Image URL</label>
                <input value={merchForm.image_url} onChange={e => setMerchForm({ ...merchForm, image_url: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Description</label>
                <textarea value={merchForm.description} onChange={e => setMerchForm({ ...merchForm, description: e.target.value })} rows={3} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Badge</label>
                  <select value={merchForm.badge} onChange={e => setMerchForm({ ...merchForm, badge: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue">
                    <option value="">None</option>
                    <option value="New Arrival">New Arrival</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Limited">Limited Edition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Status</label>
                  <select value={merchForm.status} onChange={e => setMerchForm({ ...merchForm, status: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SOLD_OUT">Sold Out</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <button type="button" onClick={() => setMerchForm({ ...merchForm, personalizable: !merchForm.personalizable })} className={`w-10 h-[22px] rounded-full transition-colors relative ${merchForm.personalizable ? 'bg-[#22c55e]' : 'bg-muted border border-border'}`}>
                  <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all ${merchForm.personalizable ? 'left-5' : 'left-[3px] bg-[#8b8fa8]'}`} />
                </button>
                <span className="text-[13px] font-medium text-foreground">Can be personalized?</span>
              </div>
              <div className="flex justify-end gap-2.5 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsMerchModalOpen(false)} className="bg-muted text-foreground hover:bg-muted/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold border border-border">Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-primary text-white hover:bg-primary/80 px-5 py-2 h-auto rounded-lg text-[12px] font-semibold">{loading ? 'Saving...' : '✓ Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteConfirmInfo !== null}
        onClose={() => setDeleteConfirmInfo(null)}
        onConfirm={confirmDelete}
        type="danger"
        title="Confirm Delete"
        message={`Are you sure you want to delete this ${deleteConfirmInfo?.type === 'page' ? 'static page' : 'merchandise item'}?`}
        confirmText={loading ? 'Deleting...' : 'Delete'}
      />
    </div>
  )
}
