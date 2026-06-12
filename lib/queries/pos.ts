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
  paymentMethod: string
  items: Array<{
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}) {
  // Generate invoice code
  const prefix = data.source === 'POS' ? 'POS' : 'APP'
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString()
  const invoiceCode = `${prefix}-${Date.now().toString().slice(-6)}-${randomStr}`

  // 1. Insert Order (status = PENDING so it appears in KDS)
  const orderResult = await sql`
    INSERT INTO orders (
      branch_id, customer_id, shift_id, invoice_code,
      order_mode, order_source, status,
      subtotal, tax_amount, discount_amount, total_amount,
      payment_method_code, is_pos
    )
    VALUES (
      ${data.branchId}, ${data.customerId || null}, ${data.shiftId}, ${invoiceCode},
      ${data.orderType}, ${data.source}, 'PENDING',
      ${data.subtotal}, ${data.taxAmount}, ${data.discountAmount}, ${data.totalAmount},
      ${data.paymentMethod}, true
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
        unit_price, quantity, subtotal
      )
      VALUES (
        ${orderId}, ${item.productId}, ${item.productName},
        ${item.unitPrice}, ${item.quantity}, ${item.subtotal}
      )
    `
  }

  // 4. Log Payment (payment_logs uses invoice_code, not order_id)
  await sql`
    INSERT INTO payment_logs (invoice_code, type, request_payload, http_status)
    VALUES (
      ${invoiceCode}, 'POS_CASH',
      ${JSON.stringify({ method: data.paymentMethod, amount: data.totalAmount })},
      200
    )
  `

  return { orderId, invoiceCode }
}
