import { NextRequest, NextResponse } from "next/server"
import { createBranchProductStock } from "@/lib/queries/stock"
import { getSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession("admin")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { branch_id, product_id, stock_status } = body

    if (!branch_id || !product_id) {
      return NextResponse.json({ error: "Branch and Product are required" }, { status: 400 })
    }

    const result = await createBranchProductStock(Number(branch_id), Number(product_id), stock_status || "AVAILABLE")
    
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    if (err.message.includes("unique constraint")) {
      return NextResponse.json({ error: "Stock for this product and branch already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || "Failed to create stock" }, { status: 500 })
  }
}
