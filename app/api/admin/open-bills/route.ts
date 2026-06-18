import { NextRequest, NextResponse } from "next/server"
import { getActiveSessionsWithOrders } from "@/lib/queries/table-sessions"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    // Support branchId query param for superadmin, otherwise use session's branchId
    const queryBranchId = new URL(request.url).searchParams.get("branchId")
    const branchId = queryBranchId ? Number(queryBranchId) : (session.branchId || 1)
    
    if (!branchId) {
      return NextResponse.json({ error: "Branch ID required" }, { status: 400 })
    }

    const sessions = await getActiveSessionsWithOrders(branchId)
    return NextResponse.json({ data: sessions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
