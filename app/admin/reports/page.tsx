import { ReportsClient } from "./reports-client"
import { getReportsData } from "@/lib/queries/reports"

export default async function ReportsPage() {
  const data = await getReportsData()
  return <ReportsClient initialData={data} />
}
