import { NextResponse } from "next/server"
import { getDashboardData } from "@/lib/queries/dashboard"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getDashboardData()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}
