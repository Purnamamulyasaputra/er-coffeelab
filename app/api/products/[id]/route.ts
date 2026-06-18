import { NextRequest, NextResponse } from "next/server"
import { updateProduct, deleteProduct } from "@/lib/queries/products"

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const data = await request.json()
    const id = Number(params.id)
    
    if (!data.name || !data.category_id || !data.price) {
      return NextResponse.json({ error: "Name, category, and price are required" }, { status: 400 })
    }

    await updateProduct(id, {
      name: data.name,
      category_id: Number(data.category_id),
      price: Number(data.price),
      cost: Number(data.cost) || 0,
      sku: data.sku || "",
      description: data.description || null,
      badge: data.badge || "-",
      status: data.status || "ACTIVE",
      image_url: data.image_url
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const id = Number(params.id)
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete product error:", error)
    // If it fails, it's likely a foreign key constraint violation (e.g. product is used in orders)
    if (error.message?.includes('foreign key constraint')) {
      return NextResponse.json({ error: "Cannot delete product because it has been used in orders." }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
