import { getPayments } from "@/lib/queries/payments"
import { PaymentsClient } from "./payments-client"

export default async function PaymentsPage() {
  const data = await getPayments()
  return <PaymentsClient initialData={data} />
}
