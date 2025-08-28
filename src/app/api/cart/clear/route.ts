import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options as authOptions } from "@/backend/utils/authOption";
import Cart from "@/backend/db/models/cart";
import AiArtCart from "@/backend/db/models/aiArtCart";

export async function POST(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = (session.user as any).id;

      // Clear regular cart
      await Cart.destroy({
         where: { userId },
      });

      // Clear AI art cart directly using the model
      try {
         await AiArtCart.destroy({
            where: { userId },
         });
      } catch (error) {
         console.log("AI cart clear failed, but continuing...", error);
      }

      return NextResponse.json({
         message: "Cart cleared successfully",
      });
   } catch (error) {
      console.error("Error clearing cart:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
