import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file found in request' }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

