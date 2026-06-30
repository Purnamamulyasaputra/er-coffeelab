import { getDiscounts } from "@/lib/queries/discounts"
import { DiscountsClient } from "./discounts-client"

import { getSession } from "@/lib/auth"

export default async function DiscountsPage() {
  const session = await getSession("admin") as any;
  const discounts = await getDiscounts()
  
  return <DiscountsClient initialData={discounts} role={session?.role} />
}
