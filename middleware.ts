import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_key"
)

async function verifyTokenEdge(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload
  } catch {
    return null
  }
}

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Proteksi semua route /admin/*
  if (path.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    
    const payload = await verifyTokenEdge(token) as any
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Blokir STORE_ADMIN dari halaman SYSTEM
    const systemPaths = ['/admin/payments', '/admin/content', '/admin/reports', '/admin/users', '/admin/taxconfig']
    if (payload.role === 'STORE_ADMIN' && systemPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    // Blokir akses ke halaman employees & attendance & notifications untuk STORE_ADMIN
    const restrictedPaths = ['/admin/employees', '/admin/attendance', '/admin/notifications']
    if (payload.role === 'STORE_ADMIN' && restrictedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
