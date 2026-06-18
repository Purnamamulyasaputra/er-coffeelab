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
        to_char(o.created_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as tm, 
        COALESCE(c.name, 'Walk-in') as cu,
        t.table_number as tbl,
        e.name as emp
      FROM orders o
      LEFT JOIN branches b ON o.branch_id = b.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN table_sessions ts ON ts.id = o.table_session_id
      LEFT JOIN store_tables t ON t.id = ts.table_id
      LEFT JOIN employees e ON e.id = o.employee_id
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
      to_char(o.created_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as tm, 
      COALESCE(c.name, 'Walk-in') as cu,
      t.table_number as tbl,
      e.name as emp
    FROM orders o
    LEFT JOIN branches b ON o.branch_id = b.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN table_sessions ts ON ts.id = o.table_session_id
    LEFT JOIN store_tables t ON t.id = ts.table_id
    LEFT JOIN employees e ON e.id = o.employee_id
    ORDER BY o.created_at DESC
    LIMIT 100
  `
}

export async function getOrderDetails(invoiceCode: string) {
  const orderResult = await sql`
    SELECT 
      o.*, 
      b.name as branch_name, 
      COALESCE(c.name, 'Walk-in') as customer_name,
      t.table_number
    FROM orders o
    LEFT JOIN branches b ON o.branch_id = b.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN table_sessions ts ON ts.id = o.table_session_id
    LEFT JOIN store_tables t ON t.id = ts.table_id
    WHERE o.invoice_code = ${invoiceCode}
  `
  if (orderResult.length === 0) return null
  const order = orderResult[0]

  const items = await sql`
    SELECT 
      oi.*,
      p.name as product_name
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ${order.id}
  `

  const logs = await sql`
    SELECT osl.*
    FROM order_status_logs osl
    WHERE osl.order_id = ${order.id}
    ORDER BY osl.id DESC
  `

  return {
    ...order,
    items,
    logs
  }
}

export async function updateOrderStatus(invoiceCode: string, status: string, actorId?: number) {
  const orderResult = await sql`
    SELECT id, status FROM orders WHERE invoice_code = ${invoiceCode}
  `
  if (orderResult.length === 0) return false
  const order = orderResult[0]

  await sql`
    UPDATE orders 
    SET status = ${status},
        completed_at = ${status === 'COMPLETED' ? sql`NOW()` : null}
    WHERE id = ${order.id}
  `

  await sql`
    INSERT INTO order_status_logs (order_id, status, actor_type, actor_id, notes)
    VALUES (${order.id}, ${status}, 'EMPLOYEE', ${actorId || null}, ${`Status updated to ${status}`})
  `
  return true
}

export async function deleteOrder(invoiceCode: string) {
  const orderResult = await sql`
    SELECT id FROM orders WHERE invoice_code = ${invoiceCode}
  `
  if (orderResult.length === 0) return false
  const order = orderResult[0]

  await sql`DELETE FROM orders WHERE id = ${order.id}`
  return true
}
