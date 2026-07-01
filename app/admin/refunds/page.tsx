import { getRefunds, getEligibleOrdersForRefund } from "@/lib/queries/refunds"
import { RefundsClient } from "./refunds-client"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function RefundsPage() {
  const session = await getSession("admin") as any;
  const isAdmin = session?.role === "SUPERADMIN";
  const role = session?.role;
  
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = !isAdmin ? Number(session.branchId) : (selectedBranchId ? Number(selectedBranchId) : undefined);

  const [refunds, eligibleOrders] = await Promise.all([
    getRefunds(branchId),
    getEligibleOrdersForRefund(branchId)
  ]);
  
  return <RefundsClient initialData={refunds} eligibleOrders={eligibleOrders} role={role} />
}
