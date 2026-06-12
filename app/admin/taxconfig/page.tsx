import { getTaxConfigs } from "@/lib/queries/tax_configs"
import { getBranches } from "@/lib/queries/branches"
import { TaxConfigClient } from "./taxconfig-client"

export default async function TaxConfigPage() {
  const [taxes, branches] = await Promise.all([
    getTaxConfigs(),
    getBranches()
  ])
  
  return <TaxConfigClient initialData={taxes} branches={branches} />
}
