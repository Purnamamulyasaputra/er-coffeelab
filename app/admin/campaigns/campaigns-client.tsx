"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Link as LinkIcon, Check, Upload } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"

export function CampaignsClient({ initialData }: { initialData: any[] }) {
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<number | null>(null)

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [imageUrl, setImageUrl] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [status, setStatus] = React.useState("ACTIVE")

  const [uploading, setUploading] = React.useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [campaignToDelete, setCampaignToDelete] = React.useState<any>(null)

  const handleCopyLink = (item: any) => {
    const url = `${window.location.origin}/promo/${item.id}`
    navigator.clipboard.writeText(url)
    toast("Campaign link copied to clipboard!", "success")
  }

  const columns = [
    { header: "Name", cell: (item: any) => <span className="whitespace-nowrap font-medium">{item.name}</span> },
    { header: "Period", cell: (item: any) => <span className="whitespace-nowrap text-slate-500">{item.start} - {item.end}</span> },
    { header: "Linked Vouchers", cell: (item: any) => <span className="whitespace-nowrap">{item.vouchers_count || 0}</span> },
    {
      header: "Status",
      cell: (item: any) => (
        <span className="whitespace-nowrap">
          <Badge variant={item.status === "ACTIVE" ? "success" : item.status === "SCHEDULED" ? "warning" : "secondary"}>
            {item.status}
          </Badge>
        </span>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1 whitespace-nowrap">
          <Button
            variant="ghost"
            size="icon"
            className="h-[34px] w-[34px] text-primary hover:bg-primary/10"
            onClick={() => handleCopyLink(item)}
            title="Copy Promo Link"
          >
            <LinkIcon size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => { setCampaignToDelete(item); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const resetForm = () => {
    setEditId(null)
    setName("")
    setDescription("")
    setImageUrl("")
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(today.getMonth() + 1)
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(nextMonth.toISOString().split('T')[0])
    setStatus("ACTIVE")
  }

  const handleOpenAdd = () => {
    resetForm()
    setOpen(true)
  }

  const handleEdit = (item: any) => {
    setEditId(item.id)
    setName(item.name)
    setDescription(item.description || "")
    setImageUrl(item.image_url || "")
    setStartDate(item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : "")
    setEndDate(item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : "")
    setStatus(item.status || "ACTIVE")
    setOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setImageUrl(data.url)
      toast("Image uploaded successfully", "success")
    } catch (error: any) {
      toast(error.message, "error")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const url = editId ? `/api/campaigns/${editId}` : "/api/campaigns"
      const method = editId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, imageUrl, startDate, endDate, status
        })
      })

      if (!res.ok) throw new Error(`Failed to ${editId ? 'update' : 'create'} campaign`)

      toast(`Campaign ${editId ? 'updated' : 'created'} successfully!`, "success")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete campaign");

      toast("Campaign deleted successfully", "success");
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
        title="Campaigns"
        description="Marketing campaigns and rules"
        action={<Button onClick={handleOpenAdd} className="gap-2"><Plus size={14} /> New Campaign</Button>}
      />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Campaign" : "Add Campaign"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 px-1 overflow-y-auto max-h-[65vh] pr-2">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramadan Promo 2026" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Banner / Image</Label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <Button type="button" variant="outline" className="w-full gap-2 text-muted-foreground border-dashed bg-muted/50 justify-center font-normal" disabled={uploading}>
                    <Upload size={14} />
                    {uploading ? "Uploading..." : "Click to Upload Image"}
                  </Button>
                </div>
                {imageUrl && !uploading && (
                  <div className="w-full h-[120px] rounded-md overflow-hidden border border-border mt-1">
                    <img src={`/api/image?url=${encodeURIComponent(imageUrl)}`} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                options={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                  { label: "Scheduled", value: "SCHEDULED" }
                ]}
                value={status}
                onChange={e => setStatus(e.target.value)}
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
            disabled={loading || uploading || !name || !startDate || !endDate}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="danger"
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign?"
        onConfirm={handleDelete}
        confirmText={loading ? "Deleting..." : "Delete"}
      />
    </div>
  )
}
