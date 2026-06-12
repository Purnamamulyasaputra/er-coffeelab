"use client"

import * as React from "react"
import { AlertTriangle, Clock, CheckCircle2, ChevronRight } from "lucide-react"

const mockKDS = [
  { id: "INV-A2", type: "DELIVERY", time: "12:10", status: "NEW", items: ["1x Espresso Tonic"], table: "-" },
  { id: "INV-P4", type: "POS", time: "02:15", status: "NEW", items: ["2x Butterscotch Latte", "1x Almond Croissant"], table: "T02" },
  { id: "INV-A1", type: "PICKUP", time: "05:30", status: "IN_PROGRESS", items: ["1x Americano", "1x Dark Chocolate"], table: "-" },
  { id: "INV-P2", type: "DINEIN", time: "08:45", status: "IN_PROGRESS", items: ["3x Thai Tea Aren", "1x Croissant"], table: "-" },
  { id: "INV-P1", type: "POS", time: "01:05", status: "READY", items: ["1x Matcha Oat", "1x Espresso", "1x Cake"], table: "T05" }
]

import { useToast } from "@/components/ui/use-toast"

export default function KDSPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { toast } = useToast()
  
  const newOrders = mockKDS.filter(o => o.status === "NEW")
  const progOrders = mockKDS.filter(o => o.status === "IN_PROGRESS")
  const readyOrders = mockKDS.filter(o => o.status === "READY")

  const Column = ({ title, orders, type }: { title: string, orders: typeof mockKDS, type: 0 | 1 | 2 }) => {
    const color = type === 0 ? "text-destructive" : type === 1 ? "text-warning" : "text-success"
    const bgOpacity = type === 0 ? "bg-destructive/20" : type === 1 ? "bg-warning/20" : "bg-success/20"
    const borderColor = type === 0 ? "border-l-destructive" : type === 1 ? "border-l-warning" : "border-l-success"
    const Icon = type === 0 ? AlertTriangle : type === 1 ? Clock : CheckCircle2

    return (
      <div className="flex flex-col flex-1 min-w-[280px]">
        <div className={`flex items-center gap-1.5 mb-2 text-[13px] font-bold text-foreground`}>
          <Icon size={15} className={color} />
          {title} 
          <span className={`${bgOpacity} ${color} px-1.5 py-[1px] rounded-md text-[10px] font-bold ml-1`}>
            {orders.length}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {orders.map(o => {
            const isApp = o.id.includes("A")
            const srcBg = isApp ? "bg-primary/20" : "bg-cyan-500/20"
            const srcColor = isApp ? "text-primary" : "text-cyan-500"
            
            return (
              <div key={o.id} className={`bg-card border border-border rounded-xl p-3 border-l-4 ${borderColor}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className="font-bold text-[13px] text-foreground">#{o.id.split("-")[1]}</div>
                  <div className={`text-[10px] font-bold px-1.5 py-[1px] rounded-md ${srcBg} ${srcColor}`}>
                    {isApp ? "APP" : "POS"}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground mb-1.5">
                  {o.items.length} items - {o.type}
                </div>
                <button 
                  onClick={() => toast("Bumped", "success")}
                  className="w-full py-1.5 bg-muted text-foreground rounded-md font-bold text-[11px] cursor-pointer hover:brightness-110 transition-colors flex items-center justify-center gap-1"
                >
                  BUMP <ChevronRight size={12} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col font-sans gap-6 ${!isEmbedded ? 'min-h-screen bg-background text-foreground p-6' : 'h-full w-full'}`}>
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight m-0 text-foreground">Kitchen Display</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Live tickets</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] font-bold text-success">LIVE</span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        <Column title="NEW" orders={newOrders} type={0} />
        <Column title="IN PROGRESS" orders={progOrders} type={1} />
        <Column title="READY" orders={readyOrders} type={2} />
      </div>
    </div>
  )
}
