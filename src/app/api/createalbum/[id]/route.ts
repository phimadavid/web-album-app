import CreateAlbum from "@/backend/db/models/createalbum";
import { NextResponse } from "next/server";

export async function GET(
   request: Request,
   { params }: { params: { id: string } }
) {
   try {
      const albumId = params.id;
      const album = await CreateAlbum.findOne({
         where: { albumId },
      });

      if (!album) {
         return NextResponse.json(
            { error: "Album not found" },
            { status: 404 }
         );
      }

      return NextResponse.json(album);
   } catch (error) {
      console.error("Get album error:", error);
      return NextResponse.json(
         { error: "Failed to fetch album" },
         { status: 500 }
      );
   }
}
