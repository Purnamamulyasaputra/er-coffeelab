import { getTables } from "@/lib/queries/tables"
import { TablesClient } from "@/app/admin/tables/tables-client"
export default async function POSTablesPage() {
  const data = await getTables(1) // hardcoded branch 1 for now
  return (
    <div className="p-6">
      <TablesClient initialData={data} />
    </div>
  )
}


