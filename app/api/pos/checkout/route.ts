import { NextRequest, NextResponse } from "next/server"
import { processPosCheckout } from "@/lib/queries/pos"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    let session = (await getSession("pos")) as any
    if (!session || !session.branchId) {
      const adminSession = (await getSession("admin")) as any
      if (adminSession) {
        // Fallback to admin session (admin testing POS)
        session = { branchId: adminSession.branchId || 1, shiftId: 1 }
      } else {
        return NextResponse.json({ error: "Unauthorized or invalid session" }, { status: 401 })
      }
    }

    const data = await request.json()
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const result = await processPosCheckout({
      branchId: session.branchId,
      customerId: data.customerId || null,
      shiftId: session.shiftId || 1, // Fallback if missing
      orderType: data.orderType || 'DINE_IN',
      source: 'POS',
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount || 0,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod || 'CASH',
      items: data.items
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error: any) {
    console.error("POS checkout error:", error)
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 })
  }
}
