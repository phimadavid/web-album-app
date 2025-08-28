import { NextResponse } from "next/server";
import Image from "@/backend/db/models/images";
import sharp from "sharp"; // You'll need to install this: npm install sharp

export async function GET(
   request: Request,
   { params }: { params: { id: string } }
) {
   try {
      // Find the image by ID
      const image = await Image.findByPk(params.id);

      if (!image || !image.data) {
         return NextResponse.json(
            { error: "Image not found" },
            { status: 404 }
         );
      }

      // Generate an optimized thumbnail using sharp
      let thumbnailBuffer;
      try {
         thumbnailBuffer = await sharp(image.data)
            .resize({
               width: 300, // Thumbnail width
               height: 200, // Thumbnail height
               fit: "cover",
            })
            .jpeg({ quality: 80 }) // Compress as JPEG
            .toBuffer();
      } catch (error) {
         console.error("Error generating thumbnail:", error);
         // Fall back to original image data if thumbnail generation fails
         thumbnailBuffer = image.data;
      }

      // Create a response with the thumbnail data
      const response = new NextResponse(thumbnailBuffer);

      // Set appropriate content type and caching headers
      response.headers.set("Content-Type", "image/jpeg");
      response.headers.set("Cache-Control", "public, max-age=604800"); // Cache for 7 days

      return response;
   } catch (error) {
      console.error("Fetch thumbnail error:", error);
      return NextResponse.json(
         { error: "Failed to fetch thumbnail" },
         { status: 500 }
      );
   }
}
