import { NextResponse, NextRequest } from "next/server"
import { getSession, requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    
    let dineinEnabled = true;
    if (session.resolvedBranchId) {
      const branchData = await sql`SELECT dinein_enabled FROM branches WHERE id = ${session.resolvedBranchId}`;
      if (branchData.length > 0) {
        dineinEnabled = branchData[0].dinein_enabled;
      }
    }

    return NextResponse.json({
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
      branchId: session.resolvedBranchId,
      dineinEnabled
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
