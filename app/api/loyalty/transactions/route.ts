import { NextRequest, NextResponse } from "next/server"
import { getLoyaltyTransactions } from "@/lib/queries/loyalty"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 100
    const offset = Number(searchParams.get("offset")) || 0

    const data = await getLoyaltyTransactions(limit, offset)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Get loyalty transactions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
