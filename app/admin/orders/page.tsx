import { getOrders } from "@/lib/queries/orders"
import { OrdersClient } from "./orders-client"

import { cookies } from "next/headers"

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = selectedBranchId ? Number(selectedBranchId) : undefined;
  const orders = await getOrders(branchId)
  
  return <OrdersClient initialData={orders} />
}
