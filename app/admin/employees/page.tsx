import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { EmployeesClient } from "./employees-client"

export default async function EmployeesPage() {
  const [employees, branches] = await Promise.all([
    getEmployees(),
    getBranches()
  ])
  
  return <EmployeesClient initialData={employees} branches={branches} />
}
