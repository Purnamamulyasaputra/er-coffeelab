import { getOrders } from "@/lib/queries/orders"
import { OrdersWrapper } from "./orders-wrapper"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OrdersPage() {
  const { resolvedBranchId, role } = await requireAdmin()
  const orders = await getOrders(resolvedBranchId || undefined)
  
  return <OrdersWrapper orders={orders} branchId={resolvedBranchId || undefined} role={role} />
}
