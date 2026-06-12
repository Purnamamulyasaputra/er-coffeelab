import { NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/queries/users"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(body.password, salt)
    
    const userData = {
      name: body.name,
      email: body.email,
      passwordHash: passwordHash,
      role: body.role || 'SUPERADMIN',
      status: body.status || 'ACTIVE',
      branchIds: body.branchIds || []
    }
    
    const newUser = await createUser(userData)
    
    return NextResponse.json({ success: true, data: newUser[0] })
  } catch (err: unknown) {
    const error = err as Error
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
