import { sql } from "@/lib/db"

export async function getTaxConfigs() {
  return await sql`
    SELECT 
      t.id, 
      b.name as branch, 
      t.tax_name as tax, 
      t.tax_rate::text || '%' as rate, 
      CASE WHEN t.is_inclusive THEN 'Yes' ELSE 'No' END as inclusive, 
      CASE WHEN t.is_active THEN 'ON' ELSE 'OFF' END as active
    FROM tax_configs t
    JOIN branches b ON t.branch_id = b.id
    ORDER BY b.name ASC, t.tax_name ASC
  `
}

export async function getBranchTaxes(branchId: number) {
  return await sql`
    SELECT *
    FROM tax_configs
    WHERE branch_id = ${branchId} AND is_active = TRUE
  `
}

export async function createTaxConfig(data: {
  branch_id: number
  tax_name: string
  tax_rate: number
  is_inclusive: boolean
  is_active: boolean
}) {
  return await sql`
    INSERT INTO tax_configs (
      branch_id, tax_name, tax_rate, is_inclusive, is_active
    )
    VALUES (
      ${data.branch_id}, ${data.tax_name}, ${data.tax_rate}, ${data.is_inclusive}, ${data.is_active}
    )
    RETURNING id
  `
}
