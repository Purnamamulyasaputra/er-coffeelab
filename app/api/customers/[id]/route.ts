import { NextRequest, NextResponse } from 'next/server';
import { getCustomerDetail, getCustomerBehaviors } from '@/lib/queries/customers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getCustomerDetail(Number(id));
    const behaviors = await getCustomerBehaviors(Number(id));
    if (!data.profile) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { ...data, behaviors } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
