import { getBranches } from "@/lib/queries/branches"
import { BranchesClient } from "./branches-client"
import { requireAdmin } from "@/lib/auth"

export default async function BranchesPage() {
  const { resolvedBranchId } = await requireAdmin()
  const allBranches = await getBranches()
  const branches = resolvedBranchId ? allBranches.filter(b => b.id === resolvedBranchId) : allBranches
  return <BranchesClient initialData={branches} />
}
