'use client';

import React, { useState, useEffect } from 'react';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PhotoAlbumLayoutSelectorProps, LayoutType, LayoutOption } from './types';
import { ChevronRight, Check, Info } from 'lucide-react';

const PhotoAlbumLayoutSelector: React.FC<PhotoAlbumLayoutSelectorProps> = ({
    totalImages,
    onLayoutSelect,
    onViewTemplates,
    defaultLayout,
    maxImagesPerPage = 4,
    maxSingleLayoutImages = 144,
    showNotifications = true,
    sampleImages = [],
}) => {
    const router = useRouter();
    const [selectedLayout, setSelectedLayout] = useState<LayoutType>(defaultLayout as LayoutType || 'random');
    const [animateSelection, setAnimateSelection] = useState(false);
    const [showTooltip, setShowTooltip] = useState<string | null>(null);

    const defaultSampleImages = [
        "/api/placeholder/400/320",
        "/api/placeholder/400/320",
        "/api/placeholder/400/320",
        "/api/placeholder/400/320",
        "/api/placeholder/400/320",
        "/api/placeholder/400/320"
    ];

    const imagesToUse = sampleImages.length > 0 ? sampleImages : defaultSampleImages;

    const layoutOptions: LayoutOption[] = [
        {
            id: 'random',
            title: 'Random',
            description: 'Randomly arranged images with varied layouts',
        },
        {
            id: 'single',
            title: 'One by One',
            description: 'One image per page',
            maxImages: maxSingleLayoutImages,
        },
        {
            id: 'multiple',
            title: 'A Feast for the Eyes',
            description: `Up to ${maxImagesPerPage} images per page`,
            recommended: true,
        },
        {
            id: 'sidebyside',
            title: 'Side by Side',
            description: 'Two images side by side per page',
            maxImages: 2,
        },
        {
            id: 'magazine',
            title: 'Magazine Style',
            description: 'Editorial layout with mixed image sizes',
        },
        {
            id: 'polaroid',
            title: 'Polaroid Collection',
            description: 'Vintage polaroid-style scattered photos',
        },
        {
            id: 'timeline',
            title: 'Timeline Story',
            description: 'Chronological timeline layout',
        },
    ];


    useEffect(() => {
        onLayoutSelect(selectedLayout);
    }, [selectedLayout, onLayoutSelect]);

    const handleLayoutSelect = (layout: LayoutType) => {
        if (layout !== selectedLayout) {
            setSelectedLayout(layout);
            setAnimateSelection(true);
            setTimeout(() => setAnimateSelection(false), 500);
            onLayoutSelect(layout);
        }
    };

    const calculatePages = (layout: LayoutType) => {
        switch (layout) {
            case 'single':
                return Math.ceil(totalImages / 1);
            case 'multiple':
                return Math.ceil(totalImages / maxImagesPerPage);
            case 'sidebyside':
                return Math.ceil(totalImages / 2);
            case 'magazine':
                return Math.ceil(totalImages / 3); // Assuming 3 images per spread
            case 'polaroid':
                return Math.ceil(totalImages / 4); // Assuming 4 polaroids per spread
            case 'timeline':
                return Math.ceil(totalImages / 2); // Assuming 2 images per timeline page
            case 'random':
                return Math.ceil(totalImages / 3); // Assuming 3 images per random page on average
            default:
                return Math.ceil(totalImages / 1);
        }
    };

    const renderLayoutPreview = (layout: LayoutType) => {
        const baseClasses = "relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer";
        const selectedClasses = selectedLayout === layout ? 'ring-2 ring-green-500' : '';

        return (
            <motion.div className={`${baseClasses} ${selectedClasses}`}>
                {selectedLayout === layout && (
                    <motion.div
                        className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full z-20"
                        initial={{ scale: 0 }}
                        animate={{ scale: animateSelection ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Check size={16} />
                    </motion.div>
                )}

                <div className="flex relative">
                    {/* Left page */}
                    <div className="w-1/2 h-64 bg-white p-4 relative">
                        <div className="absolute inset-0 bg-gray-50 m-4 shadow-inner"></div>
                        {renderPageContent(layout, 'left')}
                        <div className="absolute inset-0 pointer-events-none border border-gray-200 m-4"></div>
                    </div>

                    {/* Book binding */}
                    <div className="w-1 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 shadow-inner z-10"></div>

                    {/* Right page */}
                    <div className="w-1/2 h-64 bg-white p-4 relative">
                        <div className="absolute inset-0 bg-gray-50 m-4 shadow-inner"></div>
                        {renderPageContent(layout, 'right')}
                        <div className="absolute inset-0 pointer-events-none border border-gray-200 m-4"></div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderPageContent = (layout: LayoutType, side: 'left' | 'right') => {
        const imageOffset = side === 'left' ? 0 : 3;

        switch (layout) {
            case 'single':
                return (
                    <div className="absolute inset-0 m-8 bg-white shadow-md overflow-hidden">
                        <Image
                            src={imagesToUse[imageOffset]}
                            alt=""
                            fill
                            style={{ objectFit: 'cover' }}
                            className="transition-all duration-300"
                        />
                    </div>
                );

            case 'multiple':
                return (
                    <div className="absolute inset-0 m-8 grid grid-cols-2 grid-rows-2 gap-2">
                        {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="bg-white shadow-md overflow-hidden relative">
                                <Image
                                    src={imagesToUse[(imageOffset + index) % imagesToUse.length]}
                                    alt=""
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="transition-all duration-300"
                                />
                            </div>
                        ))}
                    </div>
                );

            case 'sidebyside':
                return (
                    <div className="absolute inset-0 m-8 grid grid-cols-2 gap-4">
                        {[0, 1].map((index) => (
                            <div key={index} className="bg-white shadow-md overflow-hidden relative">
                                <Image
                                    src={imagesToUse[(imageOffset + index) % imagesToUse.length]}
                                    alt=""
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="transition-all duration-300"
                                />
                            </div>
                        ))}
                    </div>
                );

            case 'magazine':
                return (
                    <div className="absolute inset-0 m-8">
                        {/* Large feature image */}
                        <div className="absolute top-0 left-0 w-3/5 h-3/5 bg-white shadow-md overflow-hidden">
                            <Image
                                src={imagesToUse[imageOffset]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        {/* Small images */}
                        <div className="absolute top-0 right-0 w-2/5 h-2/5 bg-white shadow-md overflow-hidden">
                            <Image
                                src={imagesToUse[(imageOffset + 1) % imagesToUse.length]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 w-2/5 h-2/5 bg-white shadow-md overflow-hidden">
                            <Image
                                src={imagesToUse[(imageOffset + 2) % imagesToUse.length]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                    </div>
                );

            case 'polaroid':
                return (
                    <div className="absolute inset-0 m-8">
                        {/* Scattered polaroid photos */}
                        <div className="absolute top-2 left-2 w-16 h-20 bg-white shadow-lg transform rotate-12 p-1">
                            <div className="w-full h-3/4 bg-gray-200 overflow-hidden relative">
                                <Image
                                    src={imagesToUse[imageOffset]}
                                    alt=""
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="transition-all duration-300"
                                />
                            </div>
                        </div>
                        <div className="absolute top-8 right-4 w-16 h-20 bg-white shadow-lg transform -rotate-6 p-1">
                            <div className="w-full h-3/4 bg-gray-200 overflow-hidden relative">
                                <Image
                                    src={imagesToUse[(imageOffset + 1) % imagesToUse.length]}
                                    alt=""
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="transition-all duration-300"
                                />
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-6 w-16 h-20 bg-white shadow-lg transform rotate-3 p-1">
                            <div className="w-full h-3/4 bg-gray-200 overflow-hidden relative">
                                <Image
                                    src={imagesToUse[(imageOffset + 2) % imagesToUse.length]}
                                    alt=""
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'timeline':
                return (
                    <div className="absolute inset-0 m-8">
                        {/* Timeline line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 transform -translate-x-1/2"></div>
                        {/* Timeline images */}
                        <div className="absolute top-4 left-2 w-12 h-10 bg-white shadow-md overflow-hidden">
                            <Image
                                src={imagesToUse[imageOffset]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        <div className="absolute top-20 right-2 w-12 h-10 bg-white shadow-md overflow-hidden">
                            <Image
                                src={imagesToUse[(imageOffset + 1) % imagesToUse.length]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        {/* Timeline dots */}
                        <div className="absolute top-6 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2"></div>
                        <div className="absolute top-22 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2"></div>
                    </div>
                );

            case 'random':
                return (
                    <div className="absolute inset-0 m-8">
                        {/* Random scattered images with different sizes and rotations */}
                        <div className="absolute top-2 left-4 w-14 h-12 bg-white shadow-md overflow-hidden transform rotate-6">
                            <Image
                                src={imagesToUse[imageOffset]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        <div className="absolute top-12 right-2 w-10 h-14 bg-white shadow-md overflow-hidden transform -rotate-12">
                            <Image
                                src={imagesToUse[(imageOffset + 1) % imagesToUse.length]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        <div className="absolute bottom-8 left-2 w-16 h-10 bg-white shadow-md overflow-hidden transform rotate-3">
                            <Image
                                src={imagesToUse[(imageOffset + 2) % imagesToUse.length]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        <div className="absolute bottom-2 right-6 w-8 h-8 bg-white shadow-md overflow-hidden transform -rotate-45 rounded-full">
                            <Image
                                src={imagesToUse[(imageOffset + 3) % imagesToUse.length]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                        <div className="absolute top-16 left-12 w-6 h-8 bg-white shadow-md overflow-hidden transform rotate-45">
                            <Image
                                src={imagesToUse[(imageOffset + 4) % imagesToUse.length]}
                                alt=""
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-all duration-300"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="border-b border-gray-200 pb-4">
                <h1 className="text-3xl font-medium text-center text-gray-700">
                    Choose the arrangement of the images on the pages of the book
                </h1>
            </div>
            <div className="mt-8 flex h-12 justify-between">
                <motion.button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full transition-colors flex items-center gap-1"
                    onClick={() => router.back()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Back to Upload Images
                </motion.button>
                <motion.button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-colors flex items-center gap-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        onLayoutSelect(selectedLayout);
                        onViewTemplates?.();
                    }}
                >
                    <span>Select Album Design</span>
                    <ChevronRight size={16} />
                </motion.button>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {layoutOptions.map((option, index) => (
                    <motion.div
                        key={option.id}
                        onClick={() => handleLayoutSelect(option.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedLayout === option.id}
                        aria-label={`Select ${option.title} layout`}
                        onKeyDown={(e) => e.key === 'Enter' && handleLayoutSelect(option.id)}
                        className="group"
                    >
                        {renderLayoutPreview(option.id)}

                        <div className="p-4 text-center">
                            <div className="flex items-start justify-center gap-1">
                                {option.recommended && (
                                    <span className="text-green-500 font-bold">!</span>
                                )}
                                <h2 className="text-lg font-medium text-gray-800">
                                    {option.title}
                                    {option.recommended && (
                                        <span className="text-green-500 ml-1">- recommended</span>
                                    )}
                                </h2>
                                <div className="relative inline-block ml-1">
                                    <button
                                        type="button"
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowTooltip(showTooltip === option.id ? null : option.id);
                                        }}
                                        aria-label="Show more information"
                                    >
                                        <Info size={16} />
                                    </button>
                                    {showTooltip === option.id && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white p-2 rounded shadow-lg text-xs text-left z-30">
                                            {getTooltipContent(option.id)}
                                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">{option.description}</p>
                            {option.maxImages && (
                                <p className="text-sm text-gray-600">Up to {option.maxImages} photos per book</p>
                            )}
                            {showNotifications && selectedLayout === option.id && (
                                <motion.p
                                    className="text-xs mt-2 text-blue-600"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    transition={{ duration: 0.3 }}
                                >
                                    Your book will be approximately {calculatePages(option.id)} pages with this layout
                                </motion.p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const getTooltipContent = (layoutId: LayoutType): string => {
    switch (layoutId) {
        case 'single':
            return 'Perfect for showcasing each photo individually with maximum impact. Great for portrait sessions or when each image tells its own story.';
        case 'multiple':
            return 'Multiple images per page creates a more dynamic and interesting layout. Our designer will arrange your photos to create beautiful, balanced spreads based on their orientations and subject matter.';
        case 'sidebyside':
            return 'Two images side by side create perfect comparisons or complementary pairs. Ideal for before/after shots, couples, or related moments.';
        case 'magazine':
            return 'Editorial-style layout with one large feature image and smaller supporting photos. Creates a professional, magazine-like appearance with visual hierarchy.';
        case 'polaroid':
            return 'Vintage polaroid-style layout with white borders and casual, scattered placement. Perfect for creating a nostalgic, personal scrapbook feel.';
        case 'timeline':
            return 'Chronological timeline layout that tells your story in sequence. Great for events, trips, or any narrative that unfolds over time.';
        case 'random':
            return 'Creative random arrangement with images of varying sizes, rotations, and positions. Each page becomes a unique artistic composition with an organic, spontaneous feel.';
        default:
            return '';
    }
};

export default PhotoAlbumLayoutSelector;
