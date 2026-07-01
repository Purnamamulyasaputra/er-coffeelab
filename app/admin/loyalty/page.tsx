import { getLoyaltyTiers, getLoyaltyTransactions, getLoyaltyStats } from "@/lib/queries/loyalty"
import { getCustomers } from "@/lib/queries/customers"
import { LoyaltyClient } from "./loyalty-client"
import { getSession } from "@/lib/auth"

export default async function LoyaltyPage() {
  const session = await getSession("admin") as any
  const tiers = await getLoyaltyTiers()
  const transactions = await getLoyaltyTransactions(100, 0)
  const stats = await getLoyaltyStats()
  
  // Need customers for the adjustment modal dropdown
  const customers = await getCustomers() 
  
  return (
    <LoyaltyClient 
      initialTiers={tiers} 
      initialTransactions={transactions} 
      initialStats={stats}
      customers={customers}
      role={session?.role}
    />
  )
}
