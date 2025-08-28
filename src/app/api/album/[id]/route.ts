import Album from "@/backend/db/models/album";
import { NextResponse } from "next/server";

export async function PATCH(
   request: Request,
   { params }: { params: { id: string } }
) {
   try {
      const data = await request.json();
      const album = await Album.findByPk(params.id);

      if (!album) {
         return NextResponse.json(
            { error: "Album not found" },
            { status: 404 }
         );
      }

      await album.update(data);
      return NextResponse.json(album);
   } catch (error) {
      console.error("Update album error:", error);
      return NextResponse.json(
         { error: "Failed to update album" },
         { status: 500 }
      );
   }
}

export async function GET(
   request: Request,
   { params }: { params: { id: string } }
) {
   try {
      const album = await Album.findByPk(params.id);

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
