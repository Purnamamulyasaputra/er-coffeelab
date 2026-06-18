import { ReportsClient } from "./reports-client"
import { getReportsData } from "@/lib/queries/reports"

import { requireAdmin } from "@/lib/auth"

export default async function ReportsPage() {
  const { resolvedBranchId } = await requireAdmin();
  const branchId = resolvedBranchId || undefined;
  const data = await getReportsData(branchId)
  return <ReportsClient initialData={data} branchId={branchId} />
}
