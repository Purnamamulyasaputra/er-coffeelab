import { NextRequest, NextResponse } from "next/server"
import { createRefund } from "@/lib/queries/refunds"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession("admin") as any;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json()
    
    if (!data.order_id || !data.amount) {
      return NextResponse.json({ error: "Order ID and Amount are required" }, { status: 400 })
    }

    const result = await createRefund({
      order_id: data.order_id,
      refund_type: data.refund_type,
      amount: data.amount,
      reason: data.reason || "Refund requested",
      refund_method: data.refund_method,
      approved_by: session.employeeId || Number(session.sub),
      role: session.role
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create refund error:", error)
    return NextResponse.json({ error: error.message || "Failed to process refund" }, { status: 500 })
  }
}
