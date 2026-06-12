import { NextRequest, NextResponse } from "next/server"
import { createRefund } from "@/lib/queries/refunds"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key")

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.order_id || !data.amount) {
      return NextResponse.json({ error: "Order ID and Amount are required" }, { status: 400 })
    }

    // Attempt to get user ID from token
    let adminId = 1 // fallback for seeding/dev
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get("admin_token")?.value
      if (token) {
        const { payload } = await jwtVerify(token, SECRET_KEY)
        if (payload.sub) adminId = Number(payload.sub)
      }
    } catch (e) {
      // ignore
    }

    const result = await createRefund({
      order_id: data.order_id,
      refund_type: data.refund_type,
      amount: data.amount,
      reason: data.reason || "Admin Refund",
      refund_method: data.refund_method,
      approved_by: adminId
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create refund error:", error)
    return NextResponse.json({ error: "Internal server error. Make sure Order ID is valid." }, { status: 500 })
  }
}
