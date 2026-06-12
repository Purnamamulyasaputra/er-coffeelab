import { NextRequest, NextResponse } from "next/server"
import { createIngredient } from "@/lib/queries/inventory"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name || !data.sku) {
      return NextResponse.json({ error: "Name and SKU are required" }, { status: 400 })
    }

    const result = await createIngredient({
      sku: data.sku,
      name: data.name,
      unit: data.unit || "g",
      cost: Number(data.cost) || 0,
      min: Number(data.min) || 0,
      category: data.category || "COFFEE_BEAN"
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create ingredient error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
