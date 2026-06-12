import { getCustomers } from "@/lib/queries/customers"
import { CustomersClient } from "./customers-client"

export default async function CustomersPage() {
  const data = await getCustomers()
  return <CustomersClient initialData={data} />
}
