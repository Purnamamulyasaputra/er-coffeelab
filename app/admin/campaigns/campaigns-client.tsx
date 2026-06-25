"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Link as LinkIcon } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"


export function CampaignsClient({ initialData }: { initialData: any[] }) {
  const { toast } = useToast()

  const handleCopyLink = (item: any) => {
    // Generate a promo URL (adjust path as needed for your public frontend)
    const url = `${window.location.origin}/promo/${item.id}`
    navigator.clipboard.writeText(url)
    toast("Campaign link copied to clipboard!", "success")
  }

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    { 
      header: "Type", 
      cell: (item: any) => item.type ? (
        <span className="capitalize">{item.type.toLowerCase()}</span>
      ) : "-"
    },
    { header: "Start", accessorKey: "start" as const },
    { header: "End", accessorKey: "end" as const },
    { header: "Redemptions", accessorKey: "uses" as const },
    { 
      header: "Status", 
      cell: (item: any) => (
        <Badge variant={item.status === "ACTIVE" ? "success" : item.status === "SCHEDULED" ? "warning" : "secondary"}>
          {item.status}
        </Badge>
      )
    },
    {
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-primary hover:bg-primary/10" 
            onClick={() => handleCopyLink(item)}
            title="Copy Promo Link"
          >
            <LinkIcon size={14} />
          </Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-[#2a2d4a] hover:bg-[#2a2d4a]/90 text-white rounded-[10px]"><Pencil size={14} /></Button>
          <Button size="icon" className="h-[34px] w-[34px] bg-destructive hover:bg-destructive/90 text-white rounded-[10px]"><Trash2 size={14} /></Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="Campaigns" description="Marketing campaigns and rules" action={<Button className="gap-2"><Plus size={14} /> New Campaign</Button>} />
      <DataTable data={initialData} columns={columns} keyExtractor={item => item.id} />
    </div>
  )
}
