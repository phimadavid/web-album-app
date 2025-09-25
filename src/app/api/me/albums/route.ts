import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/backend/utils/authOption";
import CreateAlbum from "@/backend/db/models/createalbum";
import Album from "@/backend/db/models/album";
import { CreateAlbumTypes } from "@/backend/types/album";

export async function POST(request: Request) {
   try {
      const session = await getServerSession(options);

      if (!session || !session.user) {
         return NextResponse.json(
            { error: "Unauthorized - Please login" },
            { status: 401 }
         );
      }

      const body = await request.json();
      // Create basic album first
      const albumData = {
         name: body.name,
         termsAccepted: body.termsAccepted || false,
         status: body.status || "draft",
         userId: (session.user as any).id,
      };

      const album = await Album.create(albumData);

      // If detailed album specifications are provided, create the detailed album
      if (body.format && body.dimensions && body.pages) {
         const detailedAlbumData: CreateAlbumTypes = {
            albumId: album.id,
            format: body.format,
            dimensions: body.dimensions,
            coverType: body.coverType || "hard",
            paperQuality: body.paperQuality || "matte",
            pages: body.pages || 24,
         };

         await CreateAlbum.create(detailedAlbumData);
      }

      return NextResponse.json({
         success: true,
         data: album,
         message: "Album created successfully",
      });
   } catch (error) {
      console.error("Server error creating user album:", error);

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

export async function GET(request: Request) {
   try {
      const session = await getServerSession(options);

      if (!session || !session.user) {
         return NextResponse.json(
            { error: "Unauthorized - Please login" },
            { status: 401 }
         );
      }

      // Get all albums for the current user
      const albums = await Album.findAll({
         where: {
            userId: (session.user as any).id,
         },
         order: [["createdAt", "DESC"]],
      });

      return NextResponse.json({
         success: true,
         data: albums,
      });
   } catch (error) {
      console.error("Server error fetching user albums:", error);
      return NextResponse.json(
         { error: "Failed to fetch albums" },
         { status: 500 }
      );
   }
}
