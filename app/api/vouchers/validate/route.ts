import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { code, customerId, subtotal } = await req.json()
    if (!code || !customerId) {
      return NextResponse.json({ error: "Code and customer ID are required" }, { status: 400 })
    }

    // Get customer tier
    const customers = await sql`
      SELECT c.id, t.name as loyalty_tier 
      FROM customers c 
      LEFT JOIN loyalty_tiers t ON c.loyalty_tier_id = t.id 
      WHERE c.id = ${customerId}
    `
    if (customers.length === 0) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    const customerTier = customers[0].loyalty_tier || "MEMBER"

    // Get voucher
    const vouchers = await sql`
      SELECT * FROM vouchers WHERE code = ${code} LIMIT 1
    `
    if (vouchers.length === 0) return NextResponse.json({ error: "Voucher code not found" }, { status: 404 })
    
    const v = vouchers[0]

    if (v.status !== 'ACTIVE') return NextResponse.json({ error: "Voucher is not active" }, { status: 400 })
    
    const now = new Date()
    if (now < new Date(v.start_date) || now > new Date(v.end_date)) {
      return NextResponse.json({ error: "Voucher is expired or not yet active" }, { status: 400 })
    }

    if (v.usage_quota && v.used_count >= v.usage_quota) {
      return NextResponse.json({ error: "Voucher quota has been reached" }, { status: 400 })
    }

    if (subtotal < v.min_transaction) {
      return NextResponse.json({ error: `Minimum transaction for this voucher is Rp ${v.min_transaction.toLocaleString()}` }, { status: 400 })
    }

    if (v.target_audience === 'TIER' && v.target_tier !== customerTier) {
      return NextResponse.json({ error: `This voucher is exclusively for ${v.target_tier} members` }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: v })
  } catch (error) {
    console.error("Validate voucher error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
