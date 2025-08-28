import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options as authOptions } from "@/backend/utils/authOption";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "@/backend/services/awsS3/s3service";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "your-bucket-name";

export async function POST(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const requestData = await request.json();
      const { base64Image, prompt, style } = requestData;

      // Validate required fields
      if (!base64Image || !prompt || !style) {
         return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
         );
      }

      // Extract base64 data and convert to buffer
      const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Generate S3 key for AI art
      const userId = (session.user as any).id;
      const s3Key = `ai-art/${userId}/${uuidv4()}.png`;

      // Upload to S3
      const uploadParams = {
         Bucket: BUCKET_NAME,
         Key: s3Key,
         Body: imageBuffer,
         ContentType: "image/png",
         ACL: "public-read" as const,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Generate image URL
      const imageUrl = `https://${BUCKET_NAME}.s3.${
         process.env.AWS_REGION || "us-east-1"
      }.amazonaws.com/${s3Key}`;

      return NextResponse.json({
         success: true,
         imageUrl,
         s3Key,
         message: "Image uploaded successfully",
      });
   } catch (error) {
      console.error("Error uploading AI art to S3:", error);
      return NextResponse.json(
         {
            error: "Failed to upload image",
            details: error instanceof Error ? error.message : "Unknown error",
         },
         { status: 500 }
      );
   }
}
