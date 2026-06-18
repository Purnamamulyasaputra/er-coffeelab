import { sql } from "@/lib/db"

export async function processPosCheckout(data: {
  branchId: number
  customerId?: number | null
  shiftId: number
  orderType: string
  source: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paymentMethod: string | null
  tableSessionId?: number | null
  voucherId?: number | null
  employeeId?: number | null
  cashAmount?: number
  items: Array<{
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
    notes?: string | null
  }>
}) {
  // Generate invoice code
  const prefix = data.source === 'POS' ? 'POS' : 'APP'
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString()
  const invoiceCode = `${prefix}-${Date.now().toString().slice(-6)}-${randomStr}`
  
  // Generate receipt number (RCP-YYYYMMDD-XXXX)
  const d = new Date()
  const dateStr = `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`
  const receiptNumber = `RCP-${dateStr}-${randomStr}`

  // Determine if this is a paid order immediately (direct checkout) or unpaid (open bill)
  const isPaid = !!data.paymentMethod;

  // 1. Insert Order (status = PENDING so it appears in KDS)
  const orderResult = await sql`
    INSERT INTO orders (
      branch_id, customer_id, shift_id, invoice_code,
      order_mode, order_source, status,
      subtotal, tax_amount, discount_amount, total_amount,
      payment_method_code, is_pos, table_session_id,
      employee_id, receipt_number, voucher_id, paid_at
    )
    VALUES (
      ${data.branchId}, ${data.customerId || null}, ${data.shiftId}, ${invoiceCode},
      ${data.orderType}, ${data.source}, 'PENDING',
      ${data.subtotal}, ${data.taxAmount}, ${data.discountAmount}, ${data.totalAmount},
      ${data.paymentMethod || null}, true, ${data.tableSessionId || null},
      ${data.employeeId || null}, ${receiptNumber}, ${data.voucherId || null}, ${isPaid ? sql`NOW()` : null}
    )
    RETURNING id
  `

  const orderId = orderResult[0].id

  // 2. Log initial order status
  await sql`
    INSERT INTO order_status_logs (order_id, status, notes)
    VALUES (${orderId}, 'PENDING', 'Order created from POS')
  `

  // 3. Insert Order Items (product_name is NOT NULL in schema)
  for (const item of data.items) {
    await sql`
      INSERT INTO order_items (
        order_id, product_id, product_name,
        unit_price, quantity, subtotal, notes
      )
      VALUES (
        ${orderId}, ${item.productId}, ${item.productName},
        ${item.unitPrice}, ${item.quantity}, ${item.subtotal}, ${item.notes || null}
      )
    `
  }

  // 4. Log Payment (payment_logs uses invoice_code, not order_id)
  if (isPaid) {
    await sql`
      INSERT INTO payment_logs (invoice_code, type, request_payload, http_status)
      VALUES (
        ${invoiceCode}, 'POS_CASH',
        ${JSON.stringify({ method: data.paymentMethod, amount: data.totalAmount, cashAmount: data.cashAmount || 0 })},
        200
      )
    `
  }

  // 5. Update Voucher quota if used
  if (data.voucherId) {
    await sql`
      UPDATE vouchers
      SET used_count = used_count + 1
      WHERE id = ${data.voucherId}
    `
    if (data.customerId) {
      await sql`
        INSERT INTO voucher_redemptions (voucher_id, customer_id, order_id, discount_applied)
        VALUES (${data.voucherId}, ${data.customerId}, ${orderId}, ${data.discountAmount})
      `
    }
  }

  return { orderId, invoiceCode }
}
