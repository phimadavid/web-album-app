"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Package, Truck, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { PricingService } from '@/backend/services/pricing.service';

interface BookFormat {
    id: string;
    title: string;
    dimensions: string;
    softcover: number | null;
    hardcover: number | null;
    dutchBook: number;
}

interface ShippingOption {
    id: string;
    title: string;
    description: string;
    promotionalPrice: number;
    regularPrice: number;
    estimatedDays: number;
}

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    albumId: string;
    albumName: string;
    onAddToCart: (orderData: any) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({
    isOpen,
    onClose,
    albumId,
    albumName,
    onAddToCart
}) => {
    const [bookFormats, setBookFormats] = useState<BookFormat[]>([]);
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<string>('');
    const [selectedCoverType, setSelectedCoverType] = useState<'softcover' | 'hardcover' | 'dutch'>('hardcover');
    const [pageCount, setPageCount] = useState(24);
    const [selectedShipping, setSelectedShipping] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [pricing, setPricing] = useState({
        bookPrice: 0,
        shippingPrice: 0,
        subtotal: 0,
        total: 0,
    });

    useEffect(() => {
        if (isOpen) {
            // Load book formats and shipping options
            const formats = PricingService.getBookFormats();
            const shipping = PricingService.getShippingOptions();

            setBookFormats(formats);
            setShippingOptions(shipping);

            // Set default selections
            if (formats.length > 0) {
                setSelectedFormat(formats[0].id);
            }
            if (shipping.length > 0) {
                setSelectedShipping(shipping[0].id);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedFormat && selectedCoverType && selectedShipping) {
            calculatePricing();
        }
    }, [selectedFormat, selectedCoverType, pageCount, selectedShipping, quantity]);

    const calculatePricing = () => {
        try {
            const pricingData = PricingService.calculateTotalPrice(
                selectedFormat,
                selectedCoverType,
                pageCount,
                selectedShipping,
                quantity,
                false // TODO: Check if user has promotional pricing
            );
            setPricing(pricingData);
        } catch (error) {
            console.error('Error calculating pricing:', error);
            setPricing({ bookPrice: 0, shippingPrice: 0, subtotal: 0, total: 0 });
        }
    };

    const handleFormatChange = (formatId: string) => {
        setSelectedFormat(formatId);

        // Auto-adjust cover type if not available
        const format = bookFormats.find(f => f.id === formatId);
        if (format) {
            if (selectedCoverType === 'softcover' && format.softcover === null) {
                setSelectedCoverType('hardcover');
            }
        }
    };

    const handleCoverTypeChange = (coverType: 'softcover' | 'hardcover' | 'dutch') => {
        const format = bookFormats.find(f => f.id === selectedFormat);
        if (format) {
            if (coverType === 'softcover' && format.softcover === null) {
                toast.error('Softcover is not available for this format');
                return;
            }
            setSelectedCoverType(coverType);
        }
    };

    const handlePageCountChange = (increment: boolean) => {
        if (increment) {
            setPageCount(prev => prev + 2);
        } else {
            setPageCount(prev => Math.max(24, prev - 2));
        }
    };

    const handleAddToCart = async () => {
        if (!selectedFormat || !selectedCoverType || !selectedShipping) {
            toast.error('Please select all options');
            return;
        }

        const orderData = {
            albumId,
            bookFormat: selectedFormat,
            coverType: selectedCoverType,
            pageCount,
            shippingOption: selectedShipping,
            quantity,
            customizations: {},
        };

        try {
            setIsLoading(true);
            await onAddToCart(orderData);
            onClose();
            toast.success('Item added to cart!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add item to cart');
        } finally {
            setIsLoading(false);
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

    const getSelectedFormat = () => {
        return bookFormats.find(f => f.id === selectedFormat);
    };

    const getSelectedShipping = () => {
        return shippingOptions.find(s => s.id === selectedShipping);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Package size={24} />
                        <h2 className="text-lg font-semibold">Order Album Book</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {albumName}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Configure your album book options below
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Options */}
                        <div className="space-y-6">
                            {/* Book Format */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Book Format</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {bookFormats.map((format) => (
                                        <div
                                            key={format.id}
                                            onClick={() => handleFormatChange(format.id)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedFormat === format.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-sm">{format.title}</p>
                                                    <p className="text-xs text-gray-600">{format.dimensions}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">
                                                        {selectedCoverType === 'softcover'
                                                            ? format.softcover ? formatPrice(format.softcover) : 'N/A'
                                                            : selectedCoverType === 'hardcover'
                                                                ? formatPrice(format.hardcover || 0)
                                                                : formatPrice(format.dutchBook)
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cover Type */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Cover Type</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['softcover', 'hardcover', 'dutch'] as const).map((coverType) => {
                                        const format = getSelectedFormat();
                                        const isAvailable = coverType === 'softcover'
                                            ? format?.softcover !== null
                                            : coverType === 'hardcover'
                                                ? format?.hardcover !== null
                                                : true;

                                        return (
                                            <button
                                                key={coverType}
                                                onClick={() => handleCoverTypeChange(coverType)}
                                                disabled={!isAvailable}
                                                className={`p-3 border rounded-lg text-sm transition-colors ${selectedCoverType === coverType
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : isAvailable
                                                            ? 'border-gray-200 hover:border-gray-300'
                                                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {getCoverTypeDisplay(coverType)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Page Count */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Page Count</h4>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => handlePageCountChange(false)}
                                        disabled={pageCount <= 24}
                                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="font-medium text-lg w-16 text-center">
                                        {pageCount}
                                    </span>
                                    <button
                                        onClick={() => handlePageCountChange(true)}
                                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                    >
                                        +
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        pages (increments of 2)
                                    </span>
                                </div>
                            </div>

                            {/* Shipping Options */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Shipping Options</h4>
                                <div className="space-y-2">
                                    {shippingOptions.map((option) => (
                                        <div
                                            key={option.id}
                                            onClick={() => setSelectedShipping(option.id)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedShipping === option.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-sm">{option.title}</p>
                                                    <p className="text-xs text-gray-600">
                                                        {option.description} • {option.estimatedDays} days
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">
                                                        {formatPrice(option.regularPrice)}
                                                    </p>
                                                    {option.promotionalPrice < option.regularPrice && (
                                                        <p className="text-xs text-green-600">
                                                            Promo: {formatPrice(option.promotionalPrice)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Quantity</h4>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="font-medium text-lg w-16 text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Summary */}
                        <div>
                            <Card className="p-4 sticky top-0">
                                <h4 className="font-medium text-gray-900 mb-4">Order Summary</h4>

                                {selectedFormat && (
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span>Format:</span>
                                            <span>{getSelectedFormat()?.title}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Cover:</span>
                                            <span>{getCoverTypeDisplay(selectedCoverType)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Pages:</span>
                                            <span>{pageCount}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Shipping:</span>
                                            <span>{getSelectedShipping()?.title}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Quantity:</span>
                                            <span>{quantity}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Book Price:</span>
                                        <span>{formatPrice(pricing.bookPrice)} × {quantity}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal:</span>
                                        <span>{formatPrice(pricing.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Shipping:</span>
                                        <span>{formatPrice(pricing.shippingPrice)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                                        <span>Total:</span>
                                        <span className="text-blue-600">{formatPrice(pricing.total)}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 p-4 flex justify-end space-x-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddToCart}
                        disabled={isLoading || !selectedFormat || !selectedCoverType || !selectedShipping}
                        className="px-6 bg-blue-600 hover:bg-blue-700"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Adding...</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <ShoppingCart size={16} />
                                <span>Add to Cart</span>
                            </div>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderModal;
