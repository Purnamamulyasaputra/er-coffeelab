import { NextResponse } from "next/server"
import { getDashboardData } from "@/lib/queries/dashboard"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { resolvedBranchId } = await requireAdmin()
    const data = await getDashboardData(resolvedBranchId || undefined)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}
