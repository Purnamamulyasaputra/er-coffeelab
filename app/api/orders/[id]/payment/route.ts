import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getPaymentRequestStatus, createPaymentRequest, logPayment } from '@/lib/xendit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession("pos") || await getSession("admin");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the order with all payment-related fields
    const orderRows = await sql`
      SELECT 
        o.id,
        o.invoice_code,
        o.total_amount,
        o.payment_method_code,
        o.payment_reference,
        o.xendit_payment_id,
        o.status,
        o.paid_at,
        pm.name as method_name,
        pm.logo_url as method_logo,
        pm.type as method_type
      FROM orders o
      LEFT JOIN payment_methods pm ON pm.code = o.payment_method_code
      WHERE o.invoice_code = ${id}
    `;

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];
    const isQris = order.payment_method_code?.toUpperCase().includes('QRIS')
      || order.method_type?.toUpperCase() === 'QR_CODE';

    let xenditPaymentId = order.xendit_payment_id;
    let qrString = order.payment_reference;
    let channelCode = order.payment_method_code || '';
    
    // Auto-create Xendit payment if it doesn't exist yet but method is digital
    if (!xenditPaymentId && order.method_type && !['CASH', 'MANUAL', 'DEBIT_CARD'].includes(order.method_type.toUpperCase())) {
      try {
        let payload: any = {
          amount: Number(order.total_amount),
          currency: "IDR",
          reference_id: order.invoice_code,
        }

        if (order.method_type === "QR_CODE" || isQris) {
          payload.payment_method = {
            type: "QR_CODE",
            reusability: "ONE_TIME_USE",
            qr_code: { channel_code: channelCode || "DANA" }
          }
          payload.description = `Order ${order.invoice_code} - ER Coffeelab`
        } else if (order.method_type === "EWALLET" || order.method_type === "E_WALLET") {
          payload.country = "ID"
          payload.payment_method = {
            type: "EWALLET",
            reusability: "ONE_TIME_USE",
            ewallet: {
              channel_code: channelCode,
              channel_properties: {
                success_return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders`,
                failure_return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders`,
                cancel_return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders`
              }
            }
          }
          if (channelCode === 'OVO' || channelCode === 'DANA') {
            payload.payment_method.ewallet.channel_properties.mobile_number = "+628123456789"
          }
        } else if (order.method_type === "VIRTUAL_ACCOUNT") {
          payload.payment_method = {
            type: "VIRTUAL_ACCOUNT",
            reusability: "ONE_TIME_USE",
            virtual_account: {
              channel_code: channelCode,
              channel_properties: { customer_name: "ER Coffeelab Customer" }
            }
          }
        }

        const xenditResponse = await createPaymentRequest(payload)
        
        await logPayment({
          invoiceCode: order.invoice_code,
          endpoint: 'https://api.xendit.co/payment_requests',
          type: 'XENDIT_REQUEST',
          requestPayload: payload,
          xenditResponse: { status: xenditResponse.status, id: xenditResponse.id },
          httpStatus: 201
        })

        xenditPaymentId = xenditResponse.id

        if (isQris || order.method_type === "QR_CODE") {
          qrString = xenditResponse.payment_method?.qr_code?.channel_properties?.qr_string
            || xenditResponse.actions?.find((a: any) => a.url_type === 'QR_CODE_URL')?.url
            || null;
        }

        await sql`
          UPDATE orders 
          SET xendit_payment_id = ${xenditPaymentId},
              payment_reference = COALESCE(${qrString}, payment_reference)
          WHERE id = ${order.id}
        `
      } catch (err: any) {
        console.error("Failed to auto-create Xendit payment:", err.message)
      }
    }

    // For QRIS: payment_reference stores the qr_string directly — no Xendit re-fetch needed
    if (isQris) {
      if (!qrString && xenditPaymentId) {
         try {
           const xenditData = await getPaymentRequestStatus(xenditPaymentId);
           qrString = xenditData?.payment_method?.qr_code?.channel_properties?.qr_string
             || xenditData?.actions?.find((a: any) => a.url_type === 'QR_CODE_URL')?.url
             || null;
           if (qrString) {
             await sql`UPDATE orders SET payment_reference = ${qrString} WHERE id = ${order.id}`
           }
         } catch(e){}
      }
      return NextResponse.json({
        type: 'QRIS',
        methodCode: order.payment_method_code,
        methodName: order.method_name || 'QRIS',
        logoUrl: order.method_logo,
        amount: Number(order.total_amount),
        invoiceCode: order.invoice_code,
        paymentRequestId: xenditPaymentId || null,
        qrString: qrString || null,
      });
    }

    // If no xendit_payment_id or payment_reference, return manual/cash fallback
    if (!xenditPaymentId && !qrString) {
      return NextResponse.json({
        type: 'MANUAL',
        methodCode: order.payment_method_code,
        methodName: order.method_name || order.payment_method_code,
        logoUrl: order.method_logo,
        amount: Number(order.total_amount),
        invoiceCode: order.invoice_code,
      });
    }

    // For E-Wallet / VA: fetch from Xendit to get redirect URL or VA number
    try {
      const paymentId = xenditPaymentId || qrString;
      const xenditData = await getPaymentRequestStatus(paymentId);

      const pm = xenditData.payment_method;
      let type = 'EWALLET';
      let redirectUrl: string | null = null;
      let vaNumber: string | null = null;

      if (pm?.type === 'QR_CODE') {
        type = 'QRIS';
        qrString = pm?.qr_code?.channel_properties?.qr_string || null;
      } else if (pm?.type === 'EWALLET') {
        type = 'EWALLET';
        channelCode = pm?.ewallet?.channel_code || order.payment_method_code || '';
        redirectUrl = xenditData.actions?.find((a: any) => a.url_type === 'WEB')?.url
          || xenditData.actions?.find((a: any) => a.url_type === 'MOBILE')?.url
          || xenditData.actions?.find((a: any) => a.url)?.url
          || null;
      } else if (pm?.type === 'VIRTUAL_ACCOUNT') {
        type = 'VA';
        vaNumber = pm?.virtual_account?.channel_properties?.virtual_account_number || null;
        channelCode = pm?.virtual_account?.channel_code || order.payment_method_code || '';
      } else {
        if (order.method_type === 'VIRTUAL_ACCOUNT') type = 'VA';
        channelCode = order.payment_method_code || '';
      }

      let finalLogoUrl = order.method_logo;
      if (channelCode && (!finalLogoUrl || order.payment_method_code === 'ONLINE')) {
        try {
          const pmRows = await sql`SELECT logo_url, name FROM payment_methods WHERE code = ${channelCode} LIMIT 1`;
          if (pmRows.length > 0) {
            finalLogoUrl = pmRows[0].logo_url;
            if (pmRows[0].name) {
              order.method_name = pmRows[0].name;
            }
          }
        } catch(e) {}
      }

      return NextResponse.json({
        type,
        methodCode: order.payment_method_code,
        methodName: order.method_name || channelCode,
        logoUrl: finalLogoUrl,
        amount: Number(order.total_amount),
        invoiceCode: order.invoice_code,
        paymentRequestId: paymentId,
        qrString: qrString || null,
        redirectUrl,
        vaNumber,
        channelCode,
        xenditStatus: xenditData.status,
      });
    } catch (xenditError: any) {
      console.warn("Could not fetch Xendit status:", xenditError.message);
      const type = order.method_type === 'VIRTUAL_ACCOUNT' ? 'VA' : 'EWALLET';
      return NextResponse.json({
        type,
        methodCode: order.payment_method_code,
        methodName: order.method_name || order.payment_method_code,
        logoUrl: order.method_logo,
        amount: Number(order.total_amount),
        invoiceCode: order.invoice_code,
        paymentRequestId: xenditPaymentId || qrString,
        channelCode: order.payment_method_code || '',
        xenditError: xenditError.message,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
