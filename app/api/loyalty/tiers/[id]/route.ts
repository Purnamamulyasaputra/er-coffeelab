import { NextRequest, NextResponse } from "next/server"
import { updateLoyaltyTier, deleteLoyaltyTier } from "@/lib/queries/loyalty"
import { getSession } from "@/lib/auth"

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const data = await req.json()
    if (!data.name || data.min_spend === undefined || data.point_multiplier === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await updateLoyaltyTier(id, {
      name: data.name,
      min_spend: Number(data.min_spend),
      point_multiplier: Number(data.point_multiplier),
      benefits: data.benefits || "",
      sort_order: Number(data.sort_order) || 0
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 200 })
  } catch (error) {
    console.error("Update tier error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    await deleteLoyaltyTier(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Delete tier error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
