import { getAttendance } from "@/lib/queries/attendance"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { AttendanceClient } from "./attendance-client"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function AttendancePage() {
  const session = await getSession("admin") as any;
  const isAdmin = session?.role === "SUPERADMIN";
  
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = !isAdmin ? Number(session.branchId) : (selectedBranchId ? Number(selectedBranchId) : undefined);

  const [attendance, employees, branches] = await Promise.all([
    getAttendance(branchId),
    getEmployees(branchId),
    getBranches(branchId)
  ])
  
  return <AttendanceClient initialData={attendance} employees={employees} branches={branches} />
}
