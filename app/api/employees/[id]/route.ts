import { NextRequest, NextResponse } from "next/server"
import { updateEmployee } from "@/lib/queries/hr"
import { getSession } from "@/lib/auth"

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const data = await request.json()
    
    if (!data.name || !data.branch_id) {
      return NextResponse.json({ error: "Name and branch are required" }, { status: 400 })
    }

    // If branch admin, they can only edit employees in their branch
    if (session.role !== "SUPERADMIN" && Number(session.branchId) !== Number(data.branch_id)) {
      return NextResponse.json({ error: "Cannot move employee to another branch" }, { status: 403 })
    }

    const result = await updateEmployee(id, {
      name: data.name,
      branch_id: Number(data.branch_id),
      role: data.role || "BARISTA",
      pin: data.pin,
      rate: Number(data.rate) || 0
    })

    return NextResponse.json({ success: true, id: result[0].id }, { status: 200 })
  } catch (error: any) {
    console.error("Update employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession("admin") as any
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only SUPERADMIN can delete employees." }, { status: 403 })
    }

    const params = await props.params
    const id = Number(params.id)
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

    const { deleteEmployee } = await import("@/lib/queries/hr")
    await deleteEmployee(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete employee error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
