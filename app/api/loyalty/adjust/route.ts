import { NextRequest, NextResponse } from "next/server"
import { adjustCustomerPoints } from "@/lib/queries/loyalty"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    // Only SUPERADMIN should typically adjust points, but let's allow STORE_ADMIN if needed based on rules
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await request.json()
    if (!data.customer_id || data.points === undefined) {
      return NextResponse.json({ error: "Missing customer_id or points" }, { status: 400 })
    }

    const points = Number(data.points)
    if (points === 0 || isNaN(points)) {
      return NextResponse.json({ error: "Points must be a non-zero number" }, { status: 400 })
    }

    const description = data.description || "Manual adjustment"

    const result = await adjustCustomerPoints(Number(data.customer_id), points, description)
    return NextResponse.json({ success: true, transaction: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Adjust points error:", error)
    if (error.message.includes("Insufficient points")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
