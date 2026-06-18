import { NextRequest, NextResponse } from "next/server"
import { deleteAttendance } from "@/lib/queries/attendance"
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
