"use client"

import * as React from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"



export function LoyaltyClient({ initialData }: { initialData: any[] }) {
  const columns = [
    { header: "Tier Name", accessorKey: "name" as const },
    { header: "Min Points", accessorKey: "min" as const },
    { header: "Point Multiplier", accessorKey: "mult" as const },
    { header: "Special Perk", accessorKey: "perk" as const },
    {
      header: "Actions",
      cell: () => (
        <div className="flex gap-1">
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="Loyalty Program" description="Point tiers and earning rules" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-[12px] text-muted-foreground font-bold">Earning Rate</div>
          <div className="text-xl font-extrabold mt-1">1 Pt / IDR 10,000</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] text-muted-foreground font-bold">Points Issued</div>
          <div className="text-xl font-extrabold mt-1">2,450,000</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] text-muted-foreground font-bold">Points Redeemed</div>
          <div className="text-xl font-extrabold mt-1">1,120,000</div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="text-lg font-extrabold">Membership Tiers</h3>
        <Button size="sm" className="gap-2"><Plus size={14} /> Add Tier</Button>
      </div>
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id} />
    </div>
  )
}
