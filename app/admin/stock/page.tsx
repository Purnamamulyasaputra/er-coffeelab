import { getBranchProductStock } from "@/lib/queries/stock"
import { StockClient } from "./stock-client"

import { cookies } from "next/headers"

export default async function StockPage() {
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = selectedBranchId ? Number(selectedBranchId) : undefined;
  const stock = await getBranchProductStock(branchId)
  
  return <StockClient initialData={stock} />
}
