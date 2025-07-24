"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    ShieldCheck,
    Plus,
    Lock,
    MapPin,
    Package,
    Truck,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'react-toastify';
import Link from 'next/link';
import Image from 'next/image';
import { withAuth } from '@/backend/withAuth';
import FullScreenLoader from '@/app/components/fullscreen.loader';

interface CartItem {
    id: string;
    albumId: string;
    quantity: number;
    bookFormat: string;
    coverType: 'softcover' | 'hardcover' | 'dutch';
    pageCount: number;
    price: number;
    shippingPrice: number;
    totalPrice: number;
    album?: {
        id: string;
        name: string;
    };
    format?: {
        id: string;
        title: string;
        dimensions: string;
    };
    customizations?: Record<string, any>;
}

interface ShippingAddress {
    id?: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
}

const CheckoutPage: React.FC = () => {
    // Authentication
    const { isLoading: authLoading, isAuthenticated, hasValidRole, user } = withAuth({
        role: 'user',
        redirectTo: '/signin',
    });

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [subtotal, setSubtotal] = useState(0);
    const [shipping, setShipping] = useState(24.99);
    const [total, setTotal] = useState(0);

    // Form states
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        phone: ''
    });

    const [paymentData, setPaymentData] = useState({
        cardNumber: '',
        expirationDate: '',
        cvv: '',
        saveCard: false,
        giftCardCode: '',
        useGiftCard: false
    });

    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Only fetch cart data if user is authenticated
        if (isAuthenticated && hasValidRole) {
            fetchCartData();
        }
    }, [isAuthenticated, hasValidRole]);

    // Redirect unauthenticated users
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            window.location.href = '/signin';
        }
    }, [authLoading, isAuthenticated]);

    const fetchCartData = async () => {
        try {
            setIsLoading(true);

            // Fetch both regular cart and AI art cart
            const [cartResponse, aiCartResponse] = await Promise.all([
                fetch('/api/cart'),
                fetch('/api/me/ai-art-cart')
            ]);

            let allItems: CartItem[] = [];
            let subtotalAmount = 0;

            // Process regular cart items
            if (cartResponse.ok) {
                const cartData = await cartResponse.json();
                allItems = [...allItems, ...(cartData.items || [])];
                subtotalAmount += cartData.items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
            }

            // Process AI art cart items
            if (aiCartResponse.ok) {
                const aiCartData = await aiCartResponse.json();
                const aiItems = (aiCartData.items || []).map((item: any) => ({
                    id: item.id,
                    albumId: item.aiArtId || item.id,
                    quantity: item.quantity,
                    bookFormat: 'ai-art',
                    coverType: item.productType as 'softcover' | 'hardcover' | 'dutch',
                    pageCount: 1,
                    price: item.price,
                    shippingPrice: 0,
                    totalPrice: item.totalPrice,
                    album: {
                        id: item.aiArtId || item.id,
                        name: `AI Art: ${item.prompt?.substring(0, 30)}...` || 'AI Generated Art'
                    },
                    format: {
                        id: 'ai-art',
                        title: `${item.productType} - ${item.size}`,
                        dimensions: item.dimensions
                    },
                    customizations: {
                        prompt: item.prompt,
                        style: item.style,
                        productType: item.productType,
                        size: item.size,
                        dimensions: item.dimensions,
                        imageUrl: item.imageUrl
                    }
                }));

                allItems = [...allItems, ...aiItems];
                subtotalAmount += aiCartData.items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
            }

            setCartItems(allItems);
            setSubtotal(subtotalAmount);
            setTotal(subtotalAmount + shipping);

        } catch (error) {
            console.error('Error fetching cart:', error);
            toast.error('Error loading cart data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (section: 'shipping' | 'payment', field: string, value: string | boolean) => {
        if (section === 'shipping') {
            setShippingAddress(prev => ({ ...prev, [field]: value }));
        } else {
            setPaymentData(prev => ({ ...prev, [field]: value }));
        }
    };

    const formatCardNumber = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        // Add spaces every 4 digits
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    const formatExpirationDate = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        // Add slash after MM
        if (digits.length >= 2) {
            return digits.substring(0, 2) + (digits.length > 2 ? ' / ' + digits.substring(2, 4) : '');
        }
        return digits;
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value);
        if (formatted.length <= 19) { // 16 digits + 3 spaces
            handleInputChange('payment', 'cardNumber', formatted);
        }
    };

    const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatExpirationDate(e.target.value);
        if (formatted.length <= 7) { // MM / YY
            handleInputChange('payment', 'expirationDate', formatted);
        }
    };

    const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 4) {
            handleInputChange('payment', 'cvv', value);
        }
    };

    const handleSubmit = async (paymentMethod: 'card' | 'paypal') => {
        setIsProcessing(true);

        try {
            // Validate form data
            if (paymentMethod === 'card') {
                if (!paymentData.cardNumber || !paymentData.expirationDate || !paymentData.cvv) {
                    toast.error('Please fill in all payment details');
                    return;
                }
            }

            // Create order
            const orderData = {
                cartItems,
                shippingAddress,
                paymentMethod,
                paymentData: paymentMethod === 'card' ? paymentData : null,
                subtotal,
                shipping,
                total
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                const order = await response.json();
                toast.success('Order placed successfully!');
                // Redirect to success page
                window.location.href = `/success/${order.id}`;
            } else {
                toast.error('Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error('Error placing order');
        } finally {
            setIsProcessing(false);
        }
    };

    const getCoverTypeDisplay = (coverType: string) => {
        switch (coverType) {
            case 'softcover': return 'Softcover';
            case 'hardcover': return 'Hardcover';
            case 'dutch': return 'Dutch Book';
            default: return coverType;
        }
    };

    // Show loading while checking authentication or loading cart data
    if (authLoading || isLoading) {
        return <FullScreenLoader />;
    }

    // Don't render anything if not authenticated (redirect will handle this)
    if (!isAuthenticated || !hasValidRole) {
        return null;
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Add some items to proceed to checkout</p>
                    <Link href="/">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/me/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Shopping
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Shipping & Payment */}
                    <div className="space-y-8">
                        {/* Shipping Information */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">SHIPPING INFORMATION</h2>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 uppercase tracking-wide">SHIPPING ADDRESS</span>
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        Add New
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={shippingAddress.firstName}
                                        onChange={(e) => handleInputChange('shipping', 'firstName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={shippingAddress.lastName}
                                        onChange={(e) => handleInputChange('shipping', 'lastName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Address"
                                        value={shippingAddress.address}
                                        onChange={(e) => handleInputChange('shipping', 'address', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={shippingAddress.city}
                                        onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={shippingAddress.state}
                                        onChange={(e) => handleInputChange('shipping', 'state', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="ZIP Code"
                                        value={shippingAddress.zipCode}
                                        onChange={(e) => handleInputChange('shipping', 'zipCode', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Phone (Optional)"
                                        value={shippingAddress.phone}
                                        onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Payment Details */}
                        <Card className="p-6">
                            <div className="flex items-center mb-6">
                                <Lock size={20} className="text-gray-600 mr-2" />
                                <h2 className="text-xl font-semibold text-gray-900">PAYMENT DETAILS (SECURE)</h2>
                            </div>

                            {/* Gift Card */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-600 uppercase tracking-wide">GIFT CARD CODE</span>
                                    <button
                                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                        onClick={() => handleInputChange('payment', 'useGiftCard', !paymentData.useGiftCard)}
                                    >
                                        Use Gift Card
                                    </button>
                                </div>
                                {paymentData.useGiftCard && (
                                    <input
                                        type="text"
                                        placeholder="Enter gift card code"
                                        value={paymentData.giftCardCode}
                                        onChange={(e) => handleInputChange('payment', 'giftCardCode', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>

                            {/* Credit Card */}
                            <div className="mb-6">
                                <span className="text-sm text-gray-600 uppercase tracking-wide">CREDIT CARD</span>
                                <div className="mt-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            value={paymentData.cardNumber}
                                            onChange={handleCardNumberChange}
                                            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">
                                                VISA
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <span className="text-sm text-gray-600 uppercase tracking-wide">EXPIRATION DATE *</span>
                                    <input
                                        type="text"
                                        placeholder="MM / YY"
                                        value={paymentData.expirationDate}
                                        onChange={handleExpirationChange}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                                    />
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 uppercase tracking-wide">CVV *</span>
                                    <input
                                        type="text"
                                        placeholder="123"
                                        value={paymentData.cvv}
                                        onChange={handleCvvChange}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="saveCard"
                                    checked={paymentData.saveCard}
                                    onChange={(e) => handleInputChange('payment', 'saveCard', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="saveCard" className="ml-2 text-sm text-gray-900">
                                    Save this card for future orders
                                </label>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                            {/* Order Items */}
                            <div className="space-y-4 mb-6">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-start space-x-4 p-3 bg-white rounded-lg border border-gray-100">
                                        <div className="w-20 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center relative">
                                            {item.customizations?.imageUrl ? (
                                                <Image
                                                    src={item.customizations.imageUrl}
                                                    alt="Product"
                                                    width={80}
                                                    height={64}
                                                    className="object-cover rounded-md"
                                                />
                                            ) : (
                                                <Package size={24} className="text-gray-400" />
                                            )}
                                            {item.bookFormat === 'ai-art' && (
                                                <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                                    AI
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {item.bookFormat === 'ai-art' ? 'AI Generated Art Print' : item.album?.name}
                                                </h3>
                                                {item.bookFormat === 'ai-art' && (
                                                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                        AI ART
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {item.bookFormat === 'ai-art'
                                                    ? `${item.format?.title || 'Custom Size'}`
                                                    : `${item.format?.title}`
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {item.bookFormat === 'ai-art'
                                                    ? `${getCoverTypeDisplay(item.coverType)} Print`
                                                    : `${getCoverTypeDisplay(item.coverType)}, ${item.pageCount} pages`
                                                }
                                            </p>
                                            {item.bookFormat === 'ai-art' && item.customizations?.prompt && (
                                                <p className="text-xs text-purple-600 italic mt-1">
                                                    "{item.customizations.prompt.substring(0, 50)}..."
                                                </p>
                                            )}
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Price Summary */}
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-semibold">${shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Buttons */}
                            <div className="mt-6 space-y-3">
                                <Button
                                    onClick={() => handleSubmit('card')}
                                    disabled={isProcessing}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg font-semibold"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </div>
                                    ) : (
                                        'Pay with card'
                                    )}
                                </Button>

                                <Button
                                    onClick={() => handleSubmit('paypal')}
                                    disabled={isProcessing}
                                    className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg font-semibold"
                                >
                                    PayPal
                                </Button>

                                <div className="text-center text-sm text-gray-600">
                                    <div className="flex items-center justify-center space-x-1">
                                        <span className="text-blue-600 font-semibold">PayPal</span>
                                        <span>Pay in 4 interest-free payments of $26.04.</span>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800 underline">
                                        Learn more
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
