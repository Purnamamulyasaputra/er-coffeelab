import { NextRequest, NextResponse } from "next/server"
import { updateCampaign, deleteCampaign } from "@/lib/queries/campaigns"
import { getSession } from "@/lib/auth"

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const body = await request.json()
    const { name, description, imageUrl, startDate, endDate, status } = body
    if (!name || !startDate || !endDate) return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 })

    await updateCampaign(id, { name, description, imageUrl, startDate, endDate, status: status || 'ACTIVE' })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Update campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    await deleteCampaign(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
