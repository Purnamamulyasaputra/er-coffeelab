import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { getStockOpnameItems, completeStockOpname, deleteStockOpname } from "@/lib/queries/stock_opname"

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const items = await getStockOpnameItems(id)

    return NextResponse.json({ items }, { status: 200 })
  } catch (error: any) {
    console.error("Get stock opname error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const { items, action } = await request.json()

    // Save actual stock and calculate difference
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const actualStock = Number(item.actual_stock) || 0
        const systemStock = Number(item.system_stock) || 0
        const difference = actualStock - systemStock
        
        await sql`
          UPDATE stock_opname_items 
          SET actual_stock = ${actualStock}, difference = ${difference}
          WHERE id = ${item.id} AND stock_opname_id = ${id}
        `
      }
    }

    if (action === "COMPLETE") {
      await completeStockOpname(id)
      return NextResponse.json({ success: true, status: 'COMPLETED' }, { status: 200 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Update stock opname error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || (session.role !== "SUPERADMIN" && session.role !== "STORE_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    await deleteStockOpname(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete stock opname error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
