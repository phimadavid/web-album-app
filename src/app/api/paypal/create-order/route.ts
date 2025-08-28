import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options as authOptions } from "@/backend/utils/authOption";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || "sandbox";

const PAYPAL_BASE_URL =
   PAYPAL_ENVIRONMENT === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
   const auth = Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
   ).toString("base64");

   const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
         Authorization: `Basic ${auth}`,
         "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
   });

   if (!response.ok) {
      throw new Error("Failed to get PayPal access token");
   }

   const data = await response.json();
   return data.access_token;
}

export async function POST(request: NextRequest) {
   try {
      const session = await getServerSession(authOptions);
      if (!session?.user || !(session.user as any).id) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      const { amount, currency = "USD", items = [] } = body;

      if (!amount || amount <= 0) {
         return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      const accessToken = await getPayPalAccessToken();

      // Create PayPal order
      const orderData = {
         intent: "CAPTURE",
         purchase_units: [
            {
               amount: {
                  currency_code: currency,
                  value: amount.toFixed(2),
                  breakdown: {
                     item_total: {
                        currency_code: currency,
                        value: (amount - 24.99).toFixed(2), // Subtract shipping
                     },
                     shipping: {
                        currency_code: currency,
                        value: "24.99",
                     },
                  },
               },
               items: items.map((item: any) => ({
                  name: item.name || "Photo Album",
                  unit_amount: {
                     currency_code: currency,
                     value: item.price.toFixed(2),
                  },
                  quantity: item.quantity.toString(),
                  category: "PHYSICAL_GOODS",
               })),
               shipping: {
                  method: "Standard Shipping",
                  address: {
                     address_line_1: "123 Main St",
                     admin_area_2: "San Jose",
                     admin_area_1: "CA",
                     postal_code: "95131",
                     country_code: "US",
                  },
               },
            },
         ],
         application_context: {
            return_url: `${process.env.NEXTAUTH_URL}/api/paypal/capture-order`,
            cancel_url: `${process.env.NEXTAUTH_URL}/checkout`,
            shipping_preference: "GET_FROM_FILE",
            user_action: "PAY_NOW",
            brand_name: "Photo Album Store",
         },
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "PayPal-Request-Id": `${Date.now()}-${Math.random()}`,
         },
         body: JSON.stringify(orderData),
      });

      if (!response.ok) {
         const errorData = await response.json();
         console.error("PayPal order creation failed:", errorData);
         return NextResponse.json(
            { error: "Failed to create PayPal order" },
            { status: 500 }
         );
      }

      const order = await response.json();
      return NextResponse.json({ orderID: order.id });
   } catch (error) {
      console.error("Error creating PayPal order:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
