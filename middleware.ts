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

    // Blokir akses ke halaman tertentu untuk STORE_ADMIN
    const restrictedPaths = [
      '/admin/notifications',
      '/admin/suppliers',
      '/admin/campaigns',
      '/admin/banners',
      '/admin/loyalty'
    ]
    if (payload.role === 'STORE_ADMIN' && restrictedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    // Blokir akses EMPLOYEE ke halaman yang tidak diizinkan
    const employeeAllowedPaths = [
      '/admin/pos',
      '/admin/kds',
      '/admin/orders',
      '/admin/products',
      '/admin/tables',
      '/admin/shifts',
      '/admin/cash',
      '/admin/attendance',
      '/admin/refunds',
      '/admin/discounts',
      '/admin/stock',
      '/admin/stockopname',
    ]
    if (payload.role === 'EMPLOYEE') {
      const isAllowed = employeeAllowedPaths.some(p => path.startsWith(p))
      if (!isAllowed) {
        return NextResponse.redirect(new URL("/admin/pos", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
