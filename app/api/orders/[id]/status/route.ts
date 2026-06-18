import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/queries/orders';
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
    const { status } = body;
    
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const actorId = session.sub ? Number(session.sub) : undefined;
    const success = await updateOrderStatus(id, status, actorId);
    if (!success) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
