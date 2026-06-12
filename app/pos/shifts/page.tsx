import { getShifts } from "@/lib/queries/shifts"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { ShiftsClient } from "./shifts-client"
export default async function ShiftsPage() {
  const [shifts, employees, branches] = await Promise.all([
    getShifts(),
    getEmployees(),
    getBranches()
  ])
  
  return (
    <div className="p-6">
      <ShiftsClient initialData={shifts} employees={employees} branches={branches} />
    </div>
  )
}


