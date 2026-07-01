import { NextRequest, NextResponse } from "next/server"
import { getLoyaltyTiers, createLoyaltyTier } from "@/lib/queries/loyalty"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await getLoyaltyTiers()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Get tiers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await request.json()
    if (!data.name || data.min_spend === undefined || data.point_multiplier === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await createLoyaltyTier({
      name: data.name,
      min_spend: Number(data.min_spend),
      point_multiplier: Number(data.point_multiplier),
      benefits: data.benefits || "",
      sort_order: Number(data.sort_order) || 0
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error) {
    console.error("Create tier error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
