import Album from "@/backend/db/models/album";
import Image from "@/backend/db/models/images";
import { sequelize } from "@/backend/db/models/db";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "@/backend/services/awsS3/s3service";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "your-bucket-name";

export async function POST(request: Request) {
   const formData = await request.formData();
   const albumId = formData.get("albumId") as string;

   let metadata: Record<number, any> = {};
   const metadataStr = formData.get("metadata");

   if (metadataStr && typeof metadataStr === "string") {
      try {
         metadata = JSON.parse(metadataStr);
      } catch (e) {
         console.error("Error parsing metadata:", e);
      }
   }

   const transaction = await sequelize.transaction();

   try {
      const files: any[] = [];

      formData.forEach((value, key) => {
         if (key.startsWith("images[")) {
            files.push(value);
         }
      });

      const imagePromises = files.map(async (file, index) => {
         const fileExtension = file.name?.split(".").pop() || "jpg";
         const s3Key = `albums/${albumId}/${uuidv4()}.${fileExtension}`;
         const arrayBuffer = await file.arrayBuffer();
         const buffer = Buffer.from(arrayBuffer);

         const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: file.type || "image/jpeg",
            ACL: "public-read" as const,
         };

         try {
            await s3Client.send(new PutObjectCommand(uploadParams));
            const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3Key}`;

            const imageMetadata = metadata[index] || {};

            const captureDate = imageMetadata.captureDate
               ? new Date(imageMetadata.captureDate)
               : null;
            const gpsLocation = imageMetadata.gpsLocation || null;
            const textAnnotation = imageMetadata.textAnnotation || null;
            const zoomPosition = imageMetadata.zoomPosition || null;

            const filename =
               file.name ||
               (typeof file.originalname === "string"
                  ? file.originalname
                  : `image_${index}.jpg`);

            const mimeType =
               file.type ||
               (typeof file.mimetype === "string"
                  ? file.mimetype
                  : "image/jpeg");

            const height = imageMetadata.height || null;
            const width = imageMetadata.width || null;

            return Image.create(
               {
                  albumId: albumId,
                  filename: filename,
                  s3Key: s3Key,
                  s3Url: imageUrl,
                  mimeType: mimeType,
                  captureDate: captureDate,
                  locationName: gpsLocation?.locationName,
                  caption: imageMetadata.caption,
                  event_tags: imageMetadata.event_tags,
                  eventGroup: imageMetadata.eventGroup,
                  sortOrder: index,
                  previewUrl: imageMetadata.preview,
                  textAnnotation: textAnnotation,
                  rotation: imageMetadata.rotation,
                  zoom: imageMetadata.zoom,
                  zoomPositionX: zoomPosition?.x,
                  zoomPositionY: zoomPosition?.y,
                  height: height,
                  width: width,
               },
               { transaction }
            );
         } catch (uploadError: any) {
            console.error(
               `Failed to upload image ${index} to S3:`,
               uploadError
            );
            throw new Error(`S3 upload failed: ${uploadError.message}`);
         }
      });

      await Promise.all(imagePromises);

      await Album.update(
         { status: "in_progress" },
         {
            where: { id: albumId },
            transaction,
         }
      );

      await transaction.commit();
      return NextResponse.json({ success: true });
   } catch (error) {
      await transaction.rollback();
      console.error("Upload error:", error);

      // Provide more detailed error information
      const errorMessage =
         error instanceof Error ? error.message : "Failed to upload images";
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
