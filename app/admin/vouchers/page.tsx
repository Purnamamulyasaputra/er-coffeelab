import { getVouchers } from "@/lib/queries/vouchers"
import { getCampaigns } from "@/lib/queries/campaigns"
import { VouchersClient } from "./vouchers-client"
import { getSession } from "@/lib/auth"

export default async function VouchersPage() {
  const session = await getSession("admin") as any;
  const vouchers = await getVouchers()
  const campaigns = await getCampaigns()
  return <VouchersClient initialData={vouchers} campaigns={campaigns} role={session?.role} />
}
