import { getTables, getAllTables } from "@/lib/queries/tables"
import { TablesClient } from "@/app/admin/tables/tables-client"
import { requireAdmin } from "@/lib/auth"

export default async function AdminTablesPage() {
  const { resolvedBranchId, role } = await requireAdmin()
  const isAll = !resolvedBranchId
  const branchId = isAll ? 0 : resolvedBranchId
  const data = isAll ? await getAllTables() : await getTables(branchId)
  
  return (
    <div>
      <TablesClient initialData={data} currentBranchId={branchId} isAllBranches={isAll} role={role} />
    </div>
  )
}
