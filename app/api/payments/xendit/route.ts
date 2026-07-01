import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { createPaymentRequest, logPayment } from "@/lib/xendit"

function normalizeEwalletCode(code: string): string {
  if (!code) return code
  return code.toUpperCase().replace(/^ID_/, '')
}

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
      country: "ID",
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
      const normalizedCode = normalizeEwalletCode(channelCode)
      const rawCode = channelCode.toUpperCase()
      
      payload.payment_method = {
        type: "EWALLET",
        reusability: "ONE_TIME_USE",
        ewallet: {
          channel_code: normalizedCode,
          channel_properties: {} as any
        }
      }

      // OVO uses Push Notification, requires mobile_number, NO return URLs
      if (rawCode === 'OVO' || rawCode === 'ID_OVO') {
        let phone = customerPhone
        if (!phone) {
          return NextResponse.json({ error: `Nomor HP pelanggan wajib diisi untuk pembayaran via OVO` }, { status: 400 })
        }
        if (phone.startsWith('0')) {
          phone = '+62' + phone.substring(1)
        } else if (!phone.startsWith('+')) {
          phone = '+' + phone
        }
        payload.payment_method.ewallet.channel_properties.mobile_number = phone
      } else {
        // DANA, SHOPEEPAY, LINKAJA, etc use Redirection, require return URLs
        payload.payment_method.ewallet.channel_properties.success_return_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/pos?status=SUCCEEDED`
        payload.payment_method.ewallet.channel_properties.failure_return_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/pos?status=FAILED`
        payload.payment_method.ewallet.channel_properties.cancel_return_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/pos?status=CANCELLED`
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
