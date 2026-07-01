"use client"

import * as React from "react"
import { Plus, Send, Pencil, Trash2, X, MessageSquare, Image as ImageIcon, Link as LinkIcon, BarChart3 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { formatStatus } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function NotificationsClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState<"BROADCAST" | "TEMPLATES">("BROADCAST")
  
  // Broadcast State
  const [bcTitle, setBcTitle] = React.useState("")
  const [bcBody, setBcBody] = React.useState("")
  const [bcAudience, setBcAudience] = React.useState("ALL")
  const [bcSending, setBcSending] = React.useState(false)

  // Templates State
  const [data, setData] = React.useState(initialData)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null)

  const [form, setForm] = React.useState({
    name: "", type: "ORDER_STATUS", title_template: "", body_template: "", image_url: "", action_url: "", active: true
  })

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bcTitle || !bcBody) {
      toast("Title and body are required.", "error")
      return
    }
    setBcSending(true)
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bcTitle, body: bcBody, audience: bcAudience })
      })
      if (!res.ok) throw new Error("Failed to send broadcast")
      toast("Broadcast sent successfully!", "success")
      setBcTitle("")
      setBcBody("")
    } catch (e) {
      console.error(e)
      toast("Failed to send notification", "error")
    } finally {
      setBcSending(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm({ name: "", type: "ORDER_STATUS", title_template: "", body_template: "", image_url: "", action_url: "", active: true })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      type: item.type,
      title_template: item.title_template,
      body_template: item.body_template,
      image_url: item.image_url || "",
      action_url: item.action_url || "",
      active: item.active
    })
    setIsModalOpen(true)
  }

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editingId ? `/api/notifications/templates/${editingId}` : '/api/notifications/templates'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error("Failed to save template")
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
      const res = await fetch(`/api/notifications/templates/${deleteConfirmId}`, { method: "DELETE" })
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

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const templateColumns = [
    { header: "Name", accessorKey: "name" as const },
    { header: "Type", accessorKey: "type" as const },
    { header: "Title Template", accessorKey: "title_template" as const },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.active ? 'success' : 'destructive'}>
          {item.active ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
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
        title="Notifications" 
        description="Push notifications and automated templates" 
      />

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab("BROADCAST")}
          className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${activeTab === "BROADCAST" ? "border-brand-blue text-brand-blue" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Push Composer
        </button>
        <button 
          onClick={() => setActiveTab("TEMPLATES")}
          className={`pb-2 text-[13px] font-bold border-b-2 transition-colors ${activeTab === "TEMPLATES" ? "border-brand-blue text-brand-blue" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Automated Templates
        </button>
      </div>

      {activeTab === "BROADCAST" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground font-bold mb-3 flex items-center gap-2 text-[14px]"><MessageSquare size={14} className="text-brand-blue"/> Compose Message</h3>
            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Target Audience</label>
                <select value={bcAudience} onChange={e => setBcAudience(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-[12px] h-9 outline-none focus:border-brand-blue transition-colors">
                  <option value="ALL">All Customers</option>
                  <option value="PLATINUM">Platinum Members Only</option>
                  <option value="INACTIVE_30">Inactive for 30+ Days</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Load from Template (Optional)</label>
                <select 
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) {
                      setBcTitle("")
                      setBcBody("")
                      return
                    }
                    const t = data.find((d: any) => String(d.id) === String(val))
                    if (t) {
                      setBcTitle(formatStatus(t.name) || "")
                      setBcBody(t.body_template || "")
                    }
                  }} 
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-[12px] h-9 outline-none focus:border-brand-blue transition-colors appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8fa8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                >
                  <option value="">-- Custom Message --</option>
                  {data.filter((d: any) => d.active).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Notification Title</label>
                <input required value={bcTitle} onChange={e => setBcTitle(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-[12px] h-9 outline-none focus:border-brand-blue transition-colors placeholder:text-muted-foreground/50" placeholder="e.g. Flash Sale Alert!" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Message Body</label>
                <textarea required rows={3} value={bcBody} onChange={e => setBcBody(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-[12px] outline-none focus:border-brand-blue transition-colors resize-none placeholder:text-muted-foreground/50" placeholder="Enter the main text of your push notification..." />
              </div>
              <Button type="submit" disabled={bcSending} className="w-full bg-brand-blue hover:bg-brand-blue/80 text-white text-[13px] font-bold mt-1 h-10">
                {bcSending ? "Sending..." : <><Send size={14} className="mr-2" /> Send Broadcast Now</>}
              </Button>
            </form>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-[180px] h-[360px] bg-black rounded-[24px] border-[5px] border-[#1c1f3a] relative overflow-hidden shadow-2xl flex flex-col justify-center items-center p-2">
              <div className="absolute top-0 w-[80px] h-4 bg-[#1c1f3a] rounded-b-lg"></div>
              
              <div className="w-full bg-[#1a1c29]/90 backdrop-blur-md rounded-xl p-2.5 shadow-lg border border-white/10 mt-auto mb-[60px] transform transition-all">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-brand-blue flex items-center justify-center text-[7px] font-bold text-white">ER</div>
                  <span className="text-[8px] text-white/60 font-medium">ER Coffeelab • now</span>
                </div>
                <h4 className="text-white font-bold text-[11px] leading-tight mb-0.5">{bcTitle || "Notification Title"}</h4>
                <p className="text-white/80 text-[10px] leading-tight line-clamp-3">{bcBody || "This is how your message body will appear on the customer's lock screen."}</p>
              </div>
              
              <div className="absolute bottom-1.5 w-[60px] h-[3px] bg-white/20 rounded-full"></div>
            </div>
            <p className="text-muted-foreground text-[12px] mt-4 font-medium">Lock Screen Preview</p>
          </div>
        </div>
      )}

      {activeTab === "TEMPLATES" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div className="text-[13px] text-muted-foreground">Manage templates triggered by system events.</div>
            <Button onClick={handleOpenAdd} className="bg-muted text-foreground hover:bg-muted/80 border border-border h-9 gap-2">
              <Plus size={14} /> New Template
            </Button>
          </div>
          <DataTable data={data} columns={templateColumns} keyExtractor={item => item.id} />
        </div>
      )}

      {/* Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card rounded-[14px] w-full max-w-[600px] overflow-hidden flex flex-col shadow-2xl border border-border my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-[18px] font-bold text-foreground">{editingId ? 'Edit Template' : 'Add Template'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitTemplate} className="px-6 py-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Template Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Order Placed" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Trigger Event (Type)</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue">
                    <option value="ORDER_STATUS">Order Status Change</option>
                    <option value="PAYMENT_SUCCESS">Payment Success</option>
                    <option value="BIRTHDAY">Birthday Reward</option>
                    <option value="ABANDONED_CART">Abandoned Cart</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Title Template</label>
                <input required value={form.title_template} onChange={e => setForm({ ...form, title_template: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue" placeholder="e.g. Your Order {{order_id}} is Ready" />
                <p className="text-[10px] text-muted-foreground mt-1.5">Supports variables like {'{{order_id}}, {{customer_name}}'}</p>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Body Template</label>
                <textarea required rows={3} value={form.body_template} onChange={e => setForm({ ...form, body_template: e.target.value })} className="w-full bg-muted border border-border rounded-lg px-3.5 py-2.5 text-foreground text-[13px] outline-none focus:border-brand-blue resize-none" placeholder="Message content..." />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Switch id="activeToggle" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
                <label htmlFor="activeToggle" className="text-[13px] text-foreground select-none font-medium cursor-pointer">Template is Active</label>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="bg-muted text-foreground hover:bg-muted/80 border border-border h-10 px-5 rounded-lg text-[13px] font-semibold">Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-brand-blue hover:bg-brand-blue/80 text-white h-10 px-6 rounded-lg text-[13px] font-bold">{loading ? 'Saving...' : 'Save Template'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card rounded-[16px] w-full max-w-[340px] p-6 flex flex-col items-center text-center shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#ef4444]/10 flex items-center justify-center mb-4 border border-[#ef4444]/20"><Trash2 className="text-[#ef4444] w-6 h-6" /></div>
            <h3 className="text-[18px] font-semibold text-foreground mb-2">Delete Template?</h3>
            <p className="text-muted-foreground text-[13px] mb-6 leading-relaxed">This action cannot be undone.</p>
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
