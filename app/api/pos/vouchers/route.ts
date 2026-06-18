import { NextResponse } from "next/server"
import { getActiveVouchers } from "@/lib/queries/vouchers"

export async function GET() {
  try {
    const vouchers = await getActiveVouchers()
    return NextResponse.json({ success: true, data: vouchers })
  } catch (error: any) {
    console.error("Fetch vouchers error:", error)
    return NextResponse.json({ error: "Failed to fetch vouchers" }, { status: 500 })
  }
}
