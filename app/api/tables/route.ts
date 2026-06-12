import { NextRequest, NextResponse } from 'next/server';
import { getTables } from '@/lib/queries/tables';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("pos") || await getSession("admin");
    const url = new URL(request.url);
    const branchIdStr = url.searchParams.get("branchId");
    const branchId = branchIdStr ? Number(branchIdStr) : (Number((session as any)?.branchId) || 1);
    
    const data = await getTables(branchId);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { createTable } = await import('@/lib/queries/tables')
    const result = await createTable({
      branchId: data.branch_id || 1, 
      tableNumber: data.table_number,
      section: data.section,
      capacity: Number(data.capacity),
      status: data.status,
      sortOrder: Number(data.sort_order)
    })
    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (error: any) {
    console.error("Create table error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: "Table ID required" }, { status: 400 })
    
    const { updateTable } = await import('@/lib/queries/tables')
    const result = await updateTable({
      id: data.id,
      tableNumber: data.table_number,
      section: data.section,
      capacity: Number(data.capacity),
      status: data.status,
      sortOrder: Number(data.sort_order)
    })
    return NextResponse.json({ success: true, id: result[0].id }, { status: 200 })
  } catch (error: any) {
    console.error("Update table error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Table ID required" }, { status: 400 })
    
    const { deleteTable } = await import('@/lib/queries/tables')
    await deleteTable(Number(id))
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Delete table error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
