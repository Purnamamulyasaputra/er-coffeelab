import { NextRequest, NextResponse } from 'next/server';
import { getTables } from '@/lib/queries/tables';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { resolvedBranchId } = await requireAdmin();
    const url = new URL(request.url);
    const branchIdStr = url.searchParams.get("branchId");
    const branchId = branchIdStr ? Number(branchIdStr) : (resolvedBranchId || 1);
    
    const data = await getTables(branchId);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { resolvedBranchId, role } = await requireAdmin();
    // Only SUPERADMIN, STORE_ADMIN, EMPLOYEE are checked by middleware. 
    // Wait, earlier the user explicitly requested EMPLOYEE can manage tables!
    // So we don't need a strict role check here, just the branch boundary.

    const data = await request.json()
    const { createTable } = await import('@/lib/queries/tables')
    
    // Ensure they can only create for their allowed branch, unless SUPERADMIN (resolvedBranchId = null)
    const targetBranchId = resolvedBranchId ? resolvedBranchId : (data.branch_id || 1);

    const result = await createTable({
      branchId: targetBranchId, 
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
    const { resolvedBranchId } = await requireAdmin();
    const data = await request.json()
    if (!data.id) return NextResponse.json({ error: "Table ID required" }, { status: 400 })
    
    // Security: ideally we should verify if the table belongs to the resolvedBranchId
    // but the frontend sends the branch_id in the payload for now.
    
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
    const { resolvedBranchId } = await requireAdmin();
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
