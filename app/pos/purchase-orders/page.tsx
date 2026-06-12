import { getPurchaseOrders } from "@/lib/queries/purchase_orders"
import { getSuppliers } from "@/lib/queries/suppliers"
import { getBranches } from "@/lib/queries/branches"
import { PurchaseOrdersClient } from "@/app/admin/purchaseorders/po-client"
export default async function POSPurchaseOrdersPage() {
  const [pos, suppliers, branches] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getBranches()
  ])
  return (
    <div className="p-6">
      <PurchaseOrdersClient initialData={pos} suppliers={suppliers} branches={branches} />
    </div>
  )
}


