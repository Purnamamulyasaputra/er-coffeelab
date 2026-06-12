import { NextRequest, NextResponse } from "next/server"
import { createShift } from "@/lib/queries/shifts"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.employee_id || !data.branch_id) {
      return NextResponse.json({ error: "Employee and Branch are required" }, { status: 400 })
    }

    const result = await createShift({
      employee_id: data.employee_id,
      branch_id: data.branch_id,
      starting_cash: data.starting_cash || 0
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create shift error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
