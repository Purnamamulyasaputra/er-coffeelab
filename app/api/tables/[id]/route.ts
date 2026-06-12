import { NextRequest, NextResponse } from 'next/server';
import { updateTablePosition, updateTableStatus } from '@/lib/queries/tables';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession("pos") || await getSession("admin");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    
    let data;
    if (body.action === 'position') {
      data = await updateTablePosition(Number(id), body.position_x, body.position_y);
    } else if (body.action === 'status') {
      data = await updateTableStatus(Number(id), body.status);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
