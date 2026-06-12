import { NextRequest, NextResponse } from 'next/server';
import { getActiveKdsOrders } from '@/lib/queries/kds';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("pos") || await getSession("admin");
    const url = new URL(request.url);
    const branchIdStr = url.searchParams.get("branchId");
    const branchId = branchIdStr ? Number(branchIdStr) : (Number((session as any)?.branchId) || 1);
    
    const data = await getActiveKdsOrders(branchId);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
