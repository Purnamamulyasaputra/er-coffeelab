import { getProducts, getPOSProducts } from "@/lib/queries/products"
import { getBranchTaxes } from "@/lib/queries/tax_configs"
import { getBranches } from "@/lib/queries/branches"
import { requireAdmin } from "@/lib/auth"
import { POSTerminal } from "./pos-terminal"
import { redirect } from "next/navigation"

export default async function AdminPOSPage() {
  const session = await requireAdmin()
  const branchId = session.resolvedBranchId || 1

  const products = await getPOSProducts(branchId)
  
  let taxes: any[] = []
  let branchSettings = { dineIn: true, takeAway: true }
  if (branchId) {
    taxes = await getBranchTaxes(branchId)
    const branches = await getBranches()
    const b = branches.find((br: any) => br.id === branchId)
    if (b) {
      branchSettings = {
        dineIn: b.dinein_enabled,
        takeAway: b.pickup_enabled || b.delivery_enabled
      }
    }
  }

  const posSession = {
    ...session,
    branchId: branchId,
    shiftId: session?.shiftId || 1
  }

  const { getEmployees } = await import("@/lib/queries/hr")
  const branchEmployees = await getEmployees(branchId)
  
  return <POSTerminal 
    initialProducts={products as any} 
    session={posSession} 
    isEmbedded={true} 
    taxes={taxes} 
    branchSettings={branchSettings} 
    branchEmployees={branchEmployees as any}
  />
}
