import { getIngredients } from "@/lib/queries/inventory"
import { InventoryClient } from "./inventory-client"
import { requireAdmin } from "@/lib/auth"

export default async function InventoryPage() {
  const { role, resolvedBranchId } = await requireAdmin()
  const branchId = resolvedBranchId || undefined
  
  const ingredients = await getIngredients(branchId)
  
  return <InventoryClient initialData={ingredients} role={role} branchId={branchId} />
}
