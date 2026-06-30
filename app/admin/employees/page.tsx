import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { EmployeesClient } from "./employees-client"
import { requireAdmin } from "@/lib/auth"

export default async function EmployeesPage() {
  const { resolvedBranchId, role } = await requireAdmin();
  const branchId = resolvedBranchId || undefined;

  const [employees, branches] = await Promise.all([
    getEmployees(branchId),
    getBranches(branchId)
  ])
  
  return <EmployeesClient initialData={employees} branches={branches} role={role} currentBranchId={branchId} />
}
