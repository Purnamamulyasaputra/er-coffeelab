import { NextRequest, NextResponse } from "next/server"
import { createProduct } from "@/lib/queries/products"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name || !data.category_id || !data.price) {
      return NextResponse.json({ error: "Name, category, and price are required" }, { status: 400 })
    }

    const result = await createProduct({
      name: data.name,
      category_id: Number(data.category_id),
      price: Number(data.price),
      cost: Number(data.cost) || 0,
      sku: data.sku || "",
      badge: data.badge || "-",
      status: data.status || "ACTIVE"
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
