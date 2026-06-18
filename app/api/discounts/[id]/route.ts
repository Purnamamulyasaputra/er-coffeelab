import { NextRequest, NextResponse } from "next/server"
import { updateDiscount, deleteDiscount } from "@/lib/queries/discounts"
import { getSession } from "@/lib/auth"

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const data = await request.json()
    
    if (!data.name || !data.type || !data.value || !data.scope) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await updateDiscount(id, {
      name: data.name,
      type: data.type,
      value: Number(data.value),
      scope: data.scope,
      requires_pin: Boolean(data.requires_pin),
      is_active: Boolean(data.is_active)
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 200 })
  } catch (error: any) {
    console.error("Update discount error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    await deleteDiscount(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete discount error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
