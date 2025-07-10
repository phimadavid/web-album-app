//src/app/api/book/apply-template/route.ts
import Book from '@/backend/db/models/book';
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { s3Client } from '@/backend/services/awsS3/s3service';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'your-bucket-name';

// Function to upload base64 image to S3
async function uploadBase64ToS3(
  base64Data: string,
  templateId: string
): Promise<string> {
  try {
    // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');

    // Generate S3 key with template ID as folder
    const s3Key = `templates/${templateId}/${uuidv4()}.webp`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: 'image/webp',
      ACL: 'public-read' as const,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Return the S3 URL
    const region = process.env.AWS_REGION || 'us-east-1';
    const imageUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;
    return imageUrl;
  } catch (error) {
    console.error('Error uploading template image to S3:', error);
    throw new Error(
      `S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { albumId, template } = body;

    if (!albumId || !template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upload templateImage to S3 if it exists and is base64 data
    // let templateImageUrl = template.templateImage;
    // if (template.templateImage && template.templateImage.startsWith('data:')) {
    //   try {
    //     templateImageUrl = await uploadBase64ToS3(
    //       template.templateImage,
    //       template.id
    //     );
    //   } catch (uploadError) {
    //     console.error('Failed to upload template image to S3:', uploadError);
    //     // Continue with original base64 data if S3 upload fails
    //     templateImageUrl = template.templateImage;
    //   }
    // }

    // Check if template already exists for this album
    const existingTemplate = await Book.findOne({
      where: { albumId },
    });

    let savedTemplate;

    if (existingTemplate) {
      // Update existing template
      existingTemplate.bookId = template.id;
      existingTemplate.name = template.name;
      existingTemplate.previewUrl = template.previewUrl;
      existingTemplate.theme = template.theme;
      existingTemplate.style = template.style;
      existingTemplate.colors = template.colors;
      existingTemplate.cover_image_count = template.coverImageCount;
      existingTemplate.cover_images = template.coverImages;
      existingTemplate.templateImage = template.templateImage; // Use S3 URL or original data
      existingTemplate.eventCategory = template.eventCategory;
      existingTemplate.promptWord = template.promptWord || '';
      existingTemplate.detectedTags = template.detectedTags || [];

      savedTemplate = await existingTemplate.save();
    } else {
      // Create new template - using exactly the data structure provided
      savedTemplate = await Book.create({
        bookId: template.id, // 't1' format
        albumId,
        name: template.name,
        previewUrl: template.previewUrl,
        theme: template.theme,
        style: template.style,
        colors: template.colors,
        cover_image_count: template.coverImageCount,
        cover_images: template.coverImages,
        templateImage: template.templateImage, // Use S3 URL or original data
        eventCategory: template.eventCategory,
        promptWord: template.promptWord || '',
        detectedTags: template.detectedTags || [],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Template applied successfully',
      data: savedTemplate,
    });
  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json(
      {
        error: 'Failed to apply template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
