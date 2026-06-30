import { getBranchProductStock } from "@/lib/queries/stock"
import { getProducts } from "@/lib/queries/products"
import { getBranches } from "@/lib/queries/branches"
import { StockClient } from "./stock-client"

import { requireAdmin } from "@/lib/auth"

export default async function StockPage() {
  const { resolvedBranchId, role } = await requireAdmin()
  const branchId = resolvedBranchId || undefined

  
  const [stock, products, branches] = await Promise.all([
    getBranchProductStock(branchId),
    getProducts(),
    getBranches()
  ])
  
  return <StockClient initialData={stock} products={products} branches={branches} currentBranchId={branchId} role={role} />
}
