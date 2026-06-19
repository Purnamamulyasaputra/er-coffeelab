import { NextRequest, NextResponse } from "next/server"
import { markPoAsReceived } from "@/lib/queries/purchase_orders"
import { getSession } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession("admin") as any;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: poNumber } = await params;
    
    await markPoAsReceived(poNumber);

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Update PO error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update PO" }, 
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession("admin");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: poNumber } = await params;
    const { getPurchaseOrderDetails } = await import("@/lib/queries/purchase_orders");
    const details = await getPurchaseOrderDetails(poNumber);
    
    if (!details) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(details);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession("admin");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: poNumber } = await params;
    const data = await request.json();
    
    const { updatePurchaseOrder } = await import("@/lib/queries/purchase_orders");
    await updatePurchaseOrder(poNumber, data);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession("admin");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: poNumber } = await params;
    
    const { deletePurchaseOrder } = await import("@/lib/queries/purchase_orders");
    await deletePurchaseOrder(poNumber);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

