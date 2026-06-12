import { getAttendance } from "@/lib/queries/attendance"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { AttendanceClient } from "./attendance-client"

export default async function AttendancePage() {
  const [attendance, employees, branches] = await Promise.all([
    getAttendance(),
    getEmployees(),
    getBranches()
  ])
  
  return <AttendanceClient initialData={attendance} employees={employees} branches={branches} />
}
