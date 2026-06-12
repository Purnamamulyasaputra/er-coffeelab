import { getLoyalty } from "@/lib/queries/loyalty"
import { LoyaltyClient } from "./loyalty-client"

export default async function LoyaltyPage() {
  const data = await getLoyalty()
  return <LoyaltyClient initialData={data} />
}
