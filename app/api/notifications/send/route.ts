import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/queries/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await sendPushNotification(body);
    return NextResponse.json({ data: data[0] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
