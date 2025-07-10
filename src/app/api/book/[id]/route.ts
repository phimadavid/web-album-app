import Book from '@/backend/db/models/book';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const albumId = params.id;

    if (!albumId) {
      return NextResponse.json(
        { error: 'Album ID is required' },
        { status: 400 }
      );
    }

    // Find the book template for the specified album
    const bookTemplate = await Book.findOne({
      where: { albumId },
    });

    // If no template exists for this album, return 404
    if (!bookTemplate) {
      return NextResponse.json(
        { error: 'No template found for this album' },
        { status: 404 }
      );
    }

    // Return the found template
    return NextResponse.json({
      success: true,
      data: bookTemplate,
    });
  } catch (error) {
    console.error('Error retrieving template:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
