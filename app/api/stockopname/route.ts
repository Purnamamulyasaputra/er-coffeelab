import { NextRequest, NextResponse } from "next/server"
import { createStockOpname } from "@/lib/queries/stock_opname"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.conducted_by || !data.branch_id) {
      return NextResponse.json({ error: "Employee and Branch are required" }, { status: 400 })
    }

    const result = await createStockOpname({
      conducted_by: data.conducted_by,
      branch_id: data.branch_id
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create stock opname error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
