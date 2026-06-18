import { getRefunds } from "@/lib/queries/refunds"
import { RefundsClient } from "./refunds-client"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function RefundsPage() {
  const session = await getSession("admin") as any;
  const isAdmin = session?.role === "SUPERADMIN";
  
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = !isAdmin ? Number(session.branchId) : (selectedBranchId ? Number(selectedBranchId) : undefined);

  const refunds = await getRefunds(branchId)
  
  return <RefundsClient initialData={refunds} />
}
