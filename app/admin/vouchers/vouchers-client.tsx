"use client"

import * as React from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function VouchersClient({ initialData }: { initialData: any[] }) {
  const columns = [
    { header: "Code", accessorKey: "code" as const },
    { 
      header: "Discount", 
      cell: (item: any) => {
        if (item.discount_type === 'PERCENTAGE') {
          return `${item.discount_value}% ${item.max_discount ? `(Max IDR ${item.max_discount.toLocaleString()})` : ''}`
        }
        return `IDR ${Number(item.discount_value).toLocaleString()}`
      } 
    },
    { header: "Min Order", cell: (item: any) => "IDR " + Number(item.min_transaction).toLocaleString() },
    { header: "Quota", cell: (item: any) => `${item.used_count}/${item.usage_quota || 'Unltd'}` },
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
      <PageHeader title="Vouchers" description="Promo codes and discounts" action={<Button className="gap-2"><Plus size={14} /> Generate</Button>} />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id.toString()} />
    </div>
  )
}
