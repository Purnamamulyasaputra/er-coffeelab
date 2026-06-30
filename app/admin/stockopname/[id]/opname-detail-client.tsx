"use client"

import * as React from "react"
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

function formatCategory(cat: string) {
  if (!cat) return "-"
  return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}

function FormattedStockInput({ value, onChange, disabled, unit }: any) {
  const [isFocused, setIsFocused] = React.useState(false)
  
  const rawNumber = value === null || value === "" ? "" : Number(value)
  const displayValueText = rawNumber === "" ? "" : rawNumber.toLocaleString('id-ID')

  // When focused, if the value is 0, we can show an empty string so the user can just start typing
  // Otherwise show the raw number (strips the .000 from postgres numeric)
  const focusedValue = rawNumber === 0 ? "" : rawNumber

  return (
    <Input
      type={isFocused ? "number" : "text"}
      value={isFocused ? focusedValue : (displayValueText ? `${displayValueText} ${unit}` : "")}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => {
        if (isFocused) {
          onChange(e.target.value)
        }
      }}
      disabled={disabled}
      className="h-7 w-28 text-right text-[13px] px-2"
      placeholder={`0 ${unit}`}
    />
  )
}

export function OpnameDetailClient({ opname }: { opname: any }) {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  React.useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/stockopname/${opname.id}`)
      if (!res.ok) throw new Error("Failed to fetch items")
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleActualChange = (id: number, value: string) => {
    const numValue = value === "" ? "" : Number(value)

    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          actual_stock: numValue,
          difference: value === "" ? 0 : Number(numValue) - Number(item.system_stock)
        }
      }
      return item
    }))
  }

  const handleSave = async (action: "SAVE" | "COMPLETE") => {
    if (action === "COMPLETE" && !isConfirmOpen) {
      setIsConfirmOpen(true)
      return
    }

    setSaving(true)
    setIsConfirmOpen(false)
    try {
      const res = await fetch(`/api/stockopname/${opname.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, action })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")

      toast(action === "COMPLETE" ? "Stock Opname completed successfully!" : "Draft saved successfully", "success")

      if (action === "COMPLETE") {
        router.push("/admin/stockopname")
        router.refresh()
      }
    } catch (e: any) {
      toast(e.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const isCompleted = opname.status === "COMPLETED"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/stockopname">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Opname #{opname.id}</h1>
          <p className="text-sm text-muted-foreground">
            {opname.branch_name} &bull; Conducted by {opname.employee_name}
          </p>
        </div>
        <div>
          <Badge variant={isCompleted ? "success" : "warning"} className="text-sm px-3 py-1">
            {opname.status}
          </Badge>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2">Ingredient</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">System Stock</th>
                <th className="px-3 py-2 text-right w-32">Actual Stock</th>
                <th className="px-3 py-2 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading items...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No items found for this branch.</td>
                </tr>
              ) : items.map((item) => {
                const diff = Number(item.difference) || 0
                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-1.5 font-medium text-foreground">{item.ingredient_name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{formatCategory(item.category)}</td>
                    <td className="px-3 py-1.5 text-right">
                      {Number(item.system_stock).toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="px-3 py-1.5 flex justify-end">
                      <FormattedStockInput
                        value={item.actual_stock}
                        onChange={(val: string) => handleActualChange(item.id, val)}
                        disabled={isCompleted || saving}
                        unit={item.unit}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <span className={`font-medium ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {diff > 0 ? '+' : ''}{diff.toLocaleString('id-ID')} {item.unit}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!isCompleted && !loading && (
          <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/20">
            <Button
              variant="outline"
              onClick={() => handleSave("SAVE")}
              disabled={saving}
              className="gap-2"
            >
              <Save size={16} /> Save Draft
            </Button>
            <Button
              onClick={() => handleSave("COMPLETE")}
              disabled={saving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 size={16} /> Complete Opname
            </Button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => handleSave("COMPLETE")}
        type="warning"
        title="Complete Stock Opname"
        message="Are you sure you want to COMPLETE this Stock Opname?"
        confirmText={saving ? "Completing..." : "Yes, Complete It"}
        cancelText="Cancel"
      />
    </div>
  )
}
