import { NextRequest, NextResponse } from "next/server"
import { createEmployee } from "@/lib/queries/hr"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name || !data.branch_id || !data.password) {
      return NextResponse.json({ error: "Name, branch, and Password are required" }, { status: 400 })
    }

    const result = await createEmployee({
      name: data.name,
      branch_id: Number(data.branch_id),
      role: data.role || "BARISTA",
      password: data.password,
      rate: Number(data.rate) || 0,
      email: data.email,
      phone: data.phone,
      status: data.status,
      giveLoginAccess: data.giveLoginAccess,
      loginPassword: data.loginPassword
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
