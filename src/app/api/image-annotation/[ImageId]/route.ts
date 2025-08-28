import Image from "@/backend/db/models/images";
import { NextResponse } from "next/server";

export async function PATCH(
   request: Request,
   { params }: { params: { imageId: string } }
) {
   try {
      const { imageId } = params;
      const { textAnnotation } = await request.json();

      // Validate inputs
      if (!imageId) {
         return NextResponse.json(
            { error: "imageId is required" },
            { status: 400 }
         );
      }

      if (!textAnnotation) {
         return NextResponse.json(
            { error: "textAnnotation is required" },
            { status: 400 }
         );
      }

      // Find the image by ID
      const image = await Image.findByPk(imageId);
      if (!image) {
         return NextResponse.json(
            { error: "Image not found" },
            { status: 404 }
         );
      }

      // Process the textAnnotation based on your model's expectations
      // Your model has textAnnotation as JSON type, so we should:
      // 1. Parse it if it's a string
      // 2. Handle it directly if it's already an object
      let processedAnnotation;

      if (typeof textAnnotation === "string") {
         try {
            processedAnnotation = JSON.parse(textAnnotation);
         } catch (e) {
            // If it can't be parsed as JSON, use the string as is
            processedAnnotation = textAnnotation;
         }
      } else {
         // It's already an object, so we can use it directly
         processedAnnotation = textAnnotation;
      }

      // Update the image with the new text annotation
      await image.update({
         textAnnotation: processedAnnotation,
      });

      // Return success response
      return NextResponse.json({
         success: true,
         message: "Text annotation updated successfully",
         data: {
            id: image.id,
            textAnnotation: processedAnnotation,
         },
      });
   } catch (error) {
      console.error("Error updating text annotation:", error);

      // Provide detailed error information in development
      const errorMessage =
         error instanceof Error
            ? error.message
            : "Failed to update text annotation";
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
