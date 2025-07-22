import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { options as authOptions } from '@/backend/utils/authOption';
import AiGeneratedArt from '@/backend/db/models/aiGeneratedArt';
import User from '@/backend/db/models/user';
import Album from '@/backend/db/models/album';

// Import the models to ensure associations are loaded
import '@/backend/db/models/associations';
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    const { imageUrl, s3Key, prompt, style, userId } = requestData;

    console.log('AI Art POST request data:', {
      imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'null',
      s3Key: s3Key ? `${s3Key.substring(0, 30)}...` : 'null',
      prompt,
      style,
      userId,
      sessionUserId: (session.user as any).id,
      sessionUserEmail: session.user.email
    });

    // Validate required fields
    if (!imageUrl || !prompt || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the user ID from session, ensuring it's a number
    const sessionUserId = (session.user as any).id;
    const finalUserId = sessionUserId ? parseInt(sessionUserId.toString()) : null;

    if (!finalUserId) {
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 400 }
      );
    }

    console.log('Final user ID for saving:', finalUserId);

    // Save to database with S3 information
    const savedArt = await AiGeneratedArt.create({
      userId: finalUserId,
      imageUrl,
      s3Key: s3Key || null,
      s3Url: imageUrl,
      prompt,
      style,
      mimeType: 'image/png',
      isPublic: false,
      isFavorite: false,
    });

    console.log('AI art saved successfully:', {
      id: savedArt.id,
      userId: savedArt.userId,
      prompt: savedArt.prompt,
      style: savedArt.style,
      s3Key: savedArt.s3Key,
    });

    return NextResponse.json({ 
      success: true,
      message: 'AI art saved successfully',
      id: savedArt.id,
      data: {
        id: savedArt.id,
        prompt: savedArt.prompt,
        style: savedArt.style,
        imageUrl: savedArt.imageUrl,
        s3Key: savedArt.s3Key,
        s3Url: savedArt.s3Url,
        isPublic: savedArt.isPublic,
        isFavorite: savedArt.isFavorite,
        createdAt: savedArt.createdAt,
      }
    });

  } catch (error) {
    console.error('Error saving AI art:', error);
    return NextResponse.json(
      {
        error: 'Failed to save AI art',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's saved AI art
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's AI generated art from database
    const savedArt = await AiGeneratedArt.findAll({
      where: {
        userId: parseInt((session.user as any).id),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Album,
          as: 'album',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ 
      success: true,
      data: savedArt
    });

  } catch (error) {
    console.error('Error fetching saved AI art:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch saved AI art',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
