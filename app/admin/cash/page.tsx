import { getCashMovements, getActiveShift } from "@/lib/queries/cash"
import { CashClient } from "@/app/pos/cash/cash-client"

export default async function AdminCashPage() {
  const [movements, activeShift] = await Promise.all([
    getCashMovements(),
    getActiveShift()
  ])

  return (
    <div className="p-0 sm:p-2">
      <CashClient 
        initialData={movements} 
        activeShift={activeShift}
      />
    </div>
  )
}
