import { NextRequest, NextResponse } from "next/server"
import { updateBranchProductStock, deleteBranchProductStock } from "@/lib/queries/stock"

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const data = await request.json()
    const id = Number(params.id)
    
    if (!data.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    await updateBranchProductStock(id, data.status)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update stock error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const id = Number(params.id)
    await deleteBranchProductStock(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete stock error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
