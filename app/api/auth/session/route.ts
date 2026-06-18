import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession("admin") as any
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  return NextResponse.json({
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    branchId: session.branchId ?? null
  })
}
