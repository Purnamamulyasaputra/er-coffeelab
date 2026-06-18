import { NextRequest, NextResponse } from "next/server"
import { updateVoucher, deleteVoucher } from "@/lib/queries/vouchers"
import { getSession } from "@/lib/auth"

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const data = await req.json()
    if (!data.code || !data.discount_type || !data.discount_value || !data.start_date || !data.end_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await updateVoucher(id, data)
    return NextResponse.json({ success: true, id: result[0].id }, { status: 200 })
  } catch (error: any) {
    if (error.message?.includes("vouchers_code_unique")) {
      return NextResponse.json({ error: "Voucher code already exists" }, { status: 400 })
    }
    console.error("Update voucher error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    await deleteVoucher(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete voucher error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
