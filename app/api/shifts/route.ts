import { NextRequest, NextResponse } from "next/server"
import { createShift, closeShift, updateShift, deleteShift } from "@/lib/queries/shifts"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.employee_id || !data.branch_id) {
      return NextResponse.json({ error: `Employee ID (${data.employee_id}) and Branch ID (${data.branch_id}) are required.` }, { status: 400 })
    }

    const result = await createShift({
      employee_id: data.employee_id,
      branch_id: data.branch_id,
      starting_cash: data.starting_cash || 0
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create shift error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (data.action === "close") {
      const result = await closeShift(data.id, data.actual_cash || 0)
      return NextResponse.json({ success: true, id: result[0].id })
    } else {
      const result = await updateShift(data.id, data.actual_cash || 0, data.status, data.starting_cash)
      return NextResponse.json({ success: true, id: result[0].id })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    
    await deleteShift(Number(id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
