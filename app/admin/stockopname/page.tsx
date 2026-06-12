import { getStockOpnames } from "@/lib/queries/stock_opname"
import { getEmployees } from "@/lib/queries/hr"
import { getBranches } from "@/lib/queries/branches"
import { StockOpnameClient } from "./opname-client"

export default async function StockOpnamePage() {
  const [opnames, employees, branches] = await Promise.all([
    getStockOpnames(),
    getEmployees(),
    getBranches()
  ])
  
  return <StockOpnameClient initialData={opnames} employees={employees} branches={branches} />
}
