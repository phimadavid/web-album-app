import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/backend/utils/authOption';
import Order from '@/backend/db/models/order';
import Cart from '@/backend/db/models/cart';
import Album from '@/backend/db/models/album';
import { PricingService } from '@/backend/services/pricing.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const body = await request.json();
    const { customerInfo, shippingAddress, paymentMethod, notes } = body;

    // Validate required fields
    if (!customerInfo || !shippingAddress || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get cart items
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Album,
          as: 'album',
        },
      ],
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
      0
    );
    const shippingTotal = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.shippingPrice.toString()),
      0
    );
    const tax = 0; // TODO: Calculate tax if needed
    const total = subtotal + shippingTotal + tax;

    // Prepare order items
    const orderItems = cartItems.map((item: any) => ({
      id: item.id,
      albumId: item.albumId,
      albumName: item.album?.name || 'Unknown Album',
      quantity: item.quantity,
      bookFormat: item.bookFormat,
      coverType: item.coverType,
      pageCount: item.pageCount,
      shippingOption: item.shippingOption,
      unitPrice: parseFloat(item.price.toString()),
      shippingPrice: parseFloat(item.shippingPrice.toString()),
      totalPrice: parseFloat(item.totalPrice.toString()),
      customizations: item.customizations,
      format: PricingService.getBookFormat(item.bookFormat),
      shippingDetails: PricingService.getShippingOption(item.shippingOption),
    }));

    // Calculate estimated delivery date (use the longest shipping time)
    const shippingTimes = cartItems.map((item) => {
      const shippingOption = PricingService.getShippingOption(
        item.shippingOption
      );
      return shippingOption ? shippingOption.estimatedDays : 7;
    });
    const maxShippingTime = Math.max(...shippingTimes);
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + maxShippingTime);

    // Create order
    const order = await Order.create({
      userId,
      orderNumber: PricingService.generateOrderNumber(),
      status: 'pending',
      items: orderItems,
      subtotal,
      shippingTotal,
      tax,
      total,
      customerInfo,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      notes,
      estimatedDelivery,
    });

    // Clear the cart
    await Cart.destroy({
      where: { userId },
    });

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
