import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { closeSession } from "@/lib/queries/table-sessions"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = (await getSession("pos") || await getSession("admin")) as any
    if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const id = Number((await params).id)
    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const body = await request.json()
    const paymentMethod = body.paymentMethod || 'CASH'

    // Get all unpaid orders for this session
    const unpaidOrders = await sql`
      SELECT id, total_amount, invoice_code 
      FROM orders 
      WHERE table_session_id = ${id} AND paid_at IS NULL AND status != 'CANCELLED'
    `

    if (!unpaidOrders || unpaidOrders.length === 0) {
      return NextResponse.json({ error: "Tidak ada tagihan yang belum dibayar" }, { status: 400 })
    }

    let grandTotal = 0
    for (const order of unpaidOrders) {
      grandTotal += Number(order.total_amount)
      
      // Mark as paid and update status to COMPLETED if it was READY
      await sql`
        UPDATE orders 
        SET 
          paid_at = NOW(), 
          payment_method_code = ${paymentMethod},
          status = CASE WHEN status = 'READY' THEN 'COMPLETED' ELSE status END
        WHERE id = ${order.id}
      `

      // Log payment for each invoice
      await sql`
        INSERT INTO payment_logs (invoice_code, type, request_payload, http_status)
        VALUES (
          ${order.invoice_code}, 'POS_CASH',
          ${JSON.stringify({ method: paymentMethod, amount: order.total_amount, note: 'Pay All Open Bill' })},
          200
        )
      `
    }

    // Close the table session
    const closedSession = await closeSession(id, userSession.userId)

    return NextResponse.json({ 
      success: true, 
      data: closedSession, 
      paidAmount: grandTotal, 
      ordersPaid: unpaidOrders.length 
    })

  } catch (error: any) {
    console.error("Pay all error:", error)
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 })
  }
}
