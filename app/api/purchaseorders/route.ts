import { NextRequest, NextResponse } from "next/server"
import { createPurchaseOrder } from "@/lib/queries/purchase_orders"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key")

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.supplier_id || !data.branch_id || !data.total_amount) {
      return NextResponse.json({ error: "Supplier, Branch, and Total are required" }, { status: 400 })
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

    const result = await createPurchaseOrder({
      supplier_id: data.supplier_id,
      branch_id: data.branch_id,
      total_amount: data.total_amount,
      created_by: adminId
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create PO error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
