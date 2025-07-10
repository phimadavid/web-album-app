import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { options as authOptions } from '@/backend/utils/authOption';
import Cart from '@/backend/db/models/cart';
import { PricingService } from '@/backend/services/pricing.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const cartItemId = params.id;

    const body = await request.json();
    const {
      quantity,
      bookFormat,
      coverType,
      pageCount,
      shippingOption,
      customizations,
    } = body;

    // Find the cart item
    const cartItem = await Cart.findOne({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be greater than 0' },
          { status: 400 }
        );
      }
      cartItem.quantity = quantity;
    }

    if (bookFormat !== undefined) {
      cartItem.bookFormat = bookFormat;
    }

    if (coverType !== undefined) {
      cartItem.coverType = coverType;
    }

    if (pageCount !== undefined) {
      cartItem.pageCount = pageCount;
    }

    if (shippingOption !== undefined) {
      cartItem.shippingOption = shippingOption;
    }

    if (customizations !== undefined) {
      cartItem.customizations = customizations;
    }

    // Validate book configuration
    if (
      !PricingService.validateBookConfiguration(
        cartItem.bookFormat,
        cartItem.coverType
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid book configuration' },
        { status: 400 }
      );
    }

    // Recalculate pricing
    const pricing = PricingService.calculateTotalPrice(
      cartItem.bookFormat,
      cartItem.coverType,
      cartItem.pageCount,
      cartItem.shippingOption,
      cartItem.quantity,
      false // TODO: Check if user has promotional pricing
    );

    cartItem.price = pricing.bookPrice;
    cartItem.shippingPrice = pricing.shippingPrice;
    cartItem.totalPrice = pricing.total;

    await cartItem.save();

    return NextResponse.json({
      message: 'Cart item updated',
      item: cartItem,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const cartItemId = params.id;

    // Find and delete the cart item
    const deleted = await Cart.destroy({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (deleted === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Cart item removed' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
