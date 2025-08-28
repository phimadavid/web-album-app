import Album from "@/backend/db/models/album";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
   const data = await request.json();
   try {
      const album = await Album.create(data);
      return NextResponse.json(album);
   } catch (error) {
      return NextResponse.json(
         { error: "Failed to create album" },
         { status: 500 }
      );
   }
}
