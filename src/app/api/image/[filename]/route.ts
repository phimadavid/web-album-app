import { NextResponse } from 'next/server';
import Image from '@/backend/db/models/images';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    // Enhanced filename validation
    if (!params.filename) {
      return new NextResponse('Filename is required', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    if (params.filename === 'undefined' || params.filename === 'null') {
      return new NextResponse('Invalid filename value', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const image = await Image.findOne({
      where: {
        filename: params.filename,
      },
      attributes: ['data', 'mimeType', 'filename'], // Only select needed fields
    });

    if (!image) {
      return new NextResponse('Image not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    if (!image.data) {
      return new NextResponse('Image data is missing', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Ensure we have a valid mime type
    const mimeType = image.mimeType || 'image/jpeg';

    return new NextResponse(image.data, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error processing image request:', error);
    return new NextResponse('Error processing image request', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
