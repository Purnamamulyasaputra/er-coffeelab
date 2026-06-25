import { sql } from "@/lib/db"

const XENDIT_BASE = "https://api.xendit.co"

function getAuthHeader() {
  const apiKey = process.env.XENDIT_API_KEY
  if (!apiKey) throw new Error("XENDIT_API_KEY is not defined")
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`
}

export async function createPaymentRequest(payload: object) {
  const res = await fetch(`${XENDIT_BASE}/payment_requests`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
      "api-version": "2022-07-31"
    },
    body: JSON.stringify(payload)
  })
  
  if (!res.ok) {
    const errorBody = await res.text()
    console.error("Xendit createPaymentRequest error:", res.status, errorBody)
    throw new Error(`Xendit API error: ${res.statusText} - ${errorBody}`)
  }
  
  return res.json()
}

export async function getPaymentRequestStatus(paymentRequestId: string) {
  const res = await fetch(`${XENDIT_BASE}/payment_requests/${paymentRequestId}`, {
    headers: { 
      "Authorization": getAuthHeader(),
      "api-version": "2022-07-31"
    }
  })
  
  if (!res.ok) {
    const errorBody = await res.text()
    console.error("Xendit getPaymentRequestStatus error:", res.status, errorBody)
    throw new Error(`Xendit API error: ${res.statusText}`)
  }
  
  return res.json()
}

export async function logPayment({
  invoiceCode,
  endpoint,
  type,
  requestPayload,
  xenditResponse,
  httpStatus
}: {
  invoiceCode: string
  endpoint: string
  type: string
  requestPayload?: object
  xenditResponse: object
  httpStatus: number
}) {
  await sql`
    INSERT INTO payment_logs (invoice_code, endpoint, type, request_payload, response_payload, http_status)
    VALUES (
      ${invoiceCode},
      ${endpoint},
      ${type},
      ${requestPayload ? JSON.stringify(requestPayload) : null},
      ${JSON.stringify(xenditResponse)},
      ${httpStatus}
    )
  `
}
