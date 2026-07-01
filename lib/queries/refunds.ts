import { sql } from "@/lib/db"

export async function getEligibleOrdersForRefund(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT id, invoice_code, total_amount, status
      FROM orders
      WHERE status IN ('PAID', 'COMPLETED') 
        AND branch_id = ${branchId}
      ORDER BY created_at DESC
      LIMIT 100
    `
  }
  return await sql`
    SELECT id, invoice_code, total_amount, status
    FROM orders
    WHERE status IN ('PAID', 'COMPLETED')
    ORDER BY created_at DESC
    LIMIT 100
  `
}

export async function getRefunds(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        r.id, 
        o.invoice_code as order, 
        r.refund_type as type, 
        r.refund_amount as amount, 
        r.reason, 
        r.refund_method as method, 
        r.status, 
        a.name as by
      FROM refunds r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN admins a ON r.approved_by = a.id
      WHERE o.branch_id = ${branchId}
      ORDER BY r.created_at DESC
    `
  }
  return await sql`
    SELECT 
      r.id, 
      o.invoice_code as order, 
      r.refund_type as type, 
      r.refund_amount as amount, 
      r.reason, 
      r.refund_method as method, 
      r.status, 
      a.name as by
    FROM refunds r
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN admins a ON r.approved_by = a.id
    ORDER BY r.created_at DESC
  `
}

export async function createRefund(data: {
  order_id: number
  refund_type: string
  amount: number
  reason: string
  refund_method: string
  approved_by: number
  role?: string
}) {
  // 1. Fetch order details
  const orderData = await sql`SELECT * FROM orders WHERE id = ${data.order_id}`
  if (!orderData.length) throw new Error("Order not found")
  const order = orderData[0]
  
  // Basic validation
  if (order.status === 'REFUNDED' || order.status === 'CANCELLED') {
    throw new Error("Order is already refunded or cancelled")
  }
  
  if (data.amount > Number(order.total_amount)) {
    throw new Error("Refund amount exceeds order total")
  }

  // 2. Insert Refund Record
  const refundRes = await sql`
    INSERT INTO refunds (
      order_id, refund_type, refund_amount, reason, refund_method, status, approved_by
    )
    VALUES (
      ${data.order_id}, ${data.refund_type}, ${data.amount}, ${data.reason}, ${data.refund_method}, 'COMPLETED', ${data.approved_by}
    )
    RETURNING id
  `
  const refundId = refundRes[0].id

  // 3. Update Order Status
  const newStatus = data.refund_type === 'FULL' || data.refund_type === 'VOID' ? 'REFUNDED' : 'COMPLETED'
  await sql`
    UPDATE orders 
    SET status = ${newStatus}
    WHERE id = ${data.order_id}
  `

  // 4. Log Status
  await sql`
    INSERT INTO order_status_logs (order_id, status, notes, actor_type, actor_id)
    VALUES (${data.order_id}, ${newStatus}, ${"Refund processed: " + data.reason}, ${data.role === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN'}, ${data.approved_by})
  `

  // 5. Cash Drawer & Shift Management
  if (data.refund_method === 'CASH' && order.shift_id) {
    // Deduct from shift actual cash
    await sql`
      UPDATE shifts 
      SET 
        actual_cash = actual_cash - ${data.amount},
        total_refunds = total_refunds + ${data.amount}
      WHERE id = ${order.shift_id}
    `
    // Log cash movement
    await sql`
      INSERT INTO cash_movements (shift_id, employee_id, type, amount, reason)
      VALUES (${order.shift_id}, ${order.employee_id || data.approved_by}, 'REFUND_OUT', ${data.amount}, ${'Refund for ' + order.invoice_code})
    `
  }

  // 6. Inventory Reversal (for FULL or VOID refunds)
  if (data.refund_type === 'FULL' || data.refund_type === 'VOID') {
    const items = await sql`SELECT product_id, quantity FROM order_items WHERE order_id = ${data.order_id}`
    for (const item of items) {
      if (!item.product_id) continue;
      
      const recipes = await sql`SELECT ingredient_id, quantity_used, unit FROM product_recipes WHERE product_id = ${item.product_id}`
      for (const recipe of recipes) {
        const amountToReturn = Number(recipe.quantity_used) * item.quantity
        
        // Update stock
        await sql`
          UPDATE ingredient_stock 
          SET 
            current_stock = current_stock + ${amountToReturn},
            updated_at = NOW()
          WHERE branch_id = ${order.branch_id} AND ingredient_id = ${recipe.ingredient_id}
        `
        
        // Log movement
        await sql`
          INSERT INTO stock_movements (
            branch_id, ingredient_id, type, quantity, unit, 
            reference_type, reference_id, notes, employee_id
          )
          VALUES (
            ${order.branch_id}, ${recipe.ingredient_id}, 'VOID_RETURN', ${amountToReturn}, 
            ${recipe.unit}, 'REFUND', ${refundId}, 
            ${'Stock returned for ' + order.invoice_code}, NULL
          )
        `
      }
    }
  }

  return refundRes
}
