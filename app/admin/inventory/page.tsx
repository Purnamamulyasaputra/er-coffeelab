import { getIngredients } from "@/lib/queries/inventory"
import { InventoryClient } from "./inventory-client"
import { getSession } from "@/lib/auth"

export default async function InventoryPage() {
  const session = await getSession("admin")
  const role = String(session?.role || "SUPERADMIN")
  const branchId = session?.branchId ? Number(session.branchId) : null
  
  const ingredients = await getIngredients(role === "ADMIN" && branchId ? Number(branchId) : undefined)
  
  return <InventoryClient initialData={ingredients} role={role} branchId={branchId} />
}
