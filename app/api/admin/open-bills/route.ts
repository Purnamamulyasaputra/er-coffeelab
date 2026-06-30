import { NextRequest, NextResponse } from "next/server"
import { getActiveSessionsWithOrders } from "@/lib/queries/table-sessions"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { resolvedBranchId } = await requireAdmin()
    
    // Support branchId query param for superadmin, otherwise use resolvedBranchId
    const queryBranchId = new URL(request.url).searchParams.get("branchId")
    const branchId = queryBranchId ? Number(queryBranchId) : (resolvedBranchId || undefined)

    const sessions = await getActiveSessionsWithOrders(branchId)
    return NextResponse.json({ data: sessions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
