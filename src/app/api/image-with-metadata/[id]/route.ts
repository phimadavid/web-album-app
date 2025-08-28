// app/api/albums/[id]/images/route.ts
import { NextResponse } from "next/server";
import Image from "@/backend/db/models/images";

export async function GET(
   request: Request,
   { params }: { params: { id: string } }
) {
   try {
      const images = await Image.findAll({
         where: { albumId: params.id },
         attributes: [
            "id",
            "filename",
            "mimeType",
            "captureDate",
            "latitude",
            "longitude",
            "locationName",
            "eventGroup",
            "sortOrder",
            "isCover",
            "textAnnotation",
            "rotation",
            "originalOrientation",
            "autoRotation",
            "zoom",
            "zoomPositionX",
            "zoomPositionY",
         ],
         order: [["sortOrder", "ASC"]],
      });

      // Process the images to include image URLs instead of data
      const processedImages = images.map(image => {
         // Create an image URL that points to the image endpoint

         let previewDataUrl = null;

         if (image.data) {
            try {
               // Create a small preview (limited size)
               const buffer = Buffer.from(image.data);
               const base64Preview = buffer
                  .toString("base64")
                  .substring(0, 100000); // Limit size
               previewDataUrl = `data:${image.mimeType};base64,${base64Preview}`;
            } catch (error) {
               console.error(
                  `Error creating preview for image ${image.id}:`,
                  error
               );
            }
         }
         // Structure the metadata object
         const metadata = {
            captureDate: image.captureDate,
            eventGroup: image.eventGroup || "Unsorted",
            isCover: image.isCover,
            textAnnotation: image.textAnnotation,
            rotation: image.rotation,
            zoom: image.zoom,
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
            imageUrl: `/api/images/${image.id}`,
            metadata: metadata,
         };
      });

      return NextResponse.json(processedImages);
   } catch (error) {
      console.error("Fetch images error:", error);
      return NextResponse.json(
         { error: "Failed to fetch images" },
         { status: 500 }
      );
   }
}
