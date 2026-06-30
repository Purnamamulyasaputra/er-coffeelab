import { NextRequest, NextResponse } from "next/server"
import { updateCategory, deleteCategory } from "@/lib/queries/categories"

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { requireAdmin } = await import("@/lib/auth");
    const session = await requireAdmin();
    if (session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const data = await request.json()
    const id = Number(params.id)
    
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    await updateCategory(id, {
      name: data.name,
      sort_order: Number(data.sort_order) || 1,
      status: data.status || "ACTIVE"
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { requireAdmin } = await import("@/lib/auth");
    const session = await requireAdmin();
    if (session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const id = Number(params.id)
    await deleteCategory(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete category error:", error)
    if (error.message?.includes('foreign key constraint')) {
      return NextResponse.json({ error: "Cannot delete category because it contains products." }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
