import { sql } from "@/lib/db"

export async function getActiveSessions(branchId: number) {
  return await sql`
    SELECT 
      ts.*,
      t.table_number,
      t.capacity,
      e.name as opened_by_name
    FROM table_sessions ts
    JOIN store_tables t ON t.id = ts.table_id
    LEFT JOIN employees e ON e.id = ts.opened_by
    WHERE ts.branch_id = ${branchId} AND ts.status = 'OPEN'
    ORDER BY ts.opened_at DESC
  `
}

export async function getActiveSessionsWithOrders(branchId: number) {
  const sessions = await sql`
    SELECT 
      ts.*,
      t.table_number, t.section, t.capacity,
      e.name as opened_by_name,
      b.name as branch_name,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as grand_total,
      EXTRACT(EPOCH FROM (NOW() - ts.opened_at))/60 as duration_minutes
    FROM table_sessions ts
    JOIN store_tables t ON t.id = ts.table_id
    LEFT JOIN employees e ON e.id = ts.opened_by
    LEFT JOIN branches b ON b.id = ts.branch_id
    LEFT JOIN orders o ON o.table_session_id = ts.id AND o.status != 'CANCELLED' AND o.paid_at IS NULL
    WHERE ts.branch_id = ${branchId} AND ts.status = 'OPEN'
    GROUP BY ts.id, t.table_number, t.section, t.capacity, e.name, b.name
    ORDER BY ts.opened_at ASC
  `
  
  // For each session, get the items to display a brief list
  for (const session of sessions) {
    const items = await sql`
      SELECT 
        oi.product_name, oi.quantity, oi.subtotal, o.created_at, o.status as order_status
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.table_session_id = ${session.id} AND o.status != 'CANCELLED' AND o.paid_at IS NULL
      ORDER BY o.created_at ASC
    `
    session.items = items
  }
  
  return sessions
}

export async function openSession(data: { branchId: number, tableId: number, guestCount: number, employeeId?: number }) {
  // Use transaction-like logic or sequential since neon driver is HTTP-based
  const session = await sql`
    INSERT INTO table_sessions (branch_id, table_id, guest_count, opened_by, status)
    VALUES (${data.branchId}, ${data.tableId}, ${data.guestCount}, ${data.employeeId || null}, 'OPEN')
    RETURNING *
  `
  
  if (session && session.length > 0) {
    await sql`
      UPDATE store_tables 
      SET status = 'OCCUPIED', current_session_id = ${session[0].id}, occupied_since = NOW()
      WHERE id = ${data.tableId}
    `
    return session[0]
  }
  return null
}

export async function getSessionDetail(sessionId: number) {
  const session = await sql`
    SELECT 
      ts.*,
      t.table_number
    FROM table_sessions ts
    JOIN store_tables t ON t.id = ts.table_id
    WHERE ts.id = ${sessionId}
  `

  if (!session || session.length === 0) return null

  const sessionOrders = await sql`
    SELECT 
      o.id,
      o.invoice_code,
      o.total_amount,
      o.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'subtotal', oi.subtotal
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.table_session_id = ${sessionId} AND o.status != 'CANCELLED'
    GROUP BY o.id
    ORDER BY o.created_at ASC
  `

  return {
    ...session[0],
    orders: sessionOrders
  }
}

export async function closeSession(sessionId: number, employeeId?: number | null) {
  const session = await sql`
    UPDATE table_sessions
    SET status = 'CLOSED', closed_at = NOW(), closed_by = ${employeeId || null}
    WHERE id = ${sessionId}
    RETURNING *
  `

  if (session && session.length > 0) {
    await sql`
      UPDATE store_tables 
      SET status = 'AVAILABLE', current_session_id = NULL, occupied_since = NULL
      WHERE id = ${session[0].table_id}
    `
    return session[0]
  }
  return null
}

export async function resetAllTables() {
  await sql`UPDATE table_sessions SET status = 'CLOSED', closed_at = NOW() WHERE status = 'OPEN'`
  await sql`
    UPDATE store_tables 
    SET status = 'AVAILABLE', current_session_id = NULL, occupied_since = NULL
  `
  return { success: true }
}

export async function updateSessionGuestCount(sessionId: number, guestCount: number) {
  const session = await sql`
    UPDATE table_sessions
    SET guest_count = ${guestCount}
    WHERE id = ${sessionId}
    RETURNING *
  `
  return session[0]
}

export async function paySessionOrders(sessionId: number, employeeId: number | null, paymentMethod: string, cashAmount: number = 0) {
  // Find unpaid orders for this session
  const unpaidOrders = await sql`
    SELECT id, invoice_code, total_amount
    FROM orders
    WHERE table_session_id = ${sessionId} AND status = 'PENDING'
  `

  if (unpaidOrders.length > 0) {
    for (const order of unpaidOrders) {
      // Update order to COMPLETED
      await sql`
        UPDATE orders
        SET status = 'COMPLETED', payment_method_code = ${paymentMethod}
        WHERE id = ${order.id}
      `

      // Log payment
      await sql`
        INSERT INTO payment_logs (invoice_code, type, request_payload, http_status)
        VALUES (
          ${order.invoice_code}, 'POS_CHECKOUT',
          ${JSON.stringify({ method: paymentMethod, amount: order.total_amount, cashAmount })},
          200
        )
      `
    }
  }

  // Finally, close the session normally
  return await closeSession(sessionId, employeeId)
}
