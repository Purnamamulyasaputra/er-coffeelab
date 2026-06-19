import { NextRequest, NextResponse } from "next/server";
import { createCashMovement, deleteCashMovement } from "@/lib/queries/cash";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    
    if (!body.shiftId || !body.employeeId || !body.type || !body.amount || !body.reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createCashMovement({
      shiftId: Number(body.shiftId),
      employeeId: Number(body.employeeId),
      type: body.type,
      amount: Number(body.amount),
      reason: body.reason
    });

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error: any) {
    console.error("Cash movement error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await deleteCashMovement(Number(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete cash movement error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
