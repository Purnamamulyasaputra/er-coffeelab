import { getActiveKdsOrders } from "@/lib/queries/kds"
import { KitchenClient } from "./kitchen-client"
export default async function KitchenPage() {
  const data = await getActiveKdsOrders(1) // Default branch 1
  return (
    <div className="h-screen flex flex-col bg-[#0b0c16] text-white">
      <div className="flex items-center justify-between p-4 border-b border-[#2a2d4a] bg-[#151729]">
        <div className="flex items-center gap-4">
          <h1 className="text-[18px] font-bold">Kitchen Display System (KDS)</h1>
        </div>
      </div>
      <KitchenClient initialData={data} />
    </div>
  )
}


