import { getBranches } from "@/lib/queries/branches"
import { BranchesClient } from "./branches-client"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function BranchesPage() {
  const { resolvedBranchId, role } = await requireAdmin()
  
  if (role === 'SUPERADMIN' && resolvedBranchId) {
    redirect('/admin/dashboard')
  }
  const allBranches = await getBranches()
  const branches = resolvedBranchId ? allBranches.filter(b => b.id === resolvedBranchId) : allBranches
  return <BranchesClient initialData={branches} role={role} />
}
