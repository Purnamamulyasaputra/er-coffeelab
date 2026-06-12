import { getBranches } from "@/lib/queries/branches"
import { BranchesClient } from "./branches-client"

export default async function BranchesPage() {
  const branches = await getBranches()
  return <BranchesClient initialData={branches} />
}
