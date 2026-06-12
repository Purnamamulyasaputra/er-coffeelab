import { getDiscounts } from "@/lib/queries/discounts"
import { DiscountsClient } from "./discounts-client"

export default async function DiscountsPage() {
  const discounts = await getDiscounts()
  
  return <DiscountsClient initialData={discounts} />
}
