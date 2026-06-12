import { getUsers } from "@/lib/queries/users"
import { getBranches } from "@/lib/queries/branches"
import { UsersClient, User } from "./users-client"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const data = await getUsers()
  const branches = await getBranches()
  return <UsersClient initialData={data as User[]} initialBranches={branches as any[]} />
}
