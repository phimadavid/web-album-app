import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options as authOptions } from "@/backend/utils/authOption";
import AiArtCart from "@/backend/db/models/aiArtCart";

// Import the models to ensure associations are loaded
import "@/backend/db/models/associations";

export async function PUT(
   request: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = (session.user as any).id;
      const itemId = params.id;

      const body = await request.json();
      const { quantity } = body;

      if (!quantity || quantity < 1) {
         return NextResponse.json(
            { error: "Invalid quantity" },
            { status: 400 }
         );
      }

      // Find the cart item
      const cartItem = await AiArtCart.findOne({
         where: {
            id: itemId,
            userId,
         },
      });

      if (!cartItem) {
         return NextResponse.json(
            { error: "Cart item not found" },
            { status: 404 }
         );
      }

      // Update quantity and recalculate total price
      cartItem.quantity = quantity;
      cartItem.totalPrice = parseFloat(cartItem.price.toString()) * quantity;

      await cartItem.save();

      return NextResponse.json({
         message: "Cart item updated",
         item: cartItem,
      });
   } catch (error) {
      console.error("Error updating AI art cart item:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

export async function DELETE(
   request: NextRequest,
   { params }: { params: { id: string } }
) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = (session.user as any).id;
      const itemId = params.id;

      // Find and delete the cart item
      const deletedCount = await AiArtCart.destroy({
         where: {
            id: itemId,
            userId,
         },
      });

      if (deletedCount === 0) {
         return NextResponse.json(
            { error: "Cart item not found" },
            { status: 404 }
         );
      }

      return NextResponse.json({
         message: "Cart item removed",
      });
   } catch (error) {
      console.error("Error removing AI art cart item:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
