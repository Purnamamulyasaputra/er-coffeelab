import { NextRequest, NextResponse } from 'next/server';
import { getPayments, createPaymentMethod, updatePaymentMethodsOrder } from '@/lib/queries/payments';

export async function GET() {
  try {
    const data = await getPayments();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createPaymentMethod(body);
    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'reorder') {
      await updatePaymentMethodsOrder(body.items);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
