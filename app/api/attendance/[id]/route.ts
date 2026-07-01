import { NextRequest, NextResponse } from "next/server"
import { deleteAttendance, updateAttendance } from "@/lib/queries/attendance"
import { getSession } from "@/lib/auth"

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only SUPERADMIN can delete attendance." }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    await deleteAttendance(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const body = await request.json()
    const { date, timeIn, timeOut } = body
    if (!date || !timeIn) return NextResponse.json({ error: "Date and Time In are required" }, { status: 400 })

    // Convert date DD-MM-YYYY to YYYY-MM-DD
    const [d, m, y] = date.split('-')
    const dateIso = `${y}-${m}-${d}`

    const clockInStr = `${dateIso} ${timeIn}:00`
    const clockOutStr = (timeOut && timeOut !== '-') ? `${dateIso} ${timeOut}:00` : null

    await updateAttendance(id, clockInStr, clockOutStr)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Update attendance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
