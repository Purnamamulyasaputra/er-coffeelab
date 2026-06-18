"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, MapPin, Search } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import dynamic from "next/dynamic"

const MapPicker = dynamic(() => import("@/components/shared/map-picker"), { ssr: false })

export function BranchesClient({ initialData }: { initialData: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [geocoding, setGeocoding] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Form states
  const [editId, setEditId] = React.useState<number | null>(null)
  const [name, setName] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [opStart, setOpStart] = React.useState("08:00")
  const [opEnd, setOpEnd] = React.useState("22:00")
  const [latitude, setLatitude] = React.useState("")
  const [longitude, setLongitude] = React.useState("")
  const [imageUrl, setImageUrl] = React.useState("")
  const [status, setStatus] = React.useState("OPEN")
  const [deliveryRadius, setDeliveryRadius] = React.useState("5")
  const [sortOrder, setSortOrder] = React.useState("0")

  const [pickup, setPickup] = React.useState(true)
  const [delivery, setDelivery] = React.useState(true)
  const [dineIn, setDineIn] = React.useState(false)
  const [taxRate, setTaxRate] = React.useState("10")
  const [svcCharge, setSvcCharge] = React.useState("5")

  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [branchToDelete, setBranchToDelete] = React.useState<{ id: number, name: string } | null>(null)

  const handleOpenAdd = () => {
    setEditId(null)
    setName("")
    setAddress("")
    setPhone("")
    setOpStart("08:00")
    setOpEnd("22:00")
    setLatitude("")
    setLongitude("")
    setImageUrl("")
    setStatus("OPEN")
    setDeliveryRadius("5")
    setSortOrder("0")

    setPickup(true)
    setDelivery(true)
    setDineIn(false)
    setTaxRate("10")
    setSvcCharge("5")
    setOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditId(item.id)
    setName(item.name || "")
    setAddress(item.address || "")
    setPhone(item.phone || "")
    if (item.operating_hours) {
      const parts = item.operating_hours.split('-')
      setOpStart(parts[0]?.trim() || "08:00")
      setOpEnd(parts[1]?.trim() || "22:00")
    } else {
      setOpStart("08:00")
      setOpEnd("22:00")
    }
    setLatitude(String(item.latitude || ""))
    setLongitude(String(item.longitude || ""))
    setImageUrl(item.image_url || "")
    setStatus(item.status || "OPEN")
    setDeliveryRadius(String(item.delivery_radius_km ?? 5))
    setSortOrder(String(item.sort_order ?? 0))

    setPickup(item.pickup_enabled ?? true)
    setDelivery(item.delivery_enabled ?? true)
    setDineIn(item.dinein_enabled ?? false)
    setTaxRate(String(item.tax_rate ?? 10))
    setSvcCharge(String(item.service_charge_pct ?? 5))
    setOpen(true)
  }

  const handleDeleteClick = (item: any) => {
    setBranchToDelete({ id: item.id, name: item.name })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!branchToDelete) return
    setLoading(true)
    try {
      const res = await fetch(`/api/branches?id=${branchToDelete.id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete branch")
      toast("Branch deleted successfully", "success")
      setDeleteConfirmOpen(false)
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleGeocode = async () => {
    if (!address || address.length < 5) {
      toast("Please enter a more specific address first", "error")
      return
    }
    setGeocoding(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
        headers: { "Accept-Language": "id" }
      })
      const data = await res.json()
      if (data && data.length > 0) {
        setLatitude(data[0].lat)
        setLongitude(data[0].lon)
        toast("Location found!", "success")
      } else {
        toast("Location not found. Try placing the pin manually.", "error")
      }
    } catch (err) {
      toast("Failed to search location", "error")
    } finally {
      setGeocoding(false)
    }
  }

  const columns = [
    { header: "No", cell: (_: unknown, index: number) => index + 1 },
    { header: "Name", accessorKey: "name" as const },
    { 
      header: "POS Key", 
      cell: (item: any) => (
        <Badge variant="cool" className="font-mono text-[11px] tracking-widest">{item.pos_key || '-'}</Badge>
      ) 
    },
    {
      header: "Status",
      cell: (item: any) => (
        <Badge variant={item.status === "OPEN" ? "success" : "secondary"}>
          {item.status}
        </Badge>
      )
    },
    { header: "Pickup", cell: (item: any) => item.pickup_enabled ? "Yes" : "No" },
    { header: "Delivery", cell: (item: any) => item.delivery_enabled ? "Yes" : "No" },
    { header: "Dine-In", cell: (item: any) => item.dinein_enabled ? "Yes" : "No" },
    { header: "Tax", cell: (item: any) => `${item.tax_rate}%` },
    { header: "Svc Charge", cell: (item: any) => `${item.service_charge_pct}%` },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEdit(item)}><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => handleDeleteClick(item)}><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/branches", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          name,
          address,
          phone,
          operating_hours: `${opStart} - ${opEnd}`,
          latitude: Number(latitude),
          longitude: Number(longitude),
          image_url: imageUrl,
          status,
          delivery_radius_km: Number(deliveryRadius),
          sort_order: Number(sortOrder),
          pickup_enabled: pickup,
          delivery_enabled: delivery,
          dinein_enabled: dineIn,
          tax_rate: Number(taxRate),
          service_charge_pct: Number(svcCharge)
        })
      })

      if (!res.ok) throw new Error("Failed to save branch")

      toast(editId ? "Branch updated successfully!" : "Branch saved successfully!", "success")
      setOpen(false)
      router.refresh() // re-fetch data from server

    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Manage your coffee shop locations"
        action={
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus size={14} /> Add Branch
          </Button>
        }
      />

      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />

      <Dialog open={open} onOpenChange={setOpen} className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Branch" : "Add Branch"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 px-2 -mx-2 max-h-[70vh] overflow-y-auto">

          <div className="flex flex-col gap-1.5">
            <Label>Branch Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Input Branch Name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Address <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="Full address" value={address} onChange={e => setAddress(e.target.value)} />
              <Button type="button" variant="secondary" onClick={handleGeocode} disabled={geocoding} className="gap-2 px-3 whitespace-nowrap">
                <Search size={14} /> {geocoding ? "Searching..." : "Lacak Lokasi"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-1.5 text-brand-blue"><MapPin size={14} /> Map Location</Label>
              <span className="text-[11px] text-muted-foreground">Click on the map to place the pin</span>
            </div>
            {open && latitude && longitude ? (
              <MapPicker
                position={{ lat: Number(latitude), lng: Number(longitude) }}
                onChange={(pos) => {
                  setLatitude(pos.lat.toFixed(6));
                  setLongitude(pos.lng.toFixed(6));
                }}
              />
            ) : (
              <div className="h-[200px] w-full bg-muted/30 rounded-md border border-border border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2">
                <MapPin size={24} className="opacity-50" />
                <span className="text-sm">Silakan "Lacak Lokasi" terlebih dahulu</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px]">Latitude</Label>
                <Input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px]">Longitude</Label>
                <Input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Input placeholder="Input Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Operating Hours</Label>
              <div className="flex items-center gap-2">
                <select
                  value={opStart}
                  onChange={e => setOpStart(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0') + ':00';
                    return <option key={hour} value={hour}>{hour}</option>
                  })}
                </select>
                <span className="text-muted-foreground">-</span>
                <select
                  value={opEnd}
                  onChange={e => setOpEnd(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i.toString().padStart(2, '0') + ':00';
                    return <option key={hour} value={hour}>{hour}</option>
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="TEMPORARILY_CLOSED">TEMPORARILY CLOSED</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Delivery Radius (Km)</Label>
              <Input type="number" step="0.1" value={deliveryRadius} onChange={e => setDeliveryRadius(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
            <Label className="cursor-pointer">Enable Pickup</Label>
            <Switch checked={pickup} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickup(e.target.checked)} />
          </div>

          <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
            <Label className="cursor-pointer">Enable Delivery</Label>
            <Switch checked={delivery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelivery(e.target.checked)} />
          </div>

          <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
            <Label className="cursor-pointer">Enable Dine-In</Label>
            <Switch checked={dineIn} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDineIn(e.target.checked)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tax Rate (%)</Label>
              <Input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Service Charge (%)</Label>
              <Input type="number" step="0.1" value={svcCharge} onChange={e => setSvcCharge(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Branch Photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  const file = e.target.files[0];
                  setLoading(true);
                  try {
                    const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                      method: "POST",
                      body: file,
                    });
                    const data = await res.json();
                    if (data.url) {
                      setImageUrl(data.url);
                      toast("Image uploaded successfully!", "success");
                    } else {
                      throw new Error(data.error || "Upload failed");
                    }
                  } catch (err: any) {
                    toast(err.message, "error");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="cursor-pointer"
              />
              {imageUrl && (
                <a href={imageUrl} target="_blank" rel="noreferrer" className="text-[11px] text-brand-blue truncate hover:underline">
                  {imageUrl.split('/').pop()}
                </a>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
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
            disabled={loading || !name || !address}
          >
            <Check size={16} /> {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmationModal 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        type="danger"
        title="Delete Branch"
        message={<>Are you sure you want to delete <span className="font-bold text-white">{branchToDelete?.name}</span>? This action cannot be undone.</>}
        confirmText={loading ? "Deleting..." : "Delete"}
      />
    </div>
  )
}
