import { NextRequest, NextResponse } from "next/server"
import { updateSupplier, deleteSupplier } from "@/lib/queries/suppliers"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await updateSupplier(id, {
      name: data.name,
      contact: data.contact || "",
      phone: data.phone || "",
      email: data.email || ""
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update supplier error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    await deleteSupplier(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete supplier error:", error);
    // Usually foreign key constraint errors happen here if there are linked POs
    if (error.code === '23503') {
      return NextResponse.json({ error: "Cannot delete supplier because it is linked to existing purchase orders." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
