import { NextRequest, NextResponse } from "next/server"
import { updateIngredient, deleteIngredient } from "@/lib/queries/inventory"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ingredientId = parseInt(id, 10);
    
    if (isNaN(ingredientId)) {
      return NextResponse.json({ error: "Invalid ingredient ID" }, { status: 400 })
    }

    const data = await request.json()
    
    if (!data.name || !data.sku) {
      return NextResponse.json({ error: "Name and SKU are required" }, { status: 400 })
    }

    const result = await updateIngredient(ingredientId, {
      sku: data.sku,
      name: data.name,
      unit: data.unit || "g",
      cost: Number(data.cost) || 0,
      min: Number(data.min) || 0,
      category: data.category || "COFFEE_BEAN"
    })

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error: any) {
    console.error("Update ingredient error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ingredientId = parseInt(id, 10);
    
    if (isNaN(ingredientId)) {
      return NextResponse.json({ error: "Invalid ingredient ID" }, { status: 400 })
    }

    await deleteIngredient(ingredientId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete ingredient error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
