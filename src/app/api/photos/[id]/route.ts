import { NextResponse } from "next/server";
import Image from "@/backend/db/models/images";

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

      // Create a response with the binary data
      const response = new NextResponse(image.data);

      // Set appropriate content type and caching headers
      response.headers.set("Content-Type", image.mimeType || "image/jpeg");
      response.headers.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

      return response;
   } catch (error) {
      console.error("Fetch image error:", error);
      return NextResponse.json(
         { error: "Failed to fetch image" },
         { status: 500 }
      );
   }
}
