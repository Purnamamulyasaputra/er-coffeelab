import { NextRequest, NextResponse } from "next/server"
import { getActiveSessions, getActiveSessionsWithOrders, openSession, closeSession, paySessionOrders } from "@/lib/queries/table-sessions"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = (await getSession("pos") || await getSession("admin")) as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const branchId = Number(new URL(request.url).searchParams.get("branchId"))
    const detail = new URL(request.url).searchParams.get("detail") === "true"
    
    if (!branchId) {
      return NextResponse.json({ error: "Branch ID required" }, { status: 400 })
    }

    const sessions = detail ? await getActiveSessionsWithOrders(branchId) : await getActiveSessions(branchId)
    return NextResponse.json({ data: sessions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getSession("pos") || await getSession("admin")) as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    
    const { branchId, tableId, guestCount } = body
    
    if (!branchId || !tableId) {
      return NextResponse.json({ error: "Branch ID and Table ID required" }, { status: 400 })
    }

    const newSession = await openSession({
      branchId,
      tableId,
      guestCount: guestCount || 1,
      employeeId: session.userId
    })

    return NextResponse.json({ data: newSession }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = (await getSession("pos") || await getSession("admin")) as any
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const body = await request.json()
    const { sessionId, action } = body
    
    if (action === "close") {
      if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 })
      const closed = await closeSession(sessionId, session.userId)
      return NextResponse.json({ data: closed })
    }

    if (action === "pay") {
      if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 })
      const { paymentMethod, cashAmount } = body
      if (!paymentMethod) return NextResponse.json({ error: "Payment Method required" }, { status: 400 })
      
      const closed = await paySessionOrders(sessionId, session.userId, paymentMethod, cashAmount || 0)
      return NextResponse.json({ data: closed })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

