import { NextResponse } from "next/server"

export async function GET() {
  const GOOGLE_ID = process.env.GOOGLE_ID
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!GOOGLE_ID) {
    return NextResponse.json({ error: "Missing Google Client ID" }, { status: 500 })
  }

  const redirectUri = `${APP_URL}/api/auth/google/callback`
  const scope = "openid email profile"
  const responseType = "code"

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline`

  return NextResponse.redirect(googleAuthUrl)
}
