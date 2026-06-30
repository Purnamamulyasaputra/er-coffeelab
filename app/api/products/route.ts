import { NextRequest, NextResponse } from "next/server"
import { createProduct } from "@/lib/queries/products"

export async function POST(request: NextRequest) {
  try {
    const { requireAdmin } = await import("@/lib/auth");
    const session = await requireAdmin();
    if (session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const data = await request.json()
    
    if (!data.name || !data.category_id || !data.price) {
      return NextResponse.json({ error: "Name, category, and price are required" }, { status: 400 })
    }

    const branch_id = session.resolvedBranchId || (data.branch_id ? Number(data.branch_id) : null);

    const result = await createProduct({
      name: data.name,
      category_id: Number(data.category_id),
      price: Number(data.price),
      cost: Number(data.cost) || 0,
      sku: data.sku || "",
      description: data.description || null,
      badge: data.badge || "-",
      status: data.status || "ACTIVE",
      image_url: data.image_url,
      branch_id: branch_id
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
