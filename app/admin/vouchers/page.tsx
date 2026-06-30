import { getVouchers } from "@/lib/queries/vouchers"
import { VouchersClient } from "./vouchers-client"
import { getSession } from "@/lib/auth"

export default async function VouchersPage() {
  const session = await getSession("admin") as any;
  const vouchers = await getVouchers()
  return <VouchersClient initialData={vouchers} role={session?.role} />
}
