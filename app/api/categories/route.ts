import { NextRequest, NextResponse } from "next/server"
import { createCategory } from "@/lib/queries/categories"

export async function POST(request: NextRequest) {
  try {
    const { requireAdmin } = await import("@/lib/auth");
    const session = await requireAdmin();
    if (session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const data = await request.json()
    
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await createCategory({
      name: data.name,
      sort_order: Number(data.sort_order) || 1,
      status: data.status || "ACTIVE"
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
