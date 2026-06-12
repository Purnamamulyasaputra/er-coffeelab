import { NextRequest, NextResponse } from "next/server"
import { createSupplier } from "@/lib/queries/suppliers"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await createSupplier({
      name: data.name,
      contact: data.contact || "",
      phone: data.phone || "",
      email: data.email || ""
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create supplier error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
