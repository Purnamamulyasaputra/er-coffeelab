import { NextRequest, NextResponse } from 'next/server';
import { cancelOrder } from '@/lib/queries/orders';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession("pos") || await getSession("admin");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { cancelReason } = body;

    const actorId = session.sub ? Number(session.sub) : undefined;
    const result = await cancelOrder(id, actorId, cancelReason);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
