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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"

function formatMoney(amount: number) {
  return "Rp " + Number(amount).toLocaleString("id-ID")
}

export function ProductsClient({ initialData, categories }: { initialData: any[], categories: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [catId, setCatId] = React.useState(categories[0]?.id?.toString() || "")
  const [price, setPrice] = React.useState("")
  const [cost, setCost] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [badge, setBadge] = React.useState("-")
  const [active, setActive] = React.useState(true)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imageUrl, setImageUrl] = React.useState("")

  const [editId, setEditId] = React.useState<number | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  const openAddModal = () => {
    setEditId(null)
    setName("")
    setDescription("")
    setCatId(categories[0]?.id?.toString() || "")
    setPrice("")
    setCost("")
    setSku("")
    setBadge("-")
    setActive(true)
    setImageFile(null)
    setImageUrl("")
    setOpen(true)
  }

  const openEditModal = (item: any) => {
    setEditId(item.id)
    setName(item.name || "")
    setDescription(item.description || "")
    setCatId(item.category_id?.toString() || "")
    setPrice(item.price ? item.price.toLocaleString("id-ID") : "")
    setCost(item.cost ? item.cost.toLocaleString("id-ID") : "")
    setSku(item.sku || "")
    setBadge(item.badge || "-")
    setActive(item.status === "ACTIVE")
    setImageFile(null)
    setImageUrl(item.image_url || "")
    setOpen(true)
  }

  const columns = [
    { header: "No", cell: (_: any, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { header: "Category", accessorKey: "cat" as const },
    { header: "Price", cell: (item: any) => formatMoney(item.price) },
    { header: "Cost", cell: (item: any) => formatMoney(item.cost) },
    {
      header: "Badge",
      cell: (item: any) => item.badge && item.badge !== "-" ? (
        <Badge variant={item.badge === "BEST_SELLER" ? "warning" : item.badge === "POPULAR" ? "cool" : "success"}>
          {item.badge}
        </Badge>
      ) : "-"
    },
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
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => openEditModal(item)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => {
            setDeleteId(item.id)
            setDeleteModalOpen(true)
          }}>
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  const catOptions = categories.map(c => ({ label: c.name, value: c.id.toString() }))

  const handleSave = async () => {
    setLoading(true)
    try {
      let finalImageUrl = imageUrl
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        
        const resBlob = await fetch(`/api/upload`, {
          method: "POST",
          body: formData,
        })
        if (!resBlob.ok) {
          const d = await resBlob.json().catch(() => ({}))
          throw new Error(d.error || "Failed to upload image")
        }
        const blob = await resBlob.json()
        finalImageUrl = blob.url
      }

      const url = editId ? `/api/products/${editId}` : "/api/products"
      const method = editId ? "PUT" : "POST"

      let finalSku = sku
      if (!finalSku) {
        const catName = categories.find(c => c.id.toString() === catId)?.name || "PRD"
        const namePrefix = name ? name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() : "XXX"
        const catPrefix = catName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        finalSku = `${catPrefix}-${namePrefix}-${randomNum}`
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category_id: Number(catId),
          price: Number(price.replace(/[^0-9]/g, '')),
          cost: Number(cost.replace(/[^0-9]/g, '')),
          sku: finalSku,
          badge: badge === "None" ? "-" : badge,
          status: active ? "ACTIVE" : "INACTIVE",
          image_url: finalImageUrl
        })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save product")
      }

      toast(editId ? "Product updated successfully!" : "Product added successfully!", "success")
      setOpen(false)
      router.refresh()

      setName("")
      setPrice("")
      setCost("")
      setSku("")
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to delete product")
      }
      toast("Product deleted successfully!", "success")
      setDeleteModalOpen(false)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${initialData.length} items`}
        action={
          <Button onClick={openAddModal} className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold gap-2">
            <Plus size={14} /> Add Product
          </Button>
        }
      />

      <DataTable
        data={initialData}
        columns={columns}
        keyExtractor={item => item.id.toString()}
      />

      <Dialog open={open} onOpenChange={setOpen} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 overflow-y-auto px-1 max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select options={catOptions} value={catId} onChange={e => setCatId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Price (Rp)</Label>
            <Input 
              type="text" 
              placeholder="Price" 
              value={price} 
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPrice(val ? parseInt(val, 10).toLocaleString('id-ID') : "");
              }} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cost/COGS (Rp)</Label>
            <Input 
              type="text" 
              placeholder="Cost" 
              value={cost} 
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setCost(val ? parseInt(val, 10).toLocaleString('id-ID') : "");
              }} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Badge</Label>
            <Select
              options={[
                { label: "None", value: "None" },
                { label: "BEST_SELLER", value: "BEST_SELLER" },
                { label: "NEW", value: "NEW" },
                { label: "POPULAR", value: "POPULAR" },
                { label: "PROMO", value: "PROMO" }
              ]}
              value={badge} onChange={e => setBadge(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Image</Label>
            <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            {(imageUrl || imageFile) && (
              <div className="mt-1 text-xs text-muted-foreground">
                {imageFile ? `Selected: ${imageFile.name}` : "Image uploaded."}
              </div>
            )}
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea 
              placeholder="Product description (optional)" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3 mt-2 mb-1">
            <Switch id="active-product" checked={active} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActive(e.target.checked)} />
            <Label htmlFor="active-product" className="text-[13px] font-semibold text-foreground">Active</Label>
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
            disabled={loading || !name || !price}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText={loading ? "Deleting..." : "Yes, Delete"}
        type="danger"
      />
    </div>
  )
}
