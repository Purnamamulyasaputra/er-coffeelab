"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, TrendingUp, TrendingDown, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useRouter } from "next/navigation"

type TabType = "tiers" | "transactions" | "reports"

export function LoyaltyClient({
  initialTiers,
  initialTransactions,
  initialStats,
  customers,
  role
}: {
  initialTiers: any[],
  initialTransactions: any[],
  initialStats: any,
  customers: any[],
  role?: string
}) {
  const { toast } = useToast()
  const router = useRouter()

  const [activeTab, setActiveTab] = React.useState<TabType>("tiers")
  const [loading, setLoading] = React.useState(false)

  // --- TIERS STATE ---
  const [openTierModal, setOpenTierModal] = React.useState(false)
  const [editTierId, setEditTierId] = React.useState<number | null>(null)
  const [tierName, setTierName] = React.useState("")
  const [minSpend, setMinSpend] = React.useState("")
  const [pointMultiplier, setPointMultiplier] = React.useState("1")
  const [benefits, setBenefits] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState("0")
  const [deleteTierId, setDeleteTierId] = React.useState<number | null>(null)

  // --- ADJUSTMENT STATE ---
  const [openAdjustModal, setOpenAdjustModal] = React.useState(false)
  const [adjCustomerId, setAdjCustomerId] = React.useState("")
  const [adjPoints, setAdjPoints] = React.useState("")
  const [adjDescription, setAdjDescription] = React.useState("")

  const handleOpenAddTier = () => {
    setEditTierId(null)
    setTierName("")
    setMinSpend("")
    setPointMultiplier("1")
    setBenefits("")
    setSortOrder(initialTiers.length.toString())
    setOpenTierModal(true)
  }

  const handleOpenEditTier = (tier: any) => {
    setEditTierId(tier.id)
    setTierName(tier.name)
    setMinSpend(tier.min_spend?.toString() || "0")
    setPointMultiplier(tier.point_multiplier?.toString() || "1")
    setBenefits(tier.benefits || "")
    setSortOrder(tier.sort_order?.toString() || "0")
    setOpenTierModal(true)
  }

  const handleSaveTier = async () => {
    if (!tierName || !minSpend || !pointMultiplier) return
    setLoading(true)
    try {
      const url = editTierId ? `/api/loyalty/tiers/${editTierId}` : "/api/loyalty/tiers"
      const method = editTierId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tierName,
          min_spend: Number(minSpend),
          point_multiplier: Number(pointMultiplier),
          benefits,
          sort_order: Number(sortOrder)
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save tier")
      }
      toast("Tier saved successfully", "success")
      setOpenTierModal(false)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTier = async () => {
    if (!deleteTierId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/loyalty/tiers/${deleteTierId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete tier")
      toast("Tier deleted", "success")
      setDeleteTierId(null)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAdjustment = async () => {
    if (!adjCustomerId || !adjPoints) return
    setLoading(true)
    try {
      const res = await fetch("/api/loyalty/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: adjCustomerId,
          points: adjPoints,
          description: adjDescription
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to adjust points")
      }

      toast("Points adjusted successfully", "success")
      setOpenAdjustModal(false)
      router.refresh()
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const tierColumns = [
    { header: "Sort", accessorKey: "sort_order" as const },
    { header: "Tier Name", accessorKey: "name" as const },
    { header: "Min Spend", cell: (item: any) => `Rp ${Number(item.min_spend).toLocaleString('id-ID')}` },
    { header: "Multiplier", cell: (item: any) => `${item.point_multiplier}x` },
    { header: "Benefits", cell: (item: any) => <span className="text-sm text-slate-500 max-w-[200px] truncate block" title={item.benefits}>{item.benefits || "-"}</span> },
    {
      header: "Actions",
      cell: (item: any) => role === "SUPERADMIN" ? (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]" onClick={() => handleOpenEditTier(item)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]" onClick={() => setDeleteTierId(item.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ) : null
    }
  ]

  const txColumns = [
    { header: "Date", cell: (item: any) => new Date(item.created_at).toLocaleString('id-ID') },
    { header: "Customer", cell: (item: any) => <span className="font-medium">{item.customer_name}</span> },
    {
      header: "Type",
      cell: (item: any) => (
        <Badge variant={item.type === 'EARN' ? 'success' : item.type === 'SPEND' ? 'destructive' : 'warning'}>
          {item.type}
        </Badge>
      )
    },
    {
      header: "Points",
      cell: (item: any) => (
        <span className={`font-bold ${item.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {item.points > 0 ? '+' : ''}{item.points}
        </span>
      )
    },
    { header: "Balance After", cell: (item: any) => item.balance_after },
    { header: "Description", cell: (item: any) => <span className="text-sm text-slate-500">{item.description || "-"}</span> }
  ]

  const custOptions = [{ label: "Select Customer", value: "" }, ...customers.map(c => ({ label: `${c.name} (${c.phone || c.email || 'No contact'})`, value: c.id.toString() }))]

  return (
    <div>
      <PageHeader
        title="Loyalty Program"
        description="Manage customer tiers, point adjustments, and analytics"
        action={
          activeTab === "tiers" && role === "SUPERADMIN" ? (
            <Button onClick={handleOpenAddTier} className="gap-2"><Plus size={14} /> Add Tier</Button>
          ) : activeTab === "transactions" && (role === "SUPERADMIN" || role === "STORE_ADMIN") ? (
            <Button onClick={() => {
              setAdjCustomerId(""); setAdjPoints(""); setAdjDescription(""); setOpenAdjustModal(true);
            }} className="gap-2"><Plus size={14} /> Adjust Points</Button>
          ) : undefined
        }
      />

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit mb-6">
        <button onClick={() => setActiveTab("tiers")} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'tiers' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Tiers
        </button>
        <button onClick={() => setActiveTab("transactions")} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'transactions' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Transactions
        </button>
        <button onClick={() => setActiveTab("reports")} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'reports' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          Reports
        </button>
      </div>

      {activeTab === "tiers" && (
        <DataTable data={initialTiers} columns={tierColumns} keyExtractor={item => item.id.toString()} />
      )}

      {activeTab === "transactions" && (
        <DataTable data={initialTransactions} columns={txColumns} keyExtractor={item => item.id.toString()} />
      )}

      {activeTab === "reports" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-5 rounded-[14px] flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users size={16} />
                <span className="text-[13px] font-bold">Active Members (30d)</span>
              </div>
              <div className="text-2xl font-extrabold">{initialStats?.activeMembers?.toLocaleString('id-ID')}</div>
            </div>
            <div className="bg-card border border-border p-5 rounded-[14px] flex flex-col justify-center">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <TrendingUp size={16} />
                <span className="text-[13px] font-bold text-muted-foreground">Points Issued (30d)</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">{initialStats?.pointsIssued?.toLocaleString('id-ID')}</div>
            </div>
            <div className="bg-card border border-border p-5 rounded-[14px] flex flex-col justify-center">
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <TrendingDown size={16} />
                <span className="text-[13px] font-bold text-muted-foreground">Points Redeemed (30d)</span>
              </div>
              <div className="text-2xl font-extrabold text-rose-600">{initialStats?.pointsRedeemed?.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div className="bg-card border border-border p-5 rounded-[14px] h-[350px] flex items-center justify-center">
            <span className="text-muted-foreground">Chart visualization will be mounted here.</span>
          </div>
        </div>
      )}

      {/* Tier Modal */}
      <Dialog open={openTierModal} onOpenChange={setOpenTierModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTierId ? "Edit Tier" : "Add Tier"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2 px-1">
            <div className="flex flex-col gap-1.5">
              <Label>Tier Name</Label>
              <Input value={tierName} onChange={e => setTierName(e.target.value)} placeholder="e.g. Gold" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Min Spend (Rp)</Label>
                <Input type="number" value={minSpend} onChange={e => setMinSpend(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Point Multiplier</Label>
                <Input type="number" step="0.1" value={pointMultiplier} onChange={e => setPointMultiplier(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Benefits Description</Label>
              <Input value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="Free wifi, 10% off..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenTierModal(false)} disabled={loading} className="bg-slate-600 hover:bg-slate-700 text-white">Cancel</Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveTier} disabled={loading || !tierName || !minSpend}>
              <Check size={16} /> {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Points Modal */}
      <Dialog open={openAdjustModal} onOpenChange={setOpenAdjustModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Customer Points</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2 px-1">
            <div className="flex flex-col gap-1.5">
              <Label>Customer</Label>
              <Select options={custOptions} value={adjCustomerId} onChange={e => setAdjCustomerId(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Points (+ to add, - to deduct)</Label>
              <Input type="number" value={adjPoints} onChange={e => setAdjPoints(e.target.value)} placeholder="e.g. 500 or -200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reason / Description</Label>
              <Input value={adjDescription} onChange={e => setAdjDescription(e.target.value)} placeholder="Compensate for delayed order" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenAdjustModal(false)} disabled={loading} className="bg-slate-600 hover:bg-slate-700 text-white">Cancel</Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveAdjustment} disabled={loading || !adjCustomerId || !adjPoints}>
              <Check size={16} /> {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteTierId !== null}
        onClose={() => setDeleteTierId(null)}
        type="danger"
        title="Delete Tier"
        message="Are you sure you want to delete this tier?"
        onConfirm={handleDeleteTier}
        confirmText={loading ? "Deleting..." : "Delete"}
      />
    </div>
  )
}
