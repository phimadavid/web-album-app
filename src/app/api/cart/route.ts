import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/backend/utils/authOption';
import Cart from '@/backend/db/models/cart';
import Album from '@/backend/db/models/album';
import User from '@/backend/db/models/user';
import { PricingService } from '@/backend/services/pricing.service';

// Import the models to ensure associations are loaded
import '@/backend/db/models/associations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Album,
          as: 'album',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const cartWithDetails = cartItems.map((item: any) => ({
      ...item.toJSON(),
      format: PricingService.getBookFormat(item.bookFormat),
      shippingDetails: PricingService.getShippingOption(item.shippingOption),
    }));

    return NextResponse.json({
      items: cartWithDetails,
      totalItems: cartItems.length,
      totalAmount: cartItems.reduce(
        (sum, item) => sum + parseFloat(item.totalPrice.toString()),
        0
      ),
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
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
    const {
      albumId,
      bookFormat,
      coverType,
      pageCount = 24,
      shippingOption,
      quantity = 1,
      customizations = {},
    } = body;

    // Validate required fields
    if (!albumId || !bookFormat || !coverType || !shippingOption) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate book format and cover type combination
    if (!PricingService.validateBookConfiguration(bookFormat, coverType)) {
      return NextResponse.json(
        { error: 'Invalid book configuration' },
        { status: 400 }
      );
    }

    // Check if album exists (we'll verify ownership through a separate query if needed)
    const album = await Album.findOne({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // For now, we'll allow any authenticated user to add albums to cart
    // In a real app, you might want to check if the user owns the album
    // by checking a separate UserAlbum table or adding a userId field to Album

    // Check if item already exists in cart
    const existingItem = await Cart.findOne({
      where: {
        userId,
        albumId,
        bookFormat,
        coverType,
        pageCount,
        shippingOption,
      },
    });

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;

      // Recalculate prices
      const pricing = PricingService.calculateTotalPrice(
        bookFormat,
        coverType,
        pageCount,
        shippingOption,
        existingItem.quantity,
        false // TODO: Check if user has promotional pricing
      );

      existingItem.price = pricing.bookPrice;
      existingItem.shippingPrice = pricing.shippingPrice;
      existingItem.totalPrice = pricing.total;

      await existingItem.save();

      return NextResponse.json({
        message: 'Item updated in cart',
        item: existingItem,
      });
    }

    // Calculate pricing
    const pricing = PricingService.calculateTotalPrice(
      bookFormat,
      coverType,
      pageCount,
      shippingOption,
      quantity,
      false // TODO: Check if user has promotional pricing
    );

    // Create new cart item
    const cartItem = await Cart.create({
      userId,
      albumId,
      quantity,
      bookFormat,
      coverType,
      pageCount,
      shippingOption,
      price: pricing.bookPrice,
      shippingPrice: pricing.shippingPrice,
      totalPrice: pricing.total,
      customizations,
    });

    return NextResponse.json(
      {
        message: 'Item added to cart',
        item: cartItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Clear entire cart
    await Cart.destroy({
      where: { userId },
    });

    return NextResponse.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
