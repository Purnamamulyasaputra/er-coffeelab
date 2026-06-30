import { NextRequest, NextResponse } from "next/server"
import { createDiscount } from "@/lib/queries/discounts"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const data = await request.json()
    
    if (!data.name || !data.type || !data.value || !data.scope) {
      return NextResponse.json({ error: "Name, Type, Value, and Scope are required" }, { status: 400 })
    }

    const result = await createDiscount({
      name: data.name,
      type: data.type,
      value: data.value,
      scope: data.scope,
      requires_pin: data.requires_pin !== false,
      is_active: data.is_active !== false
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create discount error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
