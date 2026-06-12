import { getTables } from "@/lib/queries/tables"
import { TablesClient } from "@/app/admin/tables/tables-client"

export default async function AdminTablesPage() {
  const data = await getTables(1) // Default branch 1 for now
  return (
    <div>
      <TablesClient initialData={data} />
    </div>
  )
}
