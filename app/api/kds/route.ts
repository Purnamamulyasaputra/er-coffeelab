import { NextRequest, NextResponse } from 'next/server';
import { getActiveKdsOrders } from '@/lib/queries/kds';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession("pos") || await getSession("admin");
    const url = new URL(request.url);
    const branchIdStr = url.searchParams.get("branchId");
    
    // If branchId param is provided, use it. Otherwise check session. 
    // If neither → undefined means "all branches"
    let branchId: number | undefined;
    if (branchIdStr && branchIdStr !== "all") {
      branchId = Number(branchIdStr);
    } else if (!branchIdStr && session) {
      // No param provided — check if POS session has a branch
      const sessionBranch = (session as any)?.branchId;
      if (sessionBranch) branchId = Number(sessionBranch);
    }
    // If branchId is still undefined → returns all branches
    
    const data = await getActiveKdsOrders(branchId);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
