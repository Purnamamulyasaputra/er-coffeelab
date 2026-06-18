import { getTaxConfigs } from "@/lib/queries/tax_configs"
import { getBranches } from "@/lib/queries/branches"
import { TaxConfigClient } from "./taxconfig-client"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function TaxConfigPage() {
  const session = await getSession("admin") as any;
  const isAdmin = session?.role === "SUPERADMIN";
  
  const cookieStore = await cookies();
  const selectedBranchId = cookieStore.get("selectedBranchId")?.value;
  const branchId = !isAdmin ? Number(session.branchId) : (selectedBranchId ? Number(selectedBranchId) : undefined);

  const [taxes, branches] = await Promise.all([
    getTaxConfigs(branchId),
    getBranches(branchId)
  ])
  
  return <TaxConfigClient initialData={taxes} branches={branches} />
}
