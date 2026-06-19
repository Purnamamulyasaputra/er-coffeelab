import { getPurchaseOrders } from "@/lib/queries/purchase_orders"
import { getSuppliers } from "@/lib/queries/suppliers"
import { getBranches } from "@/lib/queries/branches"
import { getIngredients } from "@/lib/queries/inventory"
import { PurchaseOrdersClient } from "./po-client"
import { requireAdmin } from "@/lib/auth"

export default async function POPage() {
  const { resolvedBranchId } = await requireAdmin()
  const branchId = resolvedBranchId || undefined

  const [pos, suppliers, branches, ingredients] = await Promise.all([
    getPurchaseOrders(branchId),
    getSuppliers(),
    getBranches(),
    getIngredients() // Fetch all ingredients globally since any branch can buy any ingredient
  ])
  
  return <PurchaseOrdersClient 
    initialData={pos} 
    suppliers={suppliers} 
    branches={branches} 
    ingredients={ingredients}
    activeBranchId={branchId}
  />
}
