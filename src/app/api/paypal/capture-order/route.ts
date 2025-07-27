import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/backend/utils/authOption';
import Order from '@/backend/db/models/order';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

const PAYPAL_BASE_URL = PAYPAL_ENVIRONMENT === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderID, orderData } = body;

    if (!orderID) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal order
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal order capture failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to capture PayPal order' },
        { status: 500 }
      );
    }

    const captureData = await response.json();
    
    // Check if payment was successful
    if (captureData.status === 'COMPLETED') {
      // Create order in database if orderData is provided
      if (orderData) {
        const userId = (session.user as any).id;
        
        const order = await Order.create({
          userId,
          orderNumber: `PP-${Date.now()}`,
          status: 'processing',
          items: orderData.items || [],
          subtotal: orderData.subtotal || 0,
          shippingTotal: orderData.shipping || 0,
          tax: orderData.tax || 0,
          total: orderData.total || 0,
          customerInfo: orderData.customerInfo || {},
          shippingAddress: orderData.shippingAddress || {},
          paymentMethod: 'paypal',
          paymentStatus: 'paid',
          notes: orderData.notes || '',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        return NextResponse.json({
          success: true,
          captureData,
          order,
        });
      }

      return NextResponse.json({
        success: true,
        captureData,
      });
    } else {
      return NextResponse.json(
        { error: 'Payment was not completed' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for PayPal return URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const PayerID = searchParams.get('PayerID');

  if (token && PayerID) {
    // Redirect to success page with order details
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/success?paypal_token=${token}&payer_id=${PayerID}`);
  }

  // Redirect to checkout if parameters are missing
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/checkout`);
}
