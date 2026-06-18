import { sql } from "@/lib/db"

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
}) {
  return await sql`
    INSERT INTO refunds (
      order_id, refund_type, refund_amount, reason, refund_method, status, approved_by
    )
    VALUES (
      ${data.order_id}, ${data.refund_type}, ${data.amount}, ${data.reason}, ${data.refund_method}, 'APPROVED', ${data.approved_by}
    )
    RETURNING id
  `
}
