import { getProducts } from "@/lib/queries/products"
import { getBranchTaxes } from "@/lib/queries/tax_configs"
import { getSession } from "@/lib/auth"
import { POSTerminal } from "./pos-terminal"

export default async function POSPage(props: any) {
  const isEmbedded = props.isEmbedded === true;
  const session = (await getSession("pos") || await getSession("admin")) as any
  const products = await getProducts()
  
  let taxes: any[] = []
  if (session && session.branchId) {
    taxes = await getBranchTaxes(session.branchId)
  }
  
  return <POSTerminal initialProducts={products as any} session={session} isEmbedded={isEmbedded} taxes={taxes} />
}
