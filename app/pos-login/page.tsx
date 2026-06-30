import { getBranches } from "@/lib/queries/branches"
import { getEmployees } from "@/lib/queries/hr"
import PosLoginClient from "./pos-login-client"

export default async function PosLoginPage() {
  const branches = await getBranches()
  const employees = await getEmployees()
  
  return <PosLoginClient branches={branches} employees={employees} />
}
