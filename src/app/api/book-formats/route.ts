import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/backend/utils/authOption';
import CreateAlbum from '@/backend/db/models/createalbum';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL search params
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');

    let whereClause = {};
    if (albumId) {
      whereClause = { albumId };
    }

    const bookFormats = await CreateAlbum.findAll({
      where: whereClause,
      attributes: [
        'id',
        'albumId',
        'format',
        'dimensions',
        'photosize',
        'coverType',
        'paperQuality',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform the data to match the expected format for the order modal
    const transformedFormats = bookFormats.map((format) => ({
      id: format.id.toString(),
      title: format.format,
      dimensions: format.dimensions,
      photosize: format.photosize,
      coverType: format.coverType,
      paperQuality: format.paperQuality,
      albumId: format.albumId,
      // Default pricing - you may want to add pricing fields to the CreateAlbum model
      softcover: format.coverType === 'softcover' ? 140 : null,
      hardcover: format.coverType === 'hardcover' ? 200 : null,
      dutchBook: 250,
    }));

    return NextResponse.json({
      success: true,
      bookFormats: transformedFormats
    });

  } catch (error) {
    console.error('Error fetching book formats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      albumId,
      format,
      dimensions,
      photosize,
      coverType,
      paperQuality
    } = await request.json();

    // Validate required fields
    if (!albumId || !format || !dimensions || !photosize || !coverType || !paperQuality) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bookFormat = await CreateAlbum.create({
      albumId,
      format,
      dimensions,
      photosize,
      coverType,
      paperQuality
    });

    return NextResponse.json({
      success: true,
      message: 'Book format created successfully',
      bookFormat: {
        id: bookFormat.id.toString(),
        title: bookFormat.format,
        dimensions: bookFormat.dimensions,
        photosize: bookFormat.photosize,
        coverType: bookFormat.coverType,
        paperQuality: bookFormat.paperQuality,
        albumId: bookFormat.albumId,
      }
    });

  } catch (error) {
    console.error('Error creating book format:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
