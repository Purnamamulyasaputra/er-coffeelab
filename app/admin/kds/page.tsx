import { getActiveKdsOrders } from "@/lib/queries/kds"
import { KitchenClient } from "@/app/pos/kitchen/kitchen-client"

export default async function AdminKDSPage() {
  const data = await getActiveKdsOrders(1)
  
  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
      <KitchenClient initialData={data} />
    </div>
  )
}
