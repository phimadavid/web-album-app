import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options as authOptions } from "@/backend/utils/authOption";
import User from "@/backend/db/models/user";

export async function GET(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await User.findOne({
         where: { email: session.user.email },
         attributes: ["album_formats"],
      });

      if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
         album_formats: user.album_formats || null,
      });
   } catch (error) {
      console.error("Error fetching album formats:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

export async function PUT(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { album_formats } = await request.json();

      const user = await User.findOne({
         where: { email: session.user.email },
      });

      if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      await user.update({ album_formats });

      return NextResponse.json({
         message: "Album formats updated successfully",
         album_formats: user.album_formats,
      });
   } catch (error) {
      console.error("Error updating album formats:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
