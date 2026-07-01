import { getStockOpnames } from "@/lib/queries/stock_opname"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { StockOpnameClient } from "./opname-client"
import { requireAdmin } from "@/lib/auth"

export default async function StockOpnamePage() {
  const { resolvedBranchId, role, employeeId } = await requireAdmin()
  const branchId = resolvedBranchId || undefined

  let [opnames, employees, branches] = await Promise.all([
    getStockOpnames(branchId),
    getEmployees(branchId),
    getBranches()
  ])

  if (role === "EMPLOYEE" && employeeId) {
    employees = employees.filter((e: any) => e.id === employeeId);
  }
  
  return <StockOpnameClient initialData={opnames} employees={employees} branches={branches} currentBranchId={branchId} role={role} />
}
