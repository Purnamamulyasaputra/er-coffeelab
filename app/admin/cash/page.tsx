import { getCashMovements, getActiveShift } from "@/lib/queries/cash"
import { CashClient } from "./cash-client"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function AdminCashPage() {
  const session = await getSession("admin") as any;
  const isSuperAdmin = session?.role === "SUPERADMIN";
  const canManageCash = session?.role !== "EMPLOYEE";
  const role = session?.role;
  const employeeId = session?.employeeId;
  
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = !isSuperAdmin ? Number(session.branchId) : (selectedBranchId ? Number(selectedBranchId) : undefined);

  let [movements, activeShift] = await Promise.all([
    getCashMovements(branchId),
    getActiveShift(branchId) // Don't filter active shift by employee, there's only one active shift per branch usually
  ])

  if (role === "EMPLOYEE" && employeeId) {
    movements = movements.filter(m => m.employee_id === employeeId);
  }

  const showBranchColumn = !branchId;

  return (
    <div className="p-0 sm:p-2">
      <CashClient 
        initialData={movements} 
        activeShift={activeShift}
        isAdmin={isSuperAdmin}
        showBranchColumn={showBranchColumn}
        loggedInEmployeeId={employeeId}
      />
    </div>
  )
}
