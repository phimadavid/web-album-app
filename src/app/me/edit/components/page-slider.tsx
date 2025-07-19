'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Eye, Layout } from 'lucide-react';
import { AlbumDataProps, ImageDataProps } from '../data-types/types';

interface PageSliderProps {
    albumData: AlbumDataProps | null;
    currentPage: number;
    onPageChange: (page: number) => void;
    pageBackgrounds: string[];
    onSave: () => void;
    isSaving: boolean;
    onPreview: () => void;
    onSlideChange?: (slideIndex: number) => void;
    pageLayouts?: string[];
    onPageLayoutChange?: (slideIndex: number, layout: string) => void;
    selectedImageIndex?: number;
    onImageSelect?: (image: any, index: number) => void;
}

interface ParsedTextAnnotation {
    textContent: string;
    position: { x: number; y: number };
    style: {
        fontSize: string;
        color: string;
        fontFamily: string;
        fontWeight: string;
    };
}

const PageSlider: React.FC<PageSliderProps> = ({
    albumData,
    currentPage,
    onPageChange,
    pageBackgrounds,
    onSave,
    isSaving,
    onPreview,
    pageLayouts,
    onPageLayoutChange,
    selectedImageIndex,
    onImageSelect,
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showLayoutSelector, setShowLayoutSelector] = useState(false);

    const imageData = albumData?.images || [];

    // Available layout templates - include the new random layout
    const availableLayouts = ['single', 'sidebyside', 'multiple', 'magazine', 'palaroid', 'Timeline', 'random'];

    // Use the global layout from albumData instead of mixed patterns
    const getGlobalLayout = () => {
        // If pageLayouts is provided (for individual page layouts), use it
        if (pageLayouts && pageLayouts.length > 0) {
            return pageLayouts[currentSlide] || albumData?.layoutPage || 'single';
        }

        // Otherwise, use the global layout from albumData
        return albumData?.layoutPage || 'single';
    };

    const currentPageLayout = getGlobalLayout();

    // Calculate images per slide based on current slide's layout
    const getImagesPerSlide = (layout: string) => {
        switch (layout) {
            case 'multiple': return 4;
            case 'sidebyside': return 2;
            case 'magazine': return 4;
            case 'palaroid': return 4;
            case 'Timeline': return 3;
            default: return 1;
        }
    };

    // Calculate total slides based on global layout
    const calculateTotalSlides = () => {
        const globalLayout = albumData?.layoutPage || 'single';
        const imagesPerSlide = getImagesPerSlide(globalLayout);
        return Math.ceil(imageData.length / imagesPerSlide);
    };

    const totalSlides = calculateTotalSlides();

    // Calculate current slide based on currentPage
    useEffect(() => {
        const slideIndex = Math.max(0, currentPage >= 2 ? currentPage - 2 : 0);
        if (slideIndex < totalSlides) {
            setCurrentSlide(slideIndex);
        }
    }, [currentPage, totalSlides]);

    const goToSlide = (slideIndex: number) => {
        if (slideIndex >= 0 && slideIndex < totalSlides) {
            setCurrentSlide(slideIndex);
            if (onPageChange) {
                onPageChange(slideIndex + 2);
            }
        }
    };

    const nextSlide = () => {
        const nextIndex = currentSlide + 1;
        if (nextIndex < totalSlides) {
            goToSlide(nextIndex);
        }
    };

    const prevSlide = () => {
        const prevIndex = currentSlide - 1;
        if (prevIndex >= 0) {
            goToSlide(prevIndex);
        }
    };

    const handleLayoutChange = (newLayout: string) => {
        if (onPageLayoutChange) {
            onPageLayoutChange(currentSlide, newLayout);
        }
        setShowLayoutSelector(false);
    };

    const parseTextAnnotation = (image: any): ParsedTextAnnotation | null => {
        if (!image?.metadata?.textAnnotation) return null;

        try {
            if (typeof image?.metadata?.textAnnotation === 'string') {
                return JSON.parse(image?.metadata?.textAnnotation);
            } else {
                return image?.metadata?.textAnnotation;
            }
        } catch (error) {
            console.error('Error parsing textAnnotation:', error);
            return null;
        }
    };

    const getImageStyle = (image: any) => {
        let style: React.CSSProperties = {
            objectFit: 'cover',
            transform: '',
        };

        if (image?.metadata?.rotation) {
            style.transform = `rotate(${image?.metadata.rotation}deg)`;
        }

        if ((image?.metadata?.zoom || 1.0) > 1.0) {
            style = {
                ...style,
                transform: `${style.transform ? style.transform : ''} scale(${image?.metadata?.zoom})`,
                transformOrigin: `${image?.metadata?.zoomPosition?.x || 50}% ${image?.metadata?.zoomPosition?.y || 50}%`,
                objectFit: 'cover',
            };
        }

        return style;
    };

    const getContainerStyle = (image: any) => {
        let style: React.CSSProperties = {
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
        };

        if ((image?.metadata?.zoom || 1.0) > 1.0) {
            style.overflow = 'hidden';
        }

        return style;
    };

    const renderImage = (image: any, index: number, layout: string) => {
        if (!image) return null;

        const parsedTextAnnotation = parseTextAnnotation(image);
        const isSelected = selectedImageIndex === index;

        return (
            <div
                key={`image-${index}`}
                className="flex justify-center items-center relative"
                style={{
                    width: layout === 'multiple' ? '50%' : '100%',
                    height: layout === 'multiple' ? '50%' : '100%',
                    padding: '4px',
                }}
            >
                <div
                    onClick={() => onImageSelect && onImageSelect(image, index)}
                    style={getContainerStyle(image)}
                    className={`aspect-square cursor-pointer transition-all duration-200 ${isSelected
                        ? 'border-4 border-orange-500 shadow-lg scale-105'
                        : 'border-2 border-white hover:border-orange-300 hover:shadow-md'
                        }`}
                >
                    <div
                        style={{
                            width: `${(image?.metadata?.zoom || 1.0) * 100}%`,
                            height: `${(image?.metadata?.zoom || 1.0) * 100}%`,
                            position: 'relative',
                        }}
                    >
                        <img
                            src={image.s3Url}
                            alt={`Image ${index}`}
                            className="w-full h-full"
                            style={getImageStyle(image)}
                        />
                    </div>

                    {/* Text Annotation */}
                    {parsedTextAnnotation &&
                        parsedTextAnnotation.position &&
                        parsedTextAnnotation.textContent && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: `${parsedTextAnnotation?.position.x}%`,
                                    top: `${parsedTextAnnotation?.position.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    color: parsedTextAnnotation?.style?.color || '#ffffff',
                                    fontSize: parsedTextAnnotation?.style?.fontSize || '24px',
                                    fontFamily:
                                        parsedTextAnnotation?.style?.fontFamily ||
                                        'Arial, sans-serif',
                                    fontWeight: parsedTextAnnotation?.style?.fontWeight || 'normal',
                                    textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                }}
                            >
                                {parsedTextAnnotation?.textContent}
                            </div>
                        )}
                </div>
            </div>
        );
    };

    const renderSidebySideStyle = (images: any[], startIndex: number = 0) => {
        const leftImage = startIndex < images.length ? images[startIndex] : null;
        const rightImage = startIndex + 1 < images.length ? images[startIndex + 1] : null;

        return (
            <div className="w-full h-full flex gap-2">
                {/* Left side */}
                <div className="flex-1 flex justify-center items-center">
                    {leftImage ? (
                        <div className="w-full h-full relative">
                            <div
                                onClick={() => onImageSelect && onImageSelect(leftImage, startIndex)}
                                style={getContainerStyle(leftImage)}
                                className={`border-2 w-full h-full cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex
                                    ? 'border-4 border-orange-500 shadow-lg scale-105'
                                    : 'border-white hover:border-orange-300 hover:shadow-md'
                                    }`}
                            >
                                <img
                                    src={leftImage.s3Url}
                                    alt={`Image ${startIndex}`}
                                    className="w-full h-full"
                                    style={getImageStyle(leftImage)}
                                />
                            </div>
                            {(() => {
                                const parsedTextAnnotation = parseTextAnnotation(leftImage);
                                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                    <div
                                        className="absolute z-30 pointer-events-none"
                                        style={{
                                            left: `${parsedTextAnnotation.position.x}%`,
                                            top: `${parsedTextAnnotation.position.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            color: parsedTextAnnotation.style?.color || '#ffffff',
                                            fontSize: parsedTextAnnotation.style?.fontSize || '24px',
                                            fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                                            fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                                            textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '80%',
                                            textAlign: 'center',
                                            boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        {parsedTextAnnotation.textContent}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    ) : (
                        <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}
                </div>

                {/* Right side */}
                <div className="flex-1 flex justify-center items-center">
                    {rightImage ? (
                        <div className="w-full h-full relative">
                            <div
                                onClick={() => onImageSelect && onImageSelect(rightImage, startIndex + 1)}
                                style={getContainerStyle(rightImage)}
                                className={`border-2 w-full h-full cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex + 1
                                    ? 'border-4 border-orange-500 shadow-lg scale-105'
                                    : 'border-white hover:border-orange-300 hover:shadow-md'
                                    }`}
                            >
                                <img
                                    src={rightImage.s3Url}
                                    alt={`Image ${startIndex + 1}`}
                                    className="w-full h-full"
                                    style={getImageStyle(rightImage)}
                                />
                            </div>
                            {(() => {
                                const parsedTextAnnotation = parseTextAnnotation(rightImage);
                                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                    <div
                                        className="absolute z-30 pointer-events-none"
                                        style={{
                                            left: `${parsedTextAnnotation.position.x}%`,
                                            top: `${parsedTextAnnotation.position.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            color: parsedTextAnnotation.style?.color || '#ffffff',
                                            fontSize: parsedTextAnnotation.style?.fontSize || '24px',
                                            fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                                            fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                                            textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '80%',
                                            textAlign: 'center',
                                            boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        {parsedTextAnnotation.textContent}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    ) : (
                        <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderImageGrid = (images: any[], startIndex: number, layout: string) => {
        const imagesPerPage = getImagesPerSlide(layout);
        return (
            <div className="w-full h-full flex flex-wrap justify-center items-center">
                {Array.from({ length: imagesPerPage }).map((_, i) => {
                    const imageIndex = startIndex + i;
                    const image = imageIndex < imageData.length ? imageData[imageIndex] : null;
                    return renderImage(image, imageIndex, layout);
                })}
            </div>
        );
    };

    const renderMagazineStyle = (images: any[], startIndex: number = 0) => {
        const mainImage = startIndex < images.length ? images[startIndex] : null;
        const thumbnails = images.slice(startIndex + 1, startIndex + 4);

        return (
            <div className="w-full h-full flex">
                {/* Main image (2/3 width) */}
                <div className="w-2/3 pr-2">
                    {mainImage ? (
                        <div className="w-full h-full relative">
                            <div
                                onClick={() => onImageSelect && onImageSelect(mainImage, startIndex)}
                                style={getContainerStyle(mainImage)}
                                className={`border-2 w-full h-full cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex
                                    ? 'border-4 border-orange-500 shadow-lg scale-105'
                                    : 'border-white hover:border-orange-300 hover:shadow-md'
                                    }`}
                            >
                                <img
                                    src={mainImage.s3Url}
                                    alt={`Main Image ${startIndex}`}
                                    className="w-full h-full"
                                    style={getImageStyle(mainImage)}
                                />
                            </div>
                            {(() => {
                                const parsedTextAnnotation = parseTextAnnotation(mainImage);
                                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                    <div
                                        className="absolute z-30 pointer-events-none"
                                        style={{
                                            left: `${parsedTextAnnotation.position.x}%`,
                                            top: `${parsedTextAnnotation.position.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            color: parsedTextAnnotation.style?.color || '#ffffff',
                                            fontSize: parsedTextAnnotation.style?.fontSize || '20px',
                                            fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                                            fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                                            textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '80%',
                                            textAlign: 'center',
                                            boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        {parsedTextAnnotation.textContent}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    ) : (
                        <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400">
                            No Main Image
                        </div>
                    )}
                </div>

                {/* Thumbnail column (1/3 width) */}
                <div className="w-1/3 grid grid-rows-3 gap-2">
                    {thumbnails.map((image, index) => (
                        <div key={`thumb-${startIndex + 1 + index}`} className="w-full aspect-square relative">
                            {image ? (
                                <div className="w-full h-full relative">
                                    <div
                                        onClick={() => onImageSelect && onImageSelect(image, startIndex + 1 + index)}
                                        style={getContainerStyle(image)}
                                        className={`border-2 w-full h-full cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex + 1 + index
                                            ? 'border-4 border-orange-500 shadow-lg scale-105'
                                            : 'border-white hover:border-orange-300 hover:shadow-md'
                                            }`}
                                    >
                                        <img
                                            src={image.s3Url}
                                            alt={`Thumbnail ${startIndex + 1 + index}`}
                                            className="w-full h-full"
                                            style={getImageStyle(image)}
                                        />
                                    </div>
                                    {(() => {
                                        const parsedTextAnnotation = parseTextAnnotation(image);
                                        return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                            <div
                                                className="absolute z-30 pointer-events-none"
                                                style={{
                                                    left: `${parsedTextAnnotation.position.x}%`,
                                                    top: `${parsedTextAnnotation.position.y}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    color: parsedTextAnnotation.style?.color || '#ffffff',
                                                    fontSize: '12px',
                                                    fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                                                    fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                                                    textShadow: '0px 0px 2px #000000',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                    padding: '2px 4px',
                                                    borderRadius: '2px',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '90%',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {parsedTextAnnotation.textContent}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            ) : (
                                <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs">
                                    No Image
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Fill empty grid cells if there are fewer than 3 thumbnails */}
                    {Array.from({ length: Math.max(0, 3 - thumbnails.length) }).map((_, index) => (
                        <div key={`empty-thumb-${index}`} className="w-full aspect-square relative">
                            <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs">
                                No Image
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderPalaroidStyle = (images: any[], startIndex: number = 0) => {
        const images_to_render = images.slice(startIndex, startIndex + 4);

        return (
            <div className="w-full h-full flex flex-wrap justify-center items-center gap-4 p-4">
                {images_to_render.map((image, index) => {
                    const rotation = [-8, 12, -5, 7][index] || 0; // Random-ish rotations for polaroid effect
                    return (
                        <div
                            key={`polaroid-${startIndex + index}`}
                            className="bg-white p-3 shadow-lg relative"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                width: '45%',
                                maxWidth: '180px',
                            }}
                        >
                            {image ? (
                                <div className="relative">
                                    <div
                                        onClick={() => onImageSelect && onImageSelect(image, startIndex + index)}
                                        style={getContainerStyle(image)}
                                        className={`w-full aspect-square mb-3 cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex + index
                                            ? 'border-4 border-orange-500 shadow-lg scale-105'
                                            : 'border-2 border-white hover:border-orange-300 hover:shadow-md'
                                            }`}
                                    >
                                        <img
                                            src={image.s3Url}
                                            alt={`Polaroid ${startIndex + index}`}
                                            className="w-full h-full"
                                            style={getImageStyle(image)}
                                        />
                                    </div>

                                    {/* Date at bottom of polaroid */}
                                    <div className="text-center text-xs text-gray-600 font-handwriting">
                                        {image.metadata?.capturedAt ? new Date(image.metadata.capturedAt).toLocaleDateString() : `Photo ${startIndex + index + 1}`}
                                    </div>

                                    {/* Text Annotation for polaroid */}
                                    {(() => {
                                        const parsedTextAnnotation = parseTextAnnotation(image);
                                        return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                            <div
                                                className="absolute z-30 pointer-events-none"
                                                style={{
                                                    left: `${parsedTextAnnotation.position.x}%`,
                                                    top: `${parsedTextAnnotation.position.y}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    color: parsedTextAnnotation.style?.color || '#ffffff',
                                                    fontSize: parsedTextAnnotation.style?.fontSize || '16px',
                                                    fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                                                    fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                                                    textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '80%',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {parsedTextAnnotation.textContent}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            ) : (
                                <div className="w-full aspect-square border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs mb-3">
                                    No Image
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderTimeline = (images: any[], startIndex: number = 0) => {
        const images_to_render = images.slice(startIndex, startIndex + 3);

        return (
            <div className="w-full h-full flex flex-col justify-center p-4">
                {/* Timeline line */}
                <div className="relative flex flex-col gap-6">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-400"></div>

                    {images_to_render.map((image, index) => (
                        <div key={`timeline-${startIndex + index}`} className="flex items-center gap-4">
                            {/* Timeline dot */}
                            <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-md flex-shrink-0 z-10"></div>

                            {/* Content */}
                            <div className="flex-1 flex gap-4 items-center">
                                {image ? (
                                    <>
                                        {/* Image */}
                                        <div className="w-24 h-24 relative flex-shrink-0">
                                            <div
                                                onClick={() => onImageSelect && onImageSelect(image, startIndex + index)}
                                                style={getContainerStyle(image)}
                                                className={`border-2 w-full h-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex + index
                                                    ? 'border-4 border-orange-500 shadow-lg scale-105'
                                                    : 'border-white hover:border-orange-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <img
                                                    src={image.s3Url}
                                                    alt={`Timeline ${startIndex + index}`}
                                                    className="w-full h-full"
                                                    style={getImageStyle(image)}
                                                />
                                            </div>

                                            {/* Text Annotation for timeline image */}
                                            {(() => {
                                                const parsedTextAnnotation = parseTextAnnotation(image);
                                                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                                    <div
                                                        className="absolute z-30 pointer-events-none"
                                                        style={{
                                                            left: `${parsedTextAnnotation.position.x}%`,
                                                            top: `${parsedTextAnnotation.position.y}%`,
                                                            transform: 'translate(-50%, -50%)',
                                                            color: parsedTextAnnotation.style?.color || '#ffffff',
                                                            fontSize: '12px', // Smaller for timeline
                                                            fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                                                            fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                                                            textShadow: '0px 0px 2px #000000',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                            padding: '1px 3px',
                                                            borderRadius: '2px',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '90%',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {parsedTextAnnotation.textContent}
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>

                                        {/* Date and description */}
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-gray-800">
                                                {image.metadata?.capturedAt ? new Date(image.metadata.capturedAt).toLocaleDateString() : `Event ${startIndex + index + 1}`}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Photo {startIndex + index + 1}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex gap-4 items-center flex-1">
                                        <div className="w-24 h-24 border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs rounded-lg">
                                            No Image
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-gray-400">
                                                No Event
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Calculate start index for current slide based on global layout
    const getStartIndexForSlide = (slideIndex: number) => {
        const globalLayout = albumData?.layoutPage || 'single';
        const imagesPerSlide = getImagesPerSlide(globalLayout);
        return slideIndex * imagesPerSlide;
    };

    const renderPageContent = (slideIndex: number) => {
        const layout = currentPageLayout;
        const startIndex = getStartIndexForSlide(slideIndex);
        const frontPageBackground = pageBackgrounds[slideIndex] || albumData?.bookDesign;

        // Check if we have any images for this slide
        const hasImages = startIndex < imageData.length;

        if (!hasImages) {
            return (
                <div className="w-full aspect-square max-w-2xl mx-auto flex flex-col justify-center items-center p-6 rounded-lg shadow-lg bg-gray-100">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Images</h3>
                        <p className="text-gray-600">This slide has no images</p>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="w-full aspect-square max-w-2xl mx-auto flex flex-col justify-center items-center p-6 rounded-lg shadow-lg relative"
                style={{
                    background: frontPageBackground
                        ? `url("${frontPageBackground}") no-repeat center/cover`
                        : albumData?.bookDesign
                            ? `url("${albumData?.bookDesign}") no-repeat center/cover`
                            : `linear-gradient(135deg, #8B4513 0%, #4A230C 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Layout selector button */}
                <button
                    onClick={() => setShowLayoutSelector(!showLayoutSelector)}
                    className="absolute top-2 right-2 z-20 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title="Change Layout"
                >
                    <Layout size={16} className="text-gray-600" />
                </button>

                {/* Layout selector dropdown */}
                {showLayoutSelector && (
                    <div className="absolute top-12 right-2 z-30 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-64">
                        <div className="text-xs font-medium text-gray-700 mb-3 px-1">Choose Layout:</div>
                        <div className="grid grid-cols-2 gap-2">
                            {availableLayouts.map((layoutOption) => (
                                <button
                                    key={layoutOption}
                                    onClick={() => handleLayoutChange(layoutOption)}
                                    className={`p-2 rounded-md transition-all hover:scale-105 ${currentPageLayout === layoutOption
                                        ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                        }`}
                                >
                                    {/* Mockup Preview */}
                                    <div className="w-full h-16 bg-gray-200 rounded mb-1 relative overflow-hidden">
                                        {layoutOption === 'single' && (
                                            <div className="w-full h-full bg-blue-300 flex items-center justify-center">
                                                <div className="w-10 h-10 bg-blue-500 rounded"></div>
                                            </div>
                                        )}
                                        {layoutOption === 'sidebyside' && (
                                            <div className="w-full h-full flex gap-1">
                                                <div className="flex-1 bg-blue-300 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                                </div>
                                                <div className="flex-1 bg-green-300 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                                </div>
                                            </div>
                                        )}
                                        {layoutOption === 'multiple' && (
                                            <div className="w-full h-full grid grid-cols-2 gap-1">
                                                <div className="bg-blue-300 flex items-center justify-center">
                                                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                                </div>
                                                <div className="bg-green-300 flex items-center justify-center">
                                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                                </div>
                                                <div className="bg-yellow-300 flex items-center justify-center">
                                                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                                </div>
                                                <div className="bg-red-300 flex items-center justify-center">
                                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                                </div>
                                            </div>
                                        )}
                                        {layoutOption === 'magazine' && (
                                            <div className="w-full h-full flex gap-1">
                                                <div className="flex-1 bg-blue-300 flex items-center justify-center">
                                                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                                                </div>
                                                <div className="w-1/3 flex flex-col gap-1">
                                                    <div className="flex-1 bg-green-300 flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                                                    </div>
                                                    <div className="flex-1 bg-yellow-300 flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                                                    </div>
                                                    <div className="flex-1 bg-red-300 flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-red-500 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {layoutOption === 'palaroid' && (
                                            <div className="w-full h-full flex flex-wrap gap-1 p-1">
                                                <div className="w-6 h-8 bg-white border border-gray-300 transform rotate-3 shadow-sm">
                                                    <div className="w-full h-5 bg-blue-300"></div>
                                                    <div className="w-full h-3 bg-white"></div>
                                                </div>
                                                <div className="w-6 h-8 bg-white border border-gray-300 transform -rotate-2 shadow-sm">
                                                    <div className="w-full h-5 bg-green-300"></div>
                                                    <div className="w-full h-3 bg-white"></div>
                                                </div>
                                                <div className="w-6 h-8 bg-white border border-gray-300 transform rotate-1 shadow-sm">
                                                    <div className="w-full h-5 bg-yellow-300"></div>
                                                    <div className="w-full h-3 bg-white"></div>
                                                </div>
                                                <div className="w-6 h-8 bg-white border border-gray-300 transform -rotate-1 shadow-sm">
                                                    <div className="w-full h-5 bg-red-300"></div>
                                                    <div className="w-full h-3 bg-white"></div>
                                                </div>
                                            </div>
                                        )}
                                        {layoutOption === 'Timeline' && (
                                            <div className="w-full h-full flex flex-col justify-center p-1">
                                                <div className="relative flex flex-col gap-1">
                                                    <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-gray-400"></div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                        <div className="w-4 h-3 bg-blue-300 rounded"></div>
                                                        <div className="flex-1 h-1 bg-gray-300 rounded"></div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                        <div className="w-4 h-3 bg-green-300 rounded"></div>
                                                        <div className="flex-1 h-1 bg-gray-300 rounded"></div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                        <div className="w-4 h-3 bg-yellow-300 rounded"></div>
                                                        <div className="flex-1 h-1 bg-gray-300 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {layoutOption === 'random' && (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center">
                                                <div className="text-xs font-bold text-purple-700">?</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selection indicator */}
                                    {currentPageLayout === layoutOption && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-white">✓</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current layout indicator */}
                <div className="absolute top-2 left-2 z-20 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {currentPageLayout.charAt(0).toUpperCase() + currentPageLayout.slice(1)} Layout
                </div>

                {/* Render content based on layout */}
                <div className="w-full h-full flex justify-center items-center relative">
                    {layout === 'multiple' ? (
                        renderImageGrid(imageData, startIndex, layout)
                    ) : layout === 'sidebyside' ? (
                        renderSidebySideStyle(imageData, startIndex)
                    ) : layout === 'magazine' ? (
                        renderMagazineStyle(imageData, startIndex)
                    ) : layout === 'palaroid' ? (
                        renderPalaroidStyle(imageData, startIndex)
                    ) : layout === 'Timeline' ? (
                        renderTimeline(imageData, startIndex)
                    ) : layout === 'random' ? (
                        // Random layout - cycle through different styles based on slide index
                        (() => {
                            const layoutStyles = ['single', 'sidebyside', 'magazine', 'palaroid', 'Timeline', 'multiple'];
                            const randomLayoutIndex = slideIndex % layoutStyles.length;
                            const randomLayout = layoutStyles[randomLayoutIndex];

                            switch (randomLayout) {
                                case 'multiple':
                                    return renderImageGrid(imageData, startIndex, randomLayout);
                                case 'sidebyside':
                                    return renderSidebySideStyle(imageData, startIndex);
                                case 'magazine':
                                    return renderMagazineStyle(imageData, startIndex);
                                case 'palaroid':
                                    return renderPalaroidStyle(imageData, startIndex);
                                case 'Timeline':
                                    return renderTimeline(imageData, startIndex);
                                case 'single':
                                default:
                                    return (
                                        <div
                                            onClick={() => onImageSelect && onImageSelect(imageData[startIndex], startIndex)}
                                            style={getContainerStyle(imageData[startIndex])}
                                            className={`aspect-square w-full max-w-md rounded-lg overflow-hidden relative cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex
                                                ? 'border-4 border-orange-500 shadow-lg scale-105'
                                                : 'border-2 border-white hover:border-orange-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div
                                                style={{
                                                    width: `${(imageData[startIndex]?.metadata?.zoom || 1.0) * 100}%`,
                                                    height: `${(imageData[startIndex]?.metadata?.zoom || 1.0) * 100}%`,
                                                    position: 'relative',
                                                }}
                                            >
                                                <img
                                                    src={imageData[startIndex].s3Url}
                                                    alt={`Image ${startIndex + 1}`}
                                                    className="w-full h-full object-cover"
                                                    style={getImageStyle(imageData[startIndex])}
                                                />
                                            </div>

                                            {/* Text Annotation for single layout */}
                                            {(() => {
                                                const parsedTextAnnotation = parseTextAnnotation(imageData[startIndex]);
                                                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                                    <div
                                                        className="absolute pointer-events-none"
                                                        style={{
                                                            left: `${parsedTextAnnotation?.position.x}%`,
                                                            top: `${parsedTextAnnotation?.position.y}%`,
                                                            transform: 'translate(-50%, -50%)',
                                                            color: parsedTextAnnotation?.style?.color || '#ffffff',
                                                            fontSize: parsedTextAnnotation?.style?.fontSize || '24px',
                                                            fontFamily:
                                                                parsedTextAnnotation?.style?.fontFamily ||
                                                                'Arial, sans-serif',
                                                            fontWeight: parsedTextAnnotation?.style?.fontWeight || 'normal',
                                                            textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            whiteSpace: 'nowrap',
                                                            textAlign: 'center',
                                                            boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                                        }}
                                                    >
                                                        {parsedTextAnnotation?.textContent}
                                                    </div>
                                                ) : null;
                                            })()}

                                            {/* Image index label */}
                                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded">
                                                {startIndex + 1} of {imageData.length}
                                            </div>
                                        </div>
                                    );
                            }
                        })()
                    ) : (
                        // Single layout - render single image
                        <div
                            onClick={() => onImageSelect && onImageSelect(imageData[startIndex], startIndex)}
                            style={getContainerStyle(imageData[startIndex])}
                            className={`aspect-square w-full max-w-md rounded-lg overflow-hidden relative cursor-pointer transition-all duration-200 ${selectedImageIndex === startIndex
                                ? 'border-4 border-orange-500 shadow-lg scale-105'
                                : 'border-2 border-white hover:border-orange-300 hover:shadow-md'
                                }`}
                        >
                            <div
                                style={{
                                    width: `${(imageData[startIndex]?.metadata?.zoom || 1.0) * 100}%`,
                                    height: `${(imageData[startIndex]?.metadata?.zoom || 1.0) * 100}%`,
                                    position: 'relative',
                                }}
                            >
                                <img
                                    src={imageData[startIndex].s3Url}
                                    alt={`Image ${startIndex + 1}`}
                                    className="w-full h-full object-cover"
                                    style={getImageStyle(imageData[startIndex])}
                                />
                            </div>

                            {/* Text Annotation for single layout */}
                            {(() => {
                                const parsedTextAnnotation = parseTextAnnotation(imageData[startIndex]);
                                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: `${parsedTextAnnotation?.position.x}%`,
                                            top: `${parsedTextAnnotation?.position.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            color: parsedTextAnnotation?.style?.color || '#ffffff',
                                            fontSize: parsedTextAnnotation?.style?.fontSize || '24px',
                                            fontFamily:
                                                parsedTextAnnotation?.style?.fontFamily ||
                                                'Arial, sans-serif',
                                            fontWeight: parsedTextAnnotation?.style?.fontWeight || 'normal',
                                            textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center',
                                            boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        {parsedTextAnnotation?.textContent}
                                    </div>
                                ) : null;
                            })()}

                            {/* Image index label */}
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded">
                                {startIndex + 1} of {imageData.length}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (totalSlides === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Images Yet</h3>
                    <p className="text-gray-600">Add some photos to start editing your album</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Main slider content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="relative w-full max-w-4xl">
                    {/* Navigation buttons */}
                    <button
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>

                    <button
                        onClick={nextSlide}
                        disabled={currentSlide >= totalSlides - 1}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={24} className="text-gray-600" />
                    </button>

                    {/* Page content */}
                    <div className="px-16">
                        {renderPageContent(currentSlide)}
                    </div>
                </div>
            </div>

            {/* Page indicators with slide counter */}
            <div className="flex flex-col items-center space-y-2 p-4">
                <div className="text-sm text-gray-500 font-medium">
                    Slide {currentSlide + 1} of {totalSlides} • {currentPageLayout.charAt(0).toUpperCase() + currentPageLayout.slice(1)} Layout
                </div>
                <div className="flex justify-center items-center space-x-2">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                                ? 'bg-blue-600 scale-125'
                                : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageSlider;
