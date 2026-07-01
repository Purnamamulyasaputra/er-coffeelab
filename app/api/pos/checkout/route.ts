import { NextRequest, NextResponse } from "next/server"
import { processPosCheckout } from "@/lib/queries/pos"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    let session = await getSession("admin") as any
    if (!session) {
      return NextResponse.json({ error: "Unauthorized or invalid session" }, { status: 401 })
    }
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Allow branchId override from request body (admin panel branch selector)
    const branchId = data.branchId || session.branchId

    // Validate Dine In eligibility
    const { sql } = await import("@/lib/db");
    const branch = await sql`SELECT dinein_enabled FROM branches WHERE id = ${branchId}`;
    if (branch.length > 0) {
      if ((data.orderType || 'DINE_IN') === 'DINE_IN' && !branch[0].dinein_enabled) {
        return NextResponse.json({ error: "Dine-in is not available at this branch" }, { status: 400 })
      }
    }

    const result = await processPosCheckout({
      branchId: branchId,
      customerId: data.customerId || null,
      shiftId: session.shiftId || 1,
      employeeId: data.employeeId || null,
      adminId: session.sub ? Number(session.sub) : null,
      role: session.role || null,
      orderType: data.orderType || 'DINE_IN',
      source: 'POS',
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount || 0,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod === null ? null : (data.paymentMethod || 'CASH'),
      cashAmount: data.cashAmount || 0,
      tableSessionId: data.tableSessionId,
      voucherId: data.voucherId || null,
      items: data.items
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error: any) {
    console.error("POS checkout error:", error)
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 })
  }
}
