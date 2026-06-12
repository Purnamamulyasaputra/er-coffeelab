import { sql } from "@/lib/db"

export async function getBranchProductStock(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        bps.id,
        p.name as product,
        b.name as branch,
        bps.stock_status as stock,
        bps.stock_status as status
      FROM branch_product_stock bps
      JOIN products p ON bps.product_id = p.id
      JOIN branches b ON bps.branch_id = b.id
      WHERE bps.branch_id = ${branchId}
      ORDER BY p.name ASC, b.name ASC
    `
  }

  return await sql`
    SELECT 
      bps.id,
      p.name as product,
      b.name as branch,
      bps.stock_status as stock,
      bps.stock_status as status
    FROM branch_product_stock bps
    JOIN products p ON bps.product_id = p.id
    JOIN branches b ON bps.branch_id = b.id
    ORDER BY p.name ASC, b.name ASC
  `
}
