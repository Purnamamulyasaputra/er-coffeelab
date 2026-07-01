import { NextRequest, NextResponse } from "next/server"
import { createVoucher } from "@/lib/queries/vouchers"
import { getSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    if (!data.code || !data.discount_type || !data.discount_value || !data.start_date || !data.end_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await createVoucher({
      campaign_id: data.campaign_id ? Number(data.campaign_id) : null,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: Number(data.discount_value),
      max_discount: data.max_discount ? Number(data.max_discount) : null,
      min_transaction: Number(data.min_transaction) || 0,
      usage_quota: data.usage_quota ? Number(data.usage_quota) : null,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status || 'ACTIVE'
    })
    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes("vouchers_code_unique")) {
      return NextResponse.json({ error: "Voucher code already exists" }, { status: 400 })
    }
    console.error("Create voucher error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
