import { getShifts } from "@/lib/queries/shifts"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { ShiftsClient } from "./shifts-client"
import { requireAdmin } from "@/lib/auth"

export default async function AdminShiftsPage() {
  const { resolvedBranchId, role } = await requireAdmin();
  const branchId = resolvedBranchId || undefined;
  const isAdmin = role === "SUPERADMIN";

  let [shifts, employees, allBranches] = await Promise.all([
    getShifts(branchId),
    getEmployees(branchId),
    getBranches(branchId)
  ])
  
  const branches = allBranches;
  const showBranchColumn = !branchId; // Only show branch column if viewing all branches
  
  return (
    <div className="p-0 sm:p-2">
      <ShiftsClient 
        initialData={shifts} 
        employees={employees} 
        branches={branches} 
        isAdmin={isAdmin}
        showBranchColumn={showBranchColumn}
      />
    </div>
  )
}
