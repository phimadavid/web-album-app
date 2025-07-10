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
      attributes: [
        'id',
        'filename',
        's3Url',
        'mimeType',
        'previewUrl',
        'captureDate',
        'locationName',
        'eventGroup',
        'sortOrder',
        'caption',
        'event_tags',
        'textAnnotation',
        'rotation',
        'zoom',
        'zoomPositionX',
        'zoomPositionY',
      ],
      order: [['sortOrder', 'ASC']],
    });

    // Process the images to include image URLs instead of data
    const processedImages = images.map((image) => {
      // Create an image URL for S3 images that points to the image endpoint
      const viewImage = image.s3Url;

      // Structure the metadata object
      const metadata = {
        captureDate: image.captureDate,
        locationName: image.locationName,
        eventGroup: image.eventGroup || 'Unsorted',
        textAnnotation: image.textAnnotation,
        rotation: image.rotation,
        zoom: image.zoom,
        event_tags: image.event_tags,
        caption: image.caption,
        zoomPosition:
          image.zoomPositionX !== null && image.zoomPositionY !== null
            ? {
                x: image.zoomPositionX,
                y: image.zoomPositionY,
              }
            : null,
      };

      return {
        id: image.id,
        filename: image.filename,
        mimeType: image.mimeType,
        s3Url: viewImage,
        previewUrl: image.previewUrl,
        imageUrl: `/api/photos/${image.id}`,
        thumbnailUrl: `/api/images/${image.id}/thumbnail`,
        metadata: metadata,
      };
    });

    return NextResponse.json(processedImages);
  } catch (error) {
    console.error('Fetch images error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
