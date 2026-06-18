import { NextRequest, NextResponse } from "next/server"
import { getSessionDetail, closeSession, updateSessionGuestCount } from "@/lib/queries/table-sessions"
import { getSession } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = (await getSession("pos") || await getSession("admin")) as any
    if (!authSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = Number((await params).id)
    
    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const session = await getSessionDetail(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ data: session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = (await getSession("pos") || await getSession("admin")) as any
    if (!userSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = Number((await params).id)
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    if (body.action === 'close') {
      const closedSession = await closeSession(id, userSession.userId)
      return NextResponse.json({ data: closedSession })
    } else if (body.guestCount) {
      const updatedSession = await updateSessionGuestCount(id, body.guestCount)
      return NextResponse.json({ data: updatedSession })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
