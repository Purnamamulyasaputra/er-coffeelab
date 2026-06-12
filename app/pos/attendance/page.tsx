import { getAttendance } from "@/lib/queries/attendance"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { AttendanceClient } from "@/app/admin/attendance/attendance-client"
export default async function POSAttendancePage() {
  const [attendance, employees, branches] = await Promise.all([
    getAttendance(),
    getEmployees(),
    getBranches()
  ])
  return (
    <div className="p-6">
      <AttendanceClient initialData={attendance} employees={employees} branches={branches} />
    </div>
  )
}


