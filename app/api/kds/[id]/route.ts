import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/queries/kds';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const posSession = await getSession("pos");
    const adminSession = await getSession("admin");
    const session = posSession || adminSession;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    
    if (!body.status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const actorType = session.role === "SUPERADMIN" ? "SUPERADMIN" : (session.role === "ADMIN" ? "ADMIN" : "CASHIER");
    const actorName = session.name || "Unknown";

    const data = await updateOrderStatus(Number(id), body.status, String(actorType), String(actorName));
    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
