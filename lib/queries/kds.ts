import { sql } from "@/lib/db"

export async function getActiveKdsOrders(branchId?: number) {
  // Get all orders that are not COMPLETED or CANCELLED
  // If branchId is undefined → return all branches (for Super Admin "All Branches" mode)
  const orders = branchId
    ? await sql`
        SELECT 
          o.id,
          o.invoice_code,
          o.status as order_status,
          o.order_source,
          o.order_mode as order_type,
          o.created_at,
          t.table_number,
          c.name as customer_name,
          b.name as branch_name
        FROM orders o
        LEFT JOIN store_tables t ON t.id = o.table_id
        LEFT JOIN customers c ON c.id = o.customer_id
        LEFT JOIN branches b ON b.id = o.branch_id
        WHERE o.branch_id = ${branchId}
          AND o.status IN ('PENDING', 'PAID', 'PROCESSING', 'READY')
        ORDER BY o.created_at ASC
      `
    : await sql`
        SELECT 
          o.id,
          o.invoice_code,
          o.status as order_status,
          o.order_source,
          o.order_mode as order_type,
          o.created_at,
          t.table_number,
          c.name as customer_name,
          b.name as branch_name
        FROM orders o
        LEFT JOIN store_tables t ON t.id = o.table_id
        LEFT JOIN customers c ON c.id = o.customer_id
        LEFT JOIN branches b ON b.id = o.branch_id
        WHERE o.status IN ('PENDING', 'PAID', 'PROCESSING', 'READY')
        ORDER BY o.created_at ASC
      `

  if (orders.length === 0) return []

  const orderIds = orders.map((o: any) => o.id)

  const items = await sql`
    SELECT 
      oi.id,
      oi.order_id,
      oi.product_id,
      oi.quantity,
      oi.notes,
      p.name as product_name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ANY(${orderIds})
  `

  const itemsMap = items.reduce((acc: any, item: any) => {
    if (!acc[item.order_id]) acc[item.order_id] = []
    acc[item.order_id].push(item)
    return acc
  }, {})

  return orders.map((o: any) => ({
    ...o,
    items: itemsMap[o.id] || []
  }))
}

export async function updateOrderStatus(orderId: number, status: string, actorType: string = 'ADMIN', actorName: string = 'System') {
  // Check if order is already paid
  const orderInfo = await sql`SELECT paid_at FROM orders WHERE id = ${orderId}`
  const isPaid = orderInfo[0]?.paid_at != null

  const finalStatus = status;

  if (finalStatus === 'COMPLETED') {
    await sql`
      UPDATE orders
      SET status = ${finalStatus}, completed_at = NOW()
      WHERE id = ${orderId}
    `
  } else {
    await sql`
      UPDATE orders
      SET status = ${finalStatus}
      WHERE id = ${orderId}
    `
  }

  // Log the status change
  await sql`
    INSERT INTO order_status_logs (order_id, status, actor_type, notes)
    VALUES (${orderId}, ${finalStatus}, ${actorType.substring(0, 20)}, ${`Status updated via Kitchen Display by ${actorName}`})
  `

  return await sql`SELECT * FROM orders WHERE id = ${orderId}`
}
