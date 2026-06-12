import { sql } from "@/lib/db"

export async function getOrders(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        o.invoice_code as id, 
        o.order_mode as mode, 
        o.order_source as src, 
        o.status, 
        b.name as br, 
        (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id)::integer as n, 
        o.total_amount as tot, 
        to_char(o.created_at, 'HH24:MI') as tm, 
        COALESCE(c.name, 'Walk-in') as cu
      FROM orders o
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.branch_id = ${branchId}
      ORDER BY o.created_at DESC
      LIMIT 100
    `
  }

  return await sql`
    SELECT 
      o.invoice_code as id, 
      o.order_mode as mode, 
      o.order_source as src, 
      o.status, 
      b.name as br, 
      (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id)::integer as n, 
      o.total_amount as tot, 
      to_char(o.created_at, 'HH24:MI') as tm, 
      COALESCE(c.name, 'Walk-in') as cu
    FROM orders o
    LEFT JOIN branches b ON o.branch_id = b.id
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 100
  `
}
