import { sql } from "@/lib/db"

export async function getBranchProductStock(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        bps.id,
        p.name as product,
        b.name as branch,
        bps.stock_status as manual_status,
        CASE
          WHEN EXISTS (
            SELECT 1 
            FROM product_recipes pr
            LEFT JOIN ingredient_stock ist ON pr.ingredient_id = ist.ingredient_id AND ist.branch_id = ${branchId}
            WHERE pr.product_id = p.id AND COALESCE(ist.current_stock, 0) < pr.quantity_used
          ) THEN 'OUT_OF_STOCK'
          ELSE COALESCE(bps.stock_status, 'AVAILABLE')
        END as stock,
        CASE
          WHEN EXISTS (
            SELECT 1 
            FROM product_recipes pr
            LEFT JOIN ingredient_stock ist ON pr.ingredient_id = ist.ingredient_id AND ist.branch_id = ${branchId}
            WHERE pr.product_id = p.id AND COALESCE(ist.current_stock, 0) < pr.quantity_used
          ) THEN 'OUT_OF_STOCK'
          ELSE COALESCE(bps.stock_status, 'AVAILABLE')
        END as status
      FROM branch_product_stock bps
      JOIN products p ON bps.product_id = p.id
      JOIN branches b ON bps.branch_id = b.id
      WHERE bps.branch_id = ${branchId}
      ORDER BY bps.id ASC
    `
  }

  return await sql`
    SELECT 
      bps.id,
      p.name as product,
      b.name as branch,
      bps.stock_status as manual_status,
      CASE
        WHEN EXISTS (
          SELECT 1 
          FROM product_recipes pr
          LEFT JOIN ingredient_stock ist ON pr.ingredient_id = ist.ingredient_id AND ist.branch_id = bps.branch_id
          WHERE pr.product_id = p.id AND COALESCE(ist.current_stock, 0) < pr.quantity_used
        ) THEN 'OUT_OF_STOCK'
        ELSE COALESCE(bps.stock_status, 'AVAILABLE')
      END as stock,
      CASE
        WHEN EXISTS (
          SELECT 1 
          FROM product_recipes pr
          LEFT JOIN ingredient_stock ist ON pr.ingredient_id = ist.ingredient_id AND ist.branch_id = bps.branch_id
          WHERE pr.product_id = p.id AND COALESCE(ist.current_stock, 0) < pr.quantity_used
        ) THEN 'OUT_OF_STOCK'
        ELSE COALESCE(bps.stock_status, 'AVAILABLE')
      END as status
    FROM branch_product_stock bps
    JOIN products p ON bps.product_id = p.id
    JOIN branches b ON bps.branch_id = b.id
    ORDER BY bps.id ASC
  `
}

export async function updateBranchProductStock(id: number, stockStatus: string) {
  return await sql`
    UPDATE branch_product_stock
    SET stock_status = ${stockStatus}, updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function deleteBranchProductStock(id: number) {
  return await sql`
    DELETE FROM branch_product_stock WHERE id = ${id}
  `
}

export async function createBranchProductStock(branchId: number, productId: number, stockStatus: string) {
  return await sql`
    INSERT INTO branch_product_stock (branch_id, product_id, stock_status)
    VALUES (${branchId}, ${productId}, ${stockStatus})
    RETURNING id
  `
}
