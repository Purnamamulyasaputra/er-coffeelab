import { NextRequest, NextResponse } from "next/server"
import { decodeJwt } from "jose"
import { sql } from "@/lib/db"
import { setAuthCookie, signToken } from "@/lib/auth"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url))
  }

  const GOOGLE_ID = process.env.GOOGLE_ID
  const GOOGLE_SECRET = process.env.GOOGLE_SECRET
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const redirectUri = `${APP_URL}/api/auth/google/callback`

  if (!GOOGLE_ID || !GOOGLE_SECRET) {
    return NextResponse.json({ error: "Missing Google Credentials" }, { status: 500 })
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_ID,
        client_secret: GOOGLE_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData)
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
    }

    const { id_token } = tokenData
    const decoded = decodeJwt(id_token)
    const email = decoded.email as string
    const name = decoded.name as string

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=no_email", request.url))
    }

    // Check if user exists in admins
    let admins = await sql`SELECT id, name, email, role FROM admins WHERE email = ${email}`
    let user = admins[0]

    // If user does not exist, insert into admins automatically
    if (!user) {
      const dummyPassword = crypto.randomBytes(16).toString("hex")
      const inserted = await sql`
        INSERT INTO admins (name, email, password_hash, role, status)
        VALUES (${name}, ${email}, ${dummyPassword}, 'SUPERADMIN', 'ACTIVE')
        RETURNING id, name, email, role
      `
      user = inserted[0]
    }

    // Create session JWT
    const payload = {
      sub: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      type: "admin"
    }

    const jwt = await signToken(payload)
    
    // Set cookie
    await setAuthCookie(jwt, "admin")

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))

  } catch (error) {
    console.error("Google auth error:", error)
    return NextResponse.redirect(new URL("/login?error=server_error", request.url))
  }
}
