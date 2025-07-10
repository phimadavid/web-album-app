// app/api/albums/[id]/images/route.ts
import { NextResponse } from 'next/server';
import Image from '@/backend/db/models/images';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const images = await Image.findAll({
      where: { albumId: params.id },
      attributes: ['id', 'filename', 'mimeType']
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Fetch images error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
