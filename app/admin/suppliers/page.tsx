import { getSuppliers } from "@/lib/queries/suppliers"
import { SuppliersClient } from "./suppliers-client"

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()
  
  return <SuppliersClient initialData={suppliers} />
}
