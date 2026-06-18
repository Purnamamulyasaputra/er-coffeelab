import { getActiveKdsOrders } from "@/lib/queries/kds"
import { KitchenClient } from "./kitchen-client"
import { requireAdmin } from "@/lib/auth"

export default async function AdminKDSPage() {
  const { resolvedBranchId } = await requireAdmin()
  const branchId = resolvedBranchId || undefined
  const data = await getActiveKdsOrders(branchId)
  
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col -mt-4 sm:-mt-6">
      <KitchenClient initialData={data} branchId={branchId} />
    </div>
  )
}
