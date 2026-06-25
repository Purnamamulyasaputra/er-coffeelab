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
  let branchNameStr = "Cabang Utama";
  if (branchId) {
    taxes = await getBranchTaxes(branchId)
    const branches = await getBranches()
    const b = branches.find((br: any) => br.id === branchId)
    if (b) {
      branchNameStr = b.name;
      branchSettings = {
        dineIn: b.dinein_enabled,
        takeAway: b.pickup_enabled || b.delivery_enabled
      }
    }
  }

  const posSession = {
    ...session,
    branchId: branchId,
    branchName: branchNameStr,
    shiftId: session?.shiftId || 1
  }

  const { getEmployees } = await import("@/lib/queries/hr")
  const branchEmployees = await getEmployees(branchId)
  
  const { getShifts } = await import("@/lib/queries/shifts")
  const shifts = await getShifts(branchId)
  const activeShifts = shifts.filter((s: any) => s.status === 'OPEN')
  
  const { sql } = await import("@/lib/db")
  const paymentMethods = await sql`SELECT * FROM payment_methods WHERE is_active = true ORDER BY sort_order ASC`

  return <POSTerminal 
    initialProducts={products as any} 
    session={posSession} 
    isEmbedded={true} 
    taxes={taxes} 
    branchSettings={branchSettings} 
    branchEmployees={branchEmployees as any}
    activeShifts={activeShifts as any}
    paymentMethods={paymentMethods as any}
  />
}
