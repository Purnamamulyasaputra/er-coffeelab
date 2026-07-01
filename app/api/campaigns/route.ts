import { NextRequest, NextResponse } from "next/server"
import { getCampaigns, createCampaign } from "@/lib/queries/campaigns"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await getCampaigns()
    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    console.error("Get campaigns error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, imageUrl, startDate, endDate, status } = body
    if (!name || !startDate || !endDate) return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 })

    await createCampaign({ name, description, imageUrl, startDate, endDate, status: status || 'ACTIVE' })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error("Create campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
