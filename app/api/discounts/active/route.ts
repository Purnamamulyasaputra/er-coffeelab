import { NextResponse } from "next/server"
import { getActiveDiscounts } from "@/lib/queries/discounts"

export async function GET() {
  try {
    const discounts = await getActiveDiscounts()
    return NextResponse.json({ data: discounts })
  } catch (error) {
    console.error("Get active discounts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
