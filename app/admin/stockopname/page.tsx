import { getStockOpnames } from "@/lib/queries/stock_opname"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { StockOpnameClient } from "./opname-client"
import { requireAdmin } from "@/lib/auth"

export default async function StockOpnamePage() {
  const { resolvedBranchId } = await requireAdmin()
  const branchId = resolvedBranchId || undefined

  const [opnames, employees, branches] = await Promise.all([
    getStockOpnames(branchId),
    getEmployees(branchId),
    getBranches()
  ])
  
  return <StockOpnameClient initialData={opnames} employees={employees} branches={branches} />
}
