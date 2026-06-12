import { getCashMovements } from "@/lib/queries/cash"
import { CashClient } from "./cash-client"
export default async function CashPage() {
  const data = await getCashMovements()
  return (
    <div className="p-6">
      <CashClient initialData={data} />
    </div>
  )
}


