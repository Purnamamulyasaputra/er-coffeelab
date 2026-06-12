import { NextRequest, NextResponse } from "next/server"
import { updateUser, deleteUser } from "@/lib/queries/users"
import bcrypt from "bcryptjs"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params
    const body = await req.json()
    const id = parseInt(resolvedParams.id)
    
    let passwordHash = undefined
    if (body.password) {
      const salt = await bcrypt.genSalt(10)
      passwordHash = await bcrypt.hash(body.password, salt)
    }
    
    const userData = {
      name: body.name,
      email: body.email,
      passwordHash: passwordHash,
      role: body.role,
      status: body.status,
      branchIds: body.branchIds || []
    }
    
    const updatedUser = await updateUser(id, userData)
    
    return NextResponse.json({ success: true, data: updatedUser[0] })
  } catch (err: unknown) {
    const error = err as Error
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as Error
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
