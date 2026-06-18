import { getCashMovements, getActiveShift } from "@/lib/queries/cash"
import { CashClient } from "./cash-client"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function AdminCashPage() {
  const session = await getSession("admin") as any;
  const isAdmin = session?.role === "SUPERADMIN";
  
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = !isAdmin ? Number(session.branchId) : (selectedBranchId ? Number(selectedBranchId) : undefined);

  const [movements, activeShift] = await Promise.all([
    getCashMovements(branchId),
    getActiveShift(branchId)
  ])

  return (
    <div className="p-0 sm:p-2">
      <CashClient 
        initialData={movements} 
        activeShift={activeShift}
      />
    </div>
  )
}
