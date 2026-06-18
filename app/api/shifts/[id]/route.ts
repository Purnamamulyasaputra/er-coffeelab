import { NextRequest, NextResponse } from "next/server"
import { closeShift, updateShift, deleteShift } from "@/lib/queries/shifts"
import { getSession } from "@/lib/auth"

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getSession("admin") || await getSession("pos")
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const data = await request.json()
    if (data.action === "CLOSE") {
      const result = await closeShift(id, data.actual_cash || 0)
      return NextResponse.json({ success: true, id: result[0].id })
    }
    
    if (data.action === "UPDATE") {
      const result = await updateShift(id, data.actual_cash || 0, data.status, data.starting_cash)
      return NextResponse.json({ success: true, id: result[0].id })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Update shift error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getSession("admin") as any;
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 })
    }
    
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    await deleteShift(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete shift error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
