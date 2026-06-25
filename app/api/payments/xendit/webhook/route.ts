import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { logPayment } from "@/lib/xendit"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-callback-token")
    if (token !== process.env.XENDIT_CALLBACK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { status, reference_id, id: xenditPaymentId } = body
    
    // Extract actual payment method from Xendit
    let actualPaymentMethod = null;
    if (body.payment_method) {
      const pm = body.payment_method;
      if (pm.type === 'EWALLET' && pm.ewallet?.channel_code) {
        actualPaymentMethod = pm.ewallet.channel_code.toUpperCase();
      } else if (pm.type === 'VIRTUAL_ACCOUNT' && pm.virtual_account?.channel_code) {
        actualPaymentMethod = `${pm.virtual_account.channel_code.toUpperCase()}_VA`;
      } else if (pm.type === 'QR_CODE') {
        actualPaymentMethod = 'QRIS';
      } else if (pm.type === 'OVER_THE_COUNTER' && pm.over_the_counter?.channel_code) {
        actualPaymentMethod = pm.over_the_counter.channel_code.toUpperCase();
      }
    }
    
    // Log the webhook payload
    await logPayment({
      invoiceCode: reference_id,
      endpoint: '/api/payments/xendit/webhook',
      type: 'XENDIT_WEBHOOK',
      xenditResponse: {
        status: status,
        id: xenditPaymentId,
        reference_id: reference_id,
        amount: body.amount,
        failure_code: body.failure_code ?? null
      },
      httpStatus: 200
    })

    if (status === "SUCCEEDED") {
      if (reference_id.startsWith("TBL-")) {
        // Table Session checkout
        const sessionId = parseInt(reference_id.replace("TBL-", "").split("-")[0]);
        if (!isNaN(sessionId)) {
          // Update all unpaid orders for this session
          await sql`
            UPDATE orders 
            SET paid_at = NOW(), 
                status = 'PAID',
                payment_method_code = COALESCE(${actualPaymentMethod}, payment_method_code)
            WHERE table_session_id = ${sessionId} AND paid_at IS NULL
          `
          // Close the table session
          await sql`
            UPDATE table_sessions
            SET closed_at = NOW()
            WHERE id = ${sessionId}
          `
          // Free the table
          await sql`
            UPDATE tables
            SET status = 'AVAILABLE'
            WHERE id = (SELECT table_id FROM table_sessions WHERE id = ${sessionId})
          `
        }
      } else {
        // Normal Order checkout
        await sql`
          UPDATE orders 
          SET paid_at = NOW(), 
              status = 'PAID',
              payment_method_code = COALESCE(${actualPaymentMethod}, payment_method_code)
          WHERE invoice_code = ${reference_id} AND paid_at IS NULL
        `
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Xendit webhook error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
