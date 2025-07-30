"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Package,
    Truck,
    X,
    CreditCard,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface CartItem {
    id: string;
    albumId: string;
    quantity: number;
    bookFormat: string;
    coverType: 'softcover' | 'hardcover' | 'dutch';
    pageCount: number;
    shippingOption: string;
    price: number;
    shippingPrice: number;
    totalPrice: number;
    customizations: Record<string, any>;
    album?: {
        id: string;
        name: string;
    };
    format?: {
        id: string;
        title: string;
        dimensions: string;
    };
    shippingDetails?: {
        id: string;
        title: string;
        description: string;
        estimatedDays: number;
    };
}

interface CartProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, onCheckout }) => {
    const router = useRouter();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        if (isOpen) {
            fetchCart();
        }
    }, [isOpen]);

    const fetchCart = async () => {
        try {
            setIsLoading(true);

            // Fetch both regular cart and AI art cart
            const [cartResponse, aiCartResponse] = await Promise.all([
                fetch('/api/cart'),
                fetch('/api/me/ai-art-cart')
            ]);

            let allItems: CartItem[] = [];
            let totalAmount = 0;
            let totalItems = 0;

            // Process regular cart items
            if (cartResponse.ok) {
                const cartData = await cartResponse.json();
                allItems = [...allItems, ...(cartData.items || [])];
                totalAmount += cartData.totalAmount || 0;
                totalItems += cartData.totalItems || 0;
            }

            // Process AI art cart items
            if (aiCartResponse.ok) {
                const aiCartData = await aiCartResponse.json();
                // Transform AI art items to match CartItem interface
                const aiItems = (aiCartData.items || []).map((item: any) => ({
                    id: item.id,
                    albumId: item.aiArtId || item.id, // Use aiArtId or fallback to id
                    quantity: item.quantity,
                    bookFormat: 'ai-art', // Special format for AI art
                    coverType: item.productType as 'softcover' | 'hardcover' | 'dutch',
                    pageCount: 1, // AI art is single item
                    shippingOption: 'standard',
                    price: item.price,
                    shippingPrice: 0, // AI art might not have separate shipping
                    totalPrice: item.totalPrice,
                    customizations: {
                        prompt: item.prompt,
                        style: item.style,
                        productType: item.productType,
                        size: item.size,
                        dimensions: item.dimensions,
                        imageUrl: item.imageUrl
                    },
                    album: {
                        id: item.aiArtId || item.id,
                        name: `AI Art: ${item.prompt?.substring(0, 30)}...` || 'AI Generated Art'
                    },
                    format: {
                        id: 'ai-art',
                        title: `${item.productType} - ${item.size}`,
                        dimensions: item.dimensions
                    },
                    shippingDetails: {
                        id: 'standard',
                        title: 'Standard Shipping',
                        description: 'Standard delivery',
                        estimatedDays: 7
                    }
                }));

                allItems = [...allItems, ...aiItems];
                totalAmount += aiCartData.totalAmount || 0;
                totalItems += aiCartData.totalItems || 0;
            }

            setItems(allItems);
            setTotalAmount(totalAmount);
            setTotalItems(totalItems);

            if (!cartResponse.ok && !aiCartResponse.ok) {
                toast.error('Failed to fetch cart');
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            toast.error('Error loading cart');
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            await removeItem(itemId);
            return;
        }

        try {
            // Find the item to determine which cart it belongs to
            const item = items.find(i => i.id === itemId);
            const isAiArt = item?.bookFormat === 'ai-art';

            const endpoint = isAiArt ? `/api/me/ai-art-cart/${itemId}` : `/api/cart/${itemId}`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity: newQuantity }),
            });

            if (response.ok) {
                await fetchCart();
                // Emit cart update event for header to listen
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                toast.success('Item updated');
            } else {
                toast.error('Failed to update item');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error('Error updating item');
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            // Find the item to determine which cart it belongs to
            const item = items.find(i => i.id === itemId);
            const isAiArt = item?.bookFormat === 'ai-art';

            const endpoint = isAiArt ? `/api/me/ai-art-cart/${itemId}` : `/api/cart/${itemId}`;

            const response = await fetch(endpoint, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchCart();
                // Emit cart update event for header to listen
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                toast.success('Item removed from cart');
            } else {
                toast.error('Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Error removing item');
        }
    };

    const clearCart = async () => {
        try {
            // Clear both regular cart and AI art cart
            const [cartResponse, aiCartResponse] = await Promise.all([
                fetch('/api/cart', { method: 'DELETE' }),
                fetch('/api/me/ai-art-cart', { method: 'DELETE' })
            ]);

            if (cartResponse.ok || aiCartResponse.ok) {
                setItems([]);
                setTotalAmount(0);
                setTotalItems(0);
                // Emit cart update event for header to listen
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                toast.success('Cart cleared');
            } else {
                toast.error('Failed to clear cart');
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Error clearing cart');
        }
    };

    const formatPrice = (price: number) => {
        return `₪${price.toFixed(2)}`;
    };

    const getCoverTypeDisplay = (coverType: string) => {
        switch (coverType) {
            case 'softcover':
                return 'Softcover';
            case 'hardcover':
                return 'Hardcover';
            case 'dutch':
                return 'Dutch Book';
            default:
                return coverType;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-[9999]">
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white h-full w-full max-w-md shadow-xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <ShoppingCart size={24} />
                        <h2 className="text-lg font-semibold">Your Cart</h2>
                        {totalItems > 0 && (
                            <span className="bg-blue-800 text-white rounded-full px-2 py-1 text-xs">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <ShoppingCart size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <p className="text-sm">Add some albums to get started</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {items.map((item) => (
                                <Card key={item.id} className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {item.album?.name || 'Unknown Album'}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {item.format?.title} ({item.format?.dimensions})
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {item.bookFormat === 'ai-art'
                                                    ? `${item.customizations?.productType} • ${item.customizations?.size}`
                                                    : `${getCoverTypeDisplay(item.coverType)} • ${item.pageCount} pages`
                                                }
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                                            <p className="text-sm text-gray-600">
                                                {formatPrice(item.price)} × {item.quantity}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                                        <Truck size={16} />
                                        <span>{item.shippingDetails?.title}</span>
                                        <span>•</span>
                                        <span>{formatPrice(item.shippingPrice)}</span>
                                    </div>
                                </Card>
                            ))}

                            {/* Clear Cart Button */}
                            {items.length > 0 && (
                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={clearCart}
                                        variant="outline"
                                        className="w-full text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                        Clear Cart
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Total:</span>
                            <span className="text-xl font-bold text-blue-600">
                                {formatPrice(totalAmount)}
                            </span>
                        </div>
                        <Button
                            onClick={() => {
                                onClose();
                                router.push('/checkout');
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Proceed to Checkout
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Cart;
