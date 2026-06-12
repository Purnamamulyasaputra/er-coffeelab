import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/queries/kds';
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
    
    if (!body.status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const data = await updateOrderStatus(Number(id), body.status);
    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
