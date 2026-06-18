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
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === "all-orders"
            ? "border-primary text-primary dark:border-sky-400 dark:text-sky-400"
            : "border-transparent text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white"
            }`}
        >
          All Orders History
        </button>
        <button
          onClick={() => setActiveTab("open-bills")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === "open-bills"
            ? "border-primary text-primary dark:border-sky-400 dark:text-sky-400"
            : "border-transparent text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white"
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
