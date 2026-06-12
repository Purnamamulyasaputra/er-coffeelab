import { sql } from "@/lib/db"

export async function getActiveKdsOrders(branchId: number) {
  // Get all orders that are not COMPLETED or CANCELLED for a specific branch
  const orders = await sql`
    SELECT 
      o.id,
      o.invoice_code,
      o.status as order_status,
      o.order_source,
      o.order_mode as order_type,
      o.created_at,
      t.table_number,
      c.name as customer_name
    FROM orders o
    LEFT JOIN store_tables t ON t.id = o.table_id
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.branch_id = ${branchId}
      AND o.status IN ('PENDING', 'PROCESSING', 'READY')
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

export async function updateOrderStatus(orderId: number, status: string) {
  return await sql`
    UPDATE orders
    SET status = ${status}
    WHERE id = ${orderId}
    RETURNING *
  `
}
