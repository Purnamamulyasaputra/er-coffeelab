import { getRefunds } from "@/lib/queries/refunds"
import { RefundsClient } from "@/app/admin/refunds/refunds-client"
export default async function POSRefundsPage() {
  const data = await getRefunds()
  return (
    <div className="p-6">
      <RefundsClient initialData={data} />
    </div>
  )
}


