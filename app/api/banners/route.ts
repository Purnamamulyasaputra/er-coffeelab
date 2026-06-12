import { NextRequest, NextResponse } from 'next/server';
import { getBanners, createBanner } from '@/lib/queries/banners';

export async function GET() {
  try {
    const data = await getBanners();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createBanner(body);
    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
