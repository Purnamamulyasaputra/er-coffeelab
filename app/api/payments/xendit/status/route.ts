import { NextRequest, NextResponse } from "next/server"
import { getPaymentRequestStatus, logPayment } from "@/lib/xendit"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const paymentRequestId = new URL(request.url).searchParams.get("paymentRequestId")
    
    if (!paymentRequestId) {
      return NextResponse.json({ error: "Missing paymentRequestId" }, { status: 400 })
    }

    const status = await getPaymentRequestStatus(paymentRequestId)
    
    // Extract actual payment method from Xendit
    let actualPaymentMethod = null;
    if (status.payment_method) {
      const pm = status.payment_method;
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
    
    // Log polling result if status is terminal or we want to track it
    // To avoid spamming, we might only log if SUCCEEDED or FAILED
    if (status.status === "SUCCEEDED" || status.status === "FAILED") {
       await logPayment({
          invoiceCode: status.reference_id,
          endpoint: '/api/payments/xendit/status',
          type: status.status === "SUCCEEDED" ? 'XENDIT_POLLING_PAID' : 'XENDIT_POLLING_FAILED',
          requestPayload: { paymentRequestId },
          xenditResponse: {
            status: status.status,
            id: status.id,
            reference_id: status.reference_id,
          },
          httpStatus: 200
       })
       
       if (status.status === "SUCCEEDED") {
         // Update order: paid_at = NOW(), status = PAID (consistent with webhook and direct payment)
         await sql`
           UPDATE orders 
           SET paid_at = NOW(), 
               status = 'PAID',
               payment_method_code = COALESCE(${actualPaymentMethod}, payment_method_code)
           WHERE invoice_code = ${status.reference_id} AND paid_at IS NULL
         `
       }
    }

    return NextResponse.json({ status: status.status, data: status })
  } catch (error: any) {
    console.error("Xendit check status error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
