import { getVouchers } from "@/lib/queries/vouchers"
import { VouchersClient } from "./vouchers-client"

export default async function VouchersPage() {
  const vouchers = await getVouchers()
  return <VouchersClient initialData={vouchers} />
}
