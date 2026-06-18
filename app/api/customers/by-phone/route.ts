import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone")
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    const customers = await sql`
      SELECT c.id, c.name, c.phone, t.name as "loyaltyTier" 
      FROM customers c
      LEFT JOIN loyalty_tiers t ON c.loyalty_tier_id = t.id
      WHERE c.phone = ${phone}
      LIMIT 1
    `

    if (customers.length === 0) {
      return NextResponse.json({ error: "Nomor pelanggan tidak ditemukan. Pastikan pelanggan sudah terdaftar." }, { status: 404 })
    }

    return NextResponse.json({ data: customers[0] })
  } catch (error) {
    console.error("Get customer by phone error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
