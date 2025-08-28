//src/app/api/images/[id]/text-annotation/route.ts
import { NextRequest, NextResponse } from "next/server";
import models from "@/backend/db/models";

// import { auth } from '@/lib/auth'; // Uncomment if you have authentication

interface RouteParams {
   params: {
      id: string;
   };
}

export async function PATCH(
   request: NextRequest,
   { params }: RouteParams
): Promise<NextResponse> {
   try {
      // Uncomment if you have authentication
      // const session = await auth();
      // if (!session || !session.user) {
      //   return NextResponse.json(
      //     { error: 'Unauthorized' },
      //     { status: 401 }
      //   );
      // }

      const { id } = params;

      // Validate image ID
      if (!id || typeof id !== "string") {
         return NextResponse.json(
            { error: "Invalid image ID" },
            { status: 400 }
         );
      }

      // Parse request body
      const body = await request.json();
      const { textAnnotation } = body;

      // Validate textAnnotation
      if (!textAnnotation) {
         return NextResponse.json(
            { error: "Text annotation is required" },
            { status: 400 }
         );
      }

      // Validate textAnnotation structure if it's a string
      if (typeof textAnnotation === "string") {
         try {
            const parsed = JSON.parse(textAnnotation);
            if (!parsed.textContent || !parsed.position) {
               return NextResponse.json(
                  {
                     error: "Invalid text annotation structure. Must include textContent and position",
                  },
                  { status: 400 }
               );
            }
         } catch (error) {
            return NextResponse.json(
               { error: "Invalid JSON in text annotation" },
               { status: 400 }
            );
         }
      } else if (typeof textAnnotation === "object") {
         // Validate object structure
         if (!textAnnotation.textContent || !textAnnotation.position) {
            return NextResponse.json(
               {
                  error: "Invalid text annotation structure. Must include textContent and position",
               },
               { status: 400 }
            );
         }
      }

      // Check if image exists
      const existingImage = await models.Image.findOne({
         where: { id: id },
         include: [
            {
               model: models.Album,
               as: "album", // Adjust alias based on your association
               attributes: ["id", "name"], // Adjust fields based on your Album model
            },
         ],
      });

      if (!existingImage) {
         return NextResponse.json(
            { error: "Image not found" },
            { status: 404 }
         );
      }

      // Optional: Check if user owns the album
      // if (existingImage.album?.userId !== session.user.id) {
      //   return NextResponse.json(
      //     { error: 'Forbidden: You do not have permission to edit this image' },
      //     { status: 403 }
      //   );
      // }

      // Prepare text annotation data
      const textAnnotationData =
         typeof textAnnotation === "string"
            ? JSON.parse(textAnnotation)
            : textAnnotation;

      // Update the image with text annotation
      const [affectedRows] = await models.Image.update(
         {
            textAnnotation: textAnnotationData,
         },
         {
            where: { id: id },
            returning: true, // For PostgreSQL, returns updated rows
         }
      );

      if (affectedRows === 0) {
         return NextResponse.json(
            { error: "Failed to update image" },
            { status: 500 }
         );
      }

      // Fetch the updated image to return current data
      const updatedImage = await models.Image.findByPk(id, {
         attributes: ["id", "textAnnotation", "updatedAt"],
      });

      // Return success response
      return NextResponse.json(
         {
            success: true,
            message: "Text annotation updated successfully",
            data: {
               id: updatedImage?.id,
               textAnnotation: updatedImage?.textAnnotation,
               updatedAt: updatedImage?.updatedAt,
            },
         },
         { status: 200 }
      );
   } catch (error: any) {
      console.error("Error updating text annotation:", error);

      // Handle Sequelize validation errors
      if (error.name === "SequelizeValidationError") {
         return NextResponse.json(
            {
               error: "Validation error",
               details: error.errors?.map((err: any) => err.message),
            },
            { status: 400 }
         );
      }

      // Handle Sequelize database constraint errors
      if (error.name === "SequelizeForeignKeyConstraintError") {
         return NextResponse.json(
            { error: "Invalid album reference" },
            { status: 400 }
         );
      }

      // Handle Sequelize unique constraint errors
      if (error.name === "SequelizeUniqueConstraintError") {
         return NextResponse.json(
            { error: "Duplicate entry" },
            { status: 409 }
         );
      }

      // Handle other Sequelize errors
      if (error.name && error.name.startsWith("Sequelize")) {
         return NextResponse.json(
            { error: "Database error occurred" },
            { status: 500 }
         );
      }

      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

// Optional: Add GET method to retrieve current text annotation
export async function GET(
   request: NextRequest,
   { params }: RouteParams
): Promise<NextResponse> {
   try {
      const { id } = params;

      if (!id || typeof id !== "string") {
         return NextResponse.json(
            { error: "Invalid image ID" },
            { status: 400 }
         );
      }

      const image = await models.Image.findByPk(id, {
         attributes: ["id", "textAnnotation", "updatedAt"],
      });

      if (!image) {
         return NextResponse.json(
            { error: "Image not found" },
            { status: 404 }
         );
      }

      return NextResponse.json(
         {
            success: true,
            data: {
               id: image.id,
               textAnnotation: image.textAnnotation || null,
               updatedAt: image.updatedAt,
            },
         },
         { status: 200 }
      );
   } catch (error: any) {
      console.error("Error retrieving text annotation:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

// Optional: Add DELETE method to remove text annotation
export async function DELETE(
   request: NextRequest,
   { params }: RouteParams
): Promise<NextResponse> {
   try {
      const { id } = params;

      if (!id || typeof id !== "string") {
         return NextResponse.json(
            { error: "Invalid image ID" },
            { status: 400 }
         );
      }

      const existingImage = await models.Image.findByPk(id);

      if (!existingImage) {
         return NextResponse.json(
            { error: "Image not found" },
            { status: 404 }
         );
      }

      // Remove text annotation by setting it to null
      const [affectedRows] = await models.Image.update(
         {
            textAnnotation: null,
         },
         {
            where: { id: id },
         }
      );

      if (affectedRows === 0) {
         return NextResponse.json(
            { error: "Failed to remove text annotation" },
            { status: 500 }
         );
      }

      // Fetch updated image
      const updatedImage = await models.Image.findByPk(id, {
         attributes: ["id", "updatedAt"],
      });

      return NextResponse.json(
         {
            success: true,
            message: "Text annotation removed successfully",
            data: {
               id: updatedImage?.id,
               updatedAt: updatedImage?.updatedAt,
            },
         },
         { status: 200 }
      );
   } catch (error: any) {
      console.error("Error removing text annotation:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
