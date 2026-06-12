import { getRefunds } from "@/lib/queries/refunds"
import { RefundsClient } from "./refunds-client"

export default async function RefundsPage() {
  const refunds = await getRefunds()
  
  return <RefundsClient initialData={refunds} />
}
