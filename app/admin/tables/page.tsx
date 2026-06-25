import { getTables, getAllTables } from "@/lib/queries/tables"
import { getBranches } from "@/lib/queries/branches"
import { TablesClient } from "@/app/admin/tables/tables-client"
import { requireAdmin } from "@/lib/auth"

export default async function AdminTablesPage() {
  const { resolvedBranchId, role } = await requireAdmin()
  const isAll = !resolvedBranchId
  const branchId = isAll ? 0 : resolvedBranchId
  const data = isAll ? await getAllTables() : await getTables(branchId)
  
  let currentBranchName = "Cabang Utama"
  if (branchId) {
    const branches = await getBranches()
    const b = branches.find((br: any) => br.id === branchId)
    if (b) currentBranchName = b.name
  }

  const { sql } = await import("@/lib/db")
  const paymentMethods = await sql`SELECT * FROM payment_methods WHERE is_active = true ORDER BY sort_order ASC`
  
  return (
    <div>
      <TablesClient 
        initialData={data} 
        currentBranchId={branchId} 
        isAllBranches={isAll} 
        role={role} 
        branchName={currentBranchName}
        paymentMethods={paymentMethods as any} 
      />
    </div>
  )
}
