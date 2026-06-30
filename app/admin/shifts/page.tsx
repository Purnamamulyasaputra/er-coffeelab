import { getShifts } from "@/lib/queries/shifts"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { ShiftsClient } from "./shifts-client"
import { requireAdmin } from "@/lib/auth"

export default async function AdminShiftsPage() {
  const { resolvedBranchId, role, employeeId } = await requireAdmin();
  const branchId = resolvedBranchId || undefined;
  const isAdmin = role === "SUPERADMIN";

  let [shifts, employees, allBranches] = await Promise.all([
    getShifts(branchId),
    getEmployees(branchId),
    getBranches(branchId)
  ])

  if (role === "EMPLOYEE" && employeeId) {
    shifts = shifts.filter(s => s.employee_id === employeeId);
    employees = employees.filter((e: any) => e.id === employeeId);
  }
  
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
        role={role}
      />
    </div>
  )
}
