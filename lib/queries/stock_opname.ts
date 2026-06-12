import { sql } from "@/lib/db"

export async function getStockOpnames() {
  return await sql`
    SELECT 
      so.id, 
      b.name as branch, 
      e.name as employee, 
      to_char(so.created_at, 'Mon DD') as date,
      (SELECT COUNT(id) FROM stock_opname_items WHERE stock_opname_id = so.id)::text as items,
      '-' as variance,
      so.status
    FROM stock_opnames so
    LEFT JOIN branches b ON so.branch_id = b.id
    LEFT JOIN employees e ON so.employee_id = e.id
    ORDER BY so.created_at DESC
  `
}

export async function createStockOpname(data: {
  branch_id: number
  conducted_by: number
}) {
  return await sql`
    INSERT INTO stock_opnames (
      branch_id, employee_id, status
    )
    VALUES (
      ${data.branch_id}, ${data.conducted_by}, 'IN_PROGRESS'
    )
    RETURNING id
  `
}
