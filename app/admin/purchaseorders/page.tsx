import { getPurchaseOrders } from "@/lib/queries/purchase_orders"
import { getSuppliers } from "@/lib/queries/suppliers"
import { getBranches } from "@/lib/queries/branches"
import { PurchaseOrdersClient } from "./po-client"

export default async function POPage() {
  const [pos, suppliers, branches] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getBranches()
  ])
  
  return <PurchaseOrdersClient initialData={pos} suppliers={suppliers} branches={branches} />
}
