// File: pages/api/images/[albumId]/set-cover.js
import Image from '@/backend/db/models/images';
import Album from '@/backend/db/models/album';
import { sequelize } from '@/backend/db/models/db';

interface RequestBody {
  imageId: string;
}

interface RequestQuery {
  albumId: string;
}

interface ImageMetadata {
  isCover?: boolean | null;
  [key: string]: any;
}

interface ApiResponse {
  error?: string;
  details?: string;
  success?: boolean;
  coverImageId?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const albumId = params.id;
  const { imageId } = (await req.json()) as RequestBody;

  if (!albumId || !imageId) {
    return Response.json(
      { error: 'Album ID and Image ID are required' },
      { status: 400 }
    );
  }

  // Start a transaction to ensure data consistency
  const transaction = await sequelize.transaction();

  try {
    // Verify the album exists
    const album = await Album.findByPk(albumId, { transaction });
    if (!album) {
      await transaction.rollback();
      return Response.json({ error: 'Album not found' }, { status: 404 });
    }

    // Verify the image exists and belongs to the album
    const image = await Image.findOne({
      where: {
        id: imageId,
        albumId,
      },
      transaction,
    });

    if (!image) {
      await transaction.rollback();
      return Response.json(
        { error: 'Image not found in this album' },
        { status: 404 }
      );
    }

    // Get all images in the album
    const albumImages = await Image.findAll({
      where: { albumId },
      transaction,
    });

    // Update each image's metadata
    const updatePromises = albumImages.map((img) => {
      // Since your model has a direct isCover field and not a metadata object,
      // we can update it directly
      return img.update(
        {
          isCover: img.id === imageId,
        },
        { transaction }
      );
    });

    await Promise.all(updatePromises);

    // Update album's cover image reference if you have such a field in your Album model
    // Uncomment if your Album model has this field
    // if (album.coverImageId !== imageId) {
    //     await album.update(
    //         { coverImageId: imageId },
    //         { transaction }
    //     );
    // }

    await transaction.commit();
    return Response.json({ success: true, coverImageId: imageId });
  } catch (error) {
    await transaction.rollback();
    console.error('Error setting cover image:', error);
    return Response.json(
      { error: 'Failed to set cover image', details: (error as Error).message },
      { status: 500 }
    );
  }
}
