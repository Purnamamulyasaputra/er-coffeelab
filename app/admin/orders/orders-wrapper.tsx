"use client"

import * as React from "react"
import { OrdersClient } from "./orders-client"
import { OpenBillsClient } from "./open-bills-client"

export function OrdersWrapper({
  orders,
  branchId,
  role
}: {
  orders: any[]
  branchId?: number
  role?: string
}) {
  const [activeTab, setActiveTab] = React.useState<"all-orders" | "open-bills">("all-orders")

  return (
    <div className="flex flex-col gap-3 font-sans">
      <div className="flex border-b border-border mb-0 gap-4">
        <button
          onClick={() => setActiveTab("all-orders")}
          className={`pb-3 text-[15px] font-bold border-b-2 transition-colors ${activeTab === "all-orders"
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
        >
          All Orders History
        </button>
        <button
          onClick={() => setActiveTab("open-bills")}
          className={`pb-3 text-[15px] font-bold border-b-2 transition-colors ${activeTab === "open-bills"
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
        >
          Open Bills (Dine-In)
        </button>
      </div>

      <div>
        {activeTab === "all-orders" ? (
          <OrdersClient initialData={orders} role={role} />
        ) : (
          <OpenBillsClient branchId={branchId} role={role} />
        )}
      </div>
    </div>
  )
}
