import { getShifts } from "@/lib/queries/shifts"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { ShiftsClient } from "@/app/pos/shifts/shifts-client"

import { cookies } from "next/headers"

export default async function AdminShiftsPage() {
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = selectedBranchId ? Number(selectedBranchId) : undefined;
  
  const [shifts, employees, branches] = await Promise.all([
    getShifts(branchId),
    getEmployees(),
    getBranches()
  ])
  
  return (
    <div className="p-0 sm:p-2">
      <ShiftsClient initialData={shifts} employees={employees} branches={branches} />
    </div>
  )
}
