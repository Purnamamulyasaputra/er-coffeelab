import { NextResponse, NextRequest } from "next/server"
import { getSession, requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    
    let dineinEnabled = true;
    let hasActiveShift = false;
    
    if (session.resolvedBranchId) {
      const branchData = await sql`SELECT dinein_enabled FROM branches WHERE id = ${session.resolvedBranchId}`;
      if (branchData.length > 0) {
        dineinEnabled = branchData[0].dinein_enabled;
      }
      
      let activeShifts;
      if (session.role === 'EMPLOYEE' && session.employeeId) {
        activeShifts = await sql`SELECT id FROM shifts WHERE branch_id = ${session.resolvedBranchId} AND employee_id = ${session.employeeId} AND status = 'OPEN' LIMIT 1`;
      } else {
        activeShifts = await sql`SELECT id FROM shifts WHERE branch_id = ${session.resolvedBranchId} AND status = 'OPEN' LIMIT 1`;
      }
      hasActiveShift = activeShifts.length > 0;
    }

    return NextResponse.json({
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
      branchId: session.resolvedBranchId,
      dineinEnabled,
      hasActiveShift
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
