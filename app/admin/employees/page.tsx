import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { EmployeesClient } from "./employees-client"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function EmployeesPage() {
  const session = await getSession("admin") as any;
  const isAdmin = session?.role === "SUPERADMIN";
  
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = !isAdmin ? Number(session.branchId) : (selectedBranchId ? Number(selectedBranchId) : undefined);

  const [employees, branches] = await Promise.all([
    getEmployees(branchId),
    getBranches(branchId)
  ])
  
  return <EmployeesClient initialData={employees} branches={branches} />
}
