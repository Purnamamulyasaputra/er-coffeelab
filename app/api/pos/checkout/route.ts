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

    const result = await processPosCheckout({
      branchId: branchId,
      customerId: data.customerId || null,
      shiftId: session.shiftId || 1,
      employeeId: null, // Admin login does not link to employee table
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
