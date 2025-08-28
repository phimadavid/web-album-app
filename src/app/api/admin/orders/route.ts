import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options as authOptions } from "@/backend/utils/authOption";
import Order from "@/backend/db/models/order";
import User from "@/backend/db/models/user";

import "@/backend/db/models/associations";

export async function GET(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user is admin
      const userId = (session.user as any).id;
      const user = await User.findByPk(userId);

      if (!user || user.role !== "admin") {
         return NextResponse.json(
            { error: "Forbidden - Admin access required" },
            { status: 403 }
         );
      }

      // Get all orders for admin
      const orders = await Order.findAll({
         include: [
            {
               model: User,
               as: "user",
               attributes: ["id", "name", "email"],
            },
         ],
         order: [["createdAt", "DESC"]],
      });

      // Transform orders to include user info in customerInfo if not already present
      const transformedOrders = orders.map(order => {
         const orderData = order.toJSON() as any;
         const userInfo = orderData.user;

         // If customerInfo doesn't have firstName/lastName, try to get from user relation
         if (
            userInfo &&
            (!orderData.customerInfo.firstName ||
               !orderData.customerInfo.lastName)
         ) {
            // Split the name into firstName and lastName if available
            const nameParts = userInfo.name ? userInfo.name.split(" ") : [];
            const firstName = nameParts[0] || "Unknown";
            const lastName = nameParts.slice(1).join(" ") || "User";

            orderData.customerInfo = {
               ...orderData.customerInfo,
               firstName: orderData.customerInfo.firstName || firstName,
               lastName: orderData.customerInfo.lastName || lastName,
               email: orderData.customerInfo.email || userInfo.email,
            };
         }

         // Remove the user relation from response to keep it clean
         delete orderData.user;

         return orderData;
      });

      return NextResponse.json({
         orders: transformedOrders,
      });
   } catch (error) {
      console.error("Error fetching admin orders:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}

export async function PATCH(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user is admin
      const userId = (session.user as any).id;
      const user = await User.findByPk(userId);

      if (!user || user.role !== "admin") {
         return NextResponse.json(
            { error: "Forbidden - Admin access required" },
            { status: 403 }
         );
      }

      const body = await request.json();
      const { orderId, status, trackingNumber, notes } = body;

      if (!orderId) {
         return NextResponse.json(
            { error: "Order ID is required" },
            { status: 400 }
         );
      }

      const order = await Order.findByPk(orderId);
      if (!order) {
         return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
         );
      }

      // Update order fields
      const updateData: any = {};
      if (status) updateData.status = status;
      if (trackingNumber !== undefined)
         updateData.trackingNumber = trackingNumber;
      if (notes !== undefined) updateData.notes = notes;

      await order.update(updateData);

      return NextResponse.json({
         message: "Order updated successfully",
         order: order.toJSON(),
      });
   } catch (error) {
      console.error("Error updating order:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
