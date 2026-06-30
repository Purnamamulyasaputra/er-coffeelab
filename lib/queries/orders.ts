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
      LIMIT 1000
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
    LIMIT 1000
  `
}

export async function getOrderDetails(invoiceCode: string): Promise<any> {
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
    SELECT 
      osl.*,
      COALESCE(e.name, a.name, oe.name) as actor_name,
      COALESCE(e.role, a.role, oe.role) as actor_role
    FROM order_status_logs osl
    LEFT JOIN employees e ON osl.actor_type IN ('EMPLOYEE', 'CASHIER') AND osl.actor_id = e.id
    LEFT JOIN admins a ON osl.actor_type IN ('ADMIN', 'SUPERADMIN') AND osl.actor_id = a.id
    LEFT JOIN orders o ON osl.order_id = o.id
    LEFT JOIN employees oe ON osl.actor_type = 'CASHIER' AND osl.actor_id IS NULL AND o.employee_id = oe.id
    WHERE osl.order_id = ${order.id}
    ORDER BY osl.id DESC
  `

  return {
    ...order,
    items,
    logs
  }
}

export async function updateOrderStatus(id: string | number, status: string, actorId?: number, cancelReason?: string) {
  const idStr = id.toString();
  const orderResult = await sql`
    SELECT id, status FROM orders WHERE id::text = ${idStr} OR invoice_code = ${idStr}
  `
  if (orderResult.length === 0) return false
  const order = orderResult[0]

  await sql`
    UPDATE orders 
    SET status = ${status},
        completed_at = ${status === 'COMPLETED' ? sql`NOW()` : null},
        paid_at = ${status === 'PAID' ? sql`COALESCE(paid_at, NOW())` : sql`paid_at`},
        cancel_reason = ${cancelReason || null}
    WHERE id = ${order.id}
  `

  await sql`
    INSERT INTO order_status_logs (order_id, status, actor_type, actor_id, notes)
    VALUES (${order.id}, ${status}, 'EMPLOYEE', ${actorId || null}, ${cancelReason ? `Dibatalkan: ${cancelReason}` : `Status updated to ${status}`})
  `
  return true
}

export async function cancelOrder(invoiceCode: string, actorId?: number, cancelReason?: string) {
  const idStr = invoiceCode.toString();
  const orderResult = await sql`
    SELECT id, status, paid_at, xendit_payment_id FROM orders WHERE invoice_code = ${idStr} OR id::text = ${idStr}
  `
  if (orderResult.length === 0) return { success: false, error: 'Order not found' }
  const order = orderResult[0]

  // Cannot cancel already paid or completed orders
  if (order.paid_at || order.status === 'PAID' || order.status === 'COMPLETED') {
    return { success: false, error: 'Cannot cancel a paid or completed order' }
  }
  if (order.status === 'CANCELLED') {
    return { success: false, error: 'Order is already cancelled' }
  }

  const reason = cancelReason || 'Dibatalkan oleh kasir'

  await sql`
    UPDATE orders 
    SET status = 'CANCELLED',
        cancel_reason = ${reason}
    WHERE id = ${order.id}
  `

  await sql`
    INSERT INTO order_status_logs (order_id, status, actor_type, actor_id, notes)
    VALUES (${order.id}, 'CANCELLED', 'EMPLOYEE', ${actorId || null}, ${`Dibatalkan: ${reason}`})
  `

  return { success: true, xenditPaymentId: order.xendit_payment_id }
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

