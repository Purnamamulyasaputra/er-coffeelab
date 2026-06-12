import { NextRequest, NextResponse } from "next/server"
import { createTaxConfig } from "@/lib/queries/tax_configs"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name || !data.branch_id || !data.rate) {
      return NextResponse.json({ error: "Name, Branch, and Rate are required" }, { status: 400 })
    }

    const result = await createTaxConfig({
      branch_id: data.branch_id,
      tax_name: data.name,
      tax_rate: data.rate,
      is_inclusive: data.is_inclusive || false,
      is_active: data.is_active !== false
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create tax config error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
