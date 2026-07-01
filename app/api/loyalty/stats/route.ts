import { NextRequest, NextResponse } from "next/server"
import { getLoyaltyStats } from "@/lib/queries/loyalty"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const stats = await getLoyaltyStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Get loyalty stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
