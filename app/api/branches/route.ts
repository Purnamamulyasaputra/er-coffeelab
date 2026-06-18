import { NextRequest, NextResponse } from "next/server"
import { createBranch, updateBranch, getBranches } from "@/lib/queries/branches"

export async function GET() {
  try {
    const data = await getBranches()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Basic validation
    if (!data.name || !data.address) {
      return NextResponse.json({ error: "Name and address are required" }, { status: 400 })
    }

    const result = await createBranch({
      name: data.name,
      address: data.address,
      latitude: data.latitude || -6.2,
      longitude: data.longitude || 106.8,
      phone: data.phone,
      image_url: data.image_url,
      operating_hours: data.operating_hours,
      status: data.status,
      delivery_radius_km: data.delivery_radius_km,
      sort_order: data.sort_order,
      pickup_enabled: data.pickup_enabled ?? true,
      delivery_enabled: data.delivery_enabled ?? true,
      dinein_enabled: data.dinein_enabled ?? false,
      tax_rate: data.tax_rate || 0,
      service_charge_pct: data.service_charge_pct || 0
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 })
    }

    const result = await updateBranch({
      id: data.id,
      name: data.name,
      address: data.address,
      latitude: data.latitude || -6.2,
      longitude: data.longitude || 106.8,
      phone: data.phone,
      image_url: data.image_url,
      operating_hours: data.operating_hours,
      status: data.status,
      delivery_radius_km: data.delivery_radius_km,
      sort_order: data.sort_order,
      pickup_enabled: data.pickup_enabled ?? true,
      delivery_enabled: data.delivery_enabled ?? true,
      dinein_enabled: data.dinein_enabled ?? false,
      tax_rate: data.tax_rate || 0,
      service_charge_pct: data.service_charge_pct || 0
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 200 })
  } catch (error: any) {
    console.error("Update branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 })
    }

    // Must import deleteBranch at the top, wait, I will import it in the next tool call if needed
    // Assuming we use standard query or I can just import it dynamically or at the top
    const { deleteBranch } = await import('@/lib/queries/branches')
    await deleteBranch(Number(id))

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
