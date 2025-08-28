import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options as authOptions } from "@/backend/utils/authOption";
import AiArtCart from "@/backend/db/models/aiArtCart";

// Import the models to ensure associations are loaded
import "@/backend/db/models/associations";

export async function GET(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = (session.user as any).id;

      const cartItems = await AiArtCart.findAll({
         where: { userId },
         order: [["createdAt", "DESC"]],
      });

      return NextResponse.json({
         items: cartItems,
         totalItems: cartItems.length,
         totalAmount: cartItems.reduce(
            (sum, item) => sum + parseFloat(item.totalPrice.toString()),
            0
         ),
      });
   } catch (error) {
      console.error("Error fetching AI art cart:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

export async function POST(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = (session.user as any).id;

      const body = await request.json();
      const {
         aiArtId,
         imageUrl,
         prompt,
         style,
         productType,
         size,
         dimensions,
         price,
         quantity = 1,
      } = body;

      // Validate required fields
      if (
         !imageUrl ||
         !prompt ||
         !style ||
         !productType ||
         !size ||
         !dimensions ||
         !price
      ) {
         return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
         );
      }

      // Validate product type and size
      const validProductTypes = ["canvas", "glass", "aluminum"];
      const validSizes = ["small", "medium", "large", "xlarge", "xxlarge"];

      if (!validProductTypes.includes(productType)) {
         return NextResponse.json(
            { error: "Invalid product type" },
            { status: 400 }
         );
      }

      if (!validSizes.includes(size)) {
         return NextResponse.json({ error: "Invalid size" }, { status: 400 });
      }

      // Check if item already exists in cart
      const existingItem = await AiArtCart.findOne({
         where: {
            userId,
            imageUrl,
            productType,
            size,
         },
      });

      if (existingItem) {
         // Update quantity and total price
         existingItem.quantity += quantity;
         existingItem.totalPrice = parseFloat(price) * existingItem.quantity;

         await existingItem.save();

         const response = NextResponse.json({
            message: "Item updated in cart",
            item: existingItem,
         });

         // Add a custom header to trigger cart update on client side
         response.headers.set("X-Cart-Updated", "true");

         return response;
      }

      // Calculate total price
      const totalPrice = parseFloat(price) * quantity;

      // Create new cart item
      const cartItem = await AiArtCart.create({
         userId,
         aiArtId: aiArtId || null,
         imageUrl,
         prompt,
         style,
         quantity,
         productType,
         size,
         dimensions,
         price: parseFloat(price),
         totalPrice,
      });

      const response = NextResponse.json(
         {
            message: "Item added to cart",
            item: cartItem,
         },
         { status: 201 }
      );

      // Add a custom header to trigger cart update on client side
      response.headers.set("X-Cart-Updated", "true");

      return response;
   } catch (error) {
      console.error("Error adding to AI art cart:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

export async function DELETE(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = (session.user as any).id;

      // Clear entire AI art cart
      await AiArtCart.destroy({
         where: { userId },
      });

      return NextResponse.json({ message: "AI art cart cleared" });
   } catch (error) {
      console.error("Error clearing AI art cart:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
