import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { createPaymentRequest, logPayment } from "@/lib/xendit"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession("pos") || await getSession("admin")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, tableSessionId, invoiceCode, amount, methodType, channelCode, customerPhone, customerName } = body

    if ((!orderId && !tableSessionId) || !invoiceCode || !amount || !methodType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let payload: any = {
      amount: Number(amount),
      currency: "IDR",
      reference_id: invoiceCode,
    }

    if (methodType === "QR_CODE") {
      payload.payment_method = {
        type: "QR_CODE",
        reusability: "ONE_TIME_USE",
        qr_code: { channel_code: channelCode || "DANA" } // Or NASIONAL_QR for production
      }
      payload.description = `Order ${invoiceCode} - ER Coffeelab`
    } else if (methodType === "EWALLET" || methodType === "E_WALLET") {
      payload.country = "ID"
      payload.payment_method = {
        type: "EWALLET",
        reusability: "ONE_TIME_USE",
        ewallet: {
          channel_code: channelCode,
          channel_properties: {
            success_return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/pos?status=SUCCEEDED`,
            failure_return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/pos?status=FAILED`,
            cancel_return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/pos?status=CANCELLED`
          }
        }
      }
      if (channelCode === 'OVO' || channelCode === 'DANA') {
        payload.payment_method.ewallet.channel_properties.mobile_number = customerPhone || "+628123456789"
      }
    } else if (methodType === "VIRTUAL_ACCOUNT") {
      payload.payment_method = {
        type: "VIRTUAL_ACCOUNT",
        reusability: "ONE_TIME_USE",
        virtual_account: {
          channel_code: channelCode,
          channel_properties: {
            customer_name: customerName || "ER Coffeelab Customer"
          }
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid method type" }, { status: 400 })
    }

    // Call Xendit API
    const xenditResponse = await createPaymentRequest(payload)

    // Log the request
    await logPayment({
      invoiceCode,
      endpoint: 'https://api.xendit.co/payment_requests',
      type: 'XENDIT_REQUEST',
      requestPayload: payload,
      xenditResponse: {
        status: xenditResponse.status,
        id: xenditResponse.id,
        amount: xenditResponse.amount,
        payment_method: xenditResponse.payment_method,
        actions: xenditResponse.actions,
        failure_code: xenditResponse.failure_code ?? null
      },
      httpStatus: 201
    })

    if (xenditResponse.status === "REQUIRES_ACTION" || xenditResponse.status === "PENDING") {
      // Extract qr_string for QRIS to save for later display
      const qrString = methodType === "QR_CODE"
        ? (xenditResponse.payment_method?.qr_code?.channel_properties?.qr_string
          || xenditResponse.actions?.find((a: any) => a.url_type === 'QR_CODE_URL')?.url
          || null)
        : null;

      if (orderId) {
        await sql`
          UPDATE orders 
          SET xendit_payment_id = ${xenditResponse.id},
              xendit_payment_method_id = ${xenditResponse.payment_method?.id || null},
              payment_reference = COALESCE(${qrString}, payment_reference)
          WHERE id = ${orderId}
        `
      } else if (body.tableSessionId) {
        await sql`
          UPDATE orders 
          SET xendit_payment_id = ${xenditResponse.id},
              xendit_payment_method_id = ${xenditResponse.payment_method?.id || null},
              payment_reference = COALESCE(${qrString}, payment_reference)
          WHERE table_session_id = ${body.tableSessionId} AND paid_at IS NULL AND status != 'CANCELLED'
        `
      }
    }

    return NextResponse.json({ data: xenditResponse })
  } catch (error: any) {
    console.error("Xendit create payment error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
