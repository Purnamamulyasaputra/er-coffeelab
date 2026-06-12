import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { signToken, setAuthCookie } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Special logic for testing: Auto-create superadmin@ercoffeelab.id / admin123 if it doesn't exist
    if (email === "superadmin@ercoffeelab.id" && password === "admin123") {
      const existing = await sql`SELECT id FROM admins WHERE email = ${email}`
      if (existing.length === 0) {
        const hash = await bcrypt.hash(password, 10)
        await sql`
          INSERT INTO admins (name, email, password_hash, role, status)
          VALUES ('Super Admin', ${email}, ${hash}, 'SUPERADMIN', 'ACTIVE')
        `
      }
    }
    
    // Special logic for testing Admin Outlet: storeadmin@ercoffeelab.id / admin123
    if (email === "storeadmin@ercoffeelab.id" && password === "admin123") {
      const existing = await sql`SELECT id FROM admins WHERE email = ${email}`
      if (existing.length === 0) {
        const hash = await bcrypt.hash(password, 10)
        await sql`
          INSERT INTO admins (name, email, password_hash, role, status)
          VALUES ('Admin Outlet', ${email}, ${hash}, 'STORE_ADMIN', 'ACTIVE')
        `
      }
    }

    const admins = await sql`SELECT id, name, email, password_hash, role, status FROM admins WHERE email = ${email}`
    const user = admins[0]

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Issue JWT
    const payload = {
      sub: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      type: "admin"
    }

    const token = await signToken(payload)
    await setAuthCookie(token, "admin")

    const redirectUrl = user.role === 'SUPERADMIN' ? "/admin/dashboard" : "/pos"
    return NextResponse.json({ success: true, redirect: redirectUrl, role: user.role })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
