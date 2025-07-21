import Image from "@/backend/db/models/images";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "@/backend/services/awsS3/s3service";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "your-bucket-name";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const albumId = formData.get("albumId") as string;
    const metadata = formData.get("metadata") as string;
    const sortOrder = formData.get("sortOrder") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!albumId) {
      return NextResponse.json(
        { error: "Album ID is required" },
        { status: 400 }
      );
    }

    // Parse metadata
    let parsedMetadata: any = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.error("Error parsing metadata:", e);
      }
    }

    // Generate S3 key
    const fileExtension = file.name?.split(".").pop() || "jpg";
    const s3Key = `albums/${albumId}/${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
      ACL: "public-read" as const,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate image URL
    const imageUrl = `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${s3Key}`;

    // Prepare image data
    const captureDate = parsedMetadata.captureDate
      ? new Date(parsedMetadata.captureDate)
      : null;
    const gpsLocation = parsedMetadata.gpsLocation || null;
    const textAnnotation = parsedMetadata.textAnnotation || null;
    const zoomPosition = parsedMetadata.zoomPosition || null;

    const filename = file.name || `image_${sortOrder || 0}.jpg`;
    const mimeType = file.type || "image/jpeg";
    const height = parsedMetadata.height || null;
    const width = parsedMetadata.width || null;

    // Create image record
    const imageRecord = await Image.create({
      albumId: albumId,
      filename: filename,
      s3Key: s3Key,
      s3Url: imageUrl,
      mimeType: mimeType,
      captureDate: captureDate,
      locationName: gpsLocation?.locationName,
      caption: parsedMetadata.caption,
      event_tags: parsedMetadata.event_tags,
      eventGroup: parsedMetadata.eventGroup,
      sortOrder: parseInt(sortOrder || "0"),
      previewUrl: parsedMetadata.preview,
      textAnnotation: textAnnotation,
      rotation: parsedMetadata.rotation,
      zoom: parsedMetadata.zoom,
      zoomPositionX: zoomPosition?.x,
      zoomPositionY: zoomPosition?.y,
      height: height,
      width: width,
    });

    return NextResponse.json({
      success: true,
      imageId: imageRecord.id,
      imageUrl: imageUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("Single upload error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload image";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
