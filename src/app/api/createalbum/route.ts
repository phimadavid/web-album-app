import { NextResponse } from "next/server";
import CreateAlbum from "@/backend/db/models/createalbum";
import { CreateAlbumTypes } from "@/backend/types/album";

export async function POST(request: Request) {
   try {
      const body = await request.json();

      const requiredFields = {
         format: "Album format",
         dimensions: "Dimensions",
         coverType: "Cover type",
         paperQuality: "Paper quality",
         albumId: "Album ID",
         pages: "Pages",
      };

      for (const [field, label] of Object.entries(requiredFields)) {
         if (!body[field]) {
            return NextResponse.json(
               { error: `${label} is required` },
               { status: 400 }
            );
         }
      }

      const albumData: CreateAlbumTypes = {
         albumId: body.albumId,
         format: body.format,
         dimensions: body.dimensions,
         coverType: body.coverType,
         paperQuality: body.paperQuality,
         pages: body.pages,
      };

      const album = await CreateAlbum.create(albumData);

      return NextResponse.json({
         success: true,
         data: album,
      });
   } catch (error) {
      console.error("Server error creating album:", error);
      if (
         error instanceof Error &&
         (error as any).name === "SequelizeValidationError"
      ) {
         const validationErrors = (error as any).errors.map(
            (err: any) => err.message
         );
         return NextResponse.json(
            { error: "Validation error", details: validationErrors },
            { status: 400 }
         );
      }
      return NextResponse.json(
         { error: "Failed to create album" },
         { status: 500 }
      );
   }
}
