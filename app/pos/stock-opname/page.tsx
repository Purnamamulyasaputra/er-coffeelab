import { getStockOpnames } from "@/lib/queries/stock_opname"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { StockOpnameClient } from "@/app/admin/stockopname/opname-client"
export default async function POSStockOpnamePage() {
  const [opnames, employees, branches] = await Promise.all([
    getStockOpnames(),
    getEmployees(),
    getBranches()
  ])
  return (
    <div className="p-6">
      <StockOpnameClient initialData={opnames} employees={employees} branches={branches} />
    </div>
  )
}


