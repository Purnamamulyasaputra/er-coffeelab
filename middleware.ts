import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_key"
)

async function verifyTokenEdge(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload
  } catch (error) {
    return null
  }
}

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const payload = await verifyTokenEdge(token)
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  if (path.startsWith("/pos") && path !== "/pos/login") {
    const token = request.cookies.get("pos_token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/pos/login", request.url))
    }

    const payload = await verifyTokenEdge(token)
    if (!payload) {
      return NextResponse.redirect(new URL("/pos/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*"],
}
