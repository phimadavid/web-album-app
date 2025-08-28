'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Layout } from 'lucide-react';
import { AlbumDataProps } from '../data-types/types';
import styles from './page-slider.module.css';

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
    pageLayouts,
    onPageLayoutChange,
    selectedImageIndex,
    onImageSelect,
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showLayoutSelector, setShowLayoutSelector] = useState<{ pageIndex: number } | null>(null);

    const imageData = albumData?.images || [];

    // Available layout templates
    const availableLayouts = ['single', 'sidebyside', 'multiple', 'magazine', 'palaroid', 'Timeline', 'random'];

    // Use the global layout from albumData
    const getGlobalLayout = () => {
        if (pageLayouts && pageLayouts.length > 0) {
            return pageLayouts[currentSlide] || albumData?.layoutPage || 'single';
        }
        return albumData?.layoutPage || 'single';
    };

    const currentPageLayout = getGlobalLayout();

    // Calculate images per page
    const getImagesPerPage = (layout: string) => {
        switch (layout) {
            case 'multiple': return 4;
            case 'sidebyside': return 2;
            case 'magazine': return 4;
            case 'palaroid': return 4;
            case 'Timeline': return 3;
            default: return 1;
        }
    };

    // Calculate total slides - each slide shows 2 pages (left and right)
    const calculateTotalSlides = () => {
        const globalLayout = albumData?.layoutPage || 'single';
        const imagesPerPage = getImagesPerPage(globalLayout);
        const imagesPerSlide = imagesPerPage * 2; // 2 pages per slide
        return Math.ceil(imageData.length / imagesPerSlide);
    };

    const totalSlides = calculateTotalSlides();

    // Calculate current slide based on currentPage
    useEffect(() => {
        const slideIndex = Math.max(0, Math.floor((currentPage - 2) / 2));
        if (slideIndex < totalSlides && slideIndex >= 0) {
            setCurrentSlide(slideIndex);
        }
    }, [currentPage, totalSlides]);

    const goToSlide = (slideIndex: number) => {
        if (slideIndex >= 0 && slideIndex < totalSlides) {
            setCurrentSlide(slideIndex);
            if (onPageChange) {
                onPageChange(slideIndex * 2 + 2);
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

    const handleLayoutChange = (newLayout: string, pageIndex: number) => {
        if (onPageLayoutChange) {
            // Calculate the actual page number for this specific page
            const actualPageIndex = currentSlide * 2 + pageIndex;
            onPageLayoutChange(actualPageIndex, newLayout);
        }
        setShowLayoutSelector(null);
    };

    // Get layout for specific page
    const getLayoutForPage = (slideIndex: number, pageIndex: number) => {
        if (pageLayouts && pageLayouts.length > 0) {
            const actualPageIndex = slideIndex * 2 + pageIndex;
            return pageLayouts[actualPageIndex] || albumData?.layoutPage || 'single';
        }
        return albumData?.layoutPage || 'single';
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
                                className={`absolute z-30 ${styles.resizableTextContainer}`}
                                style={{
                                    left: `${parsedTextAnnotation?.position.x}%`,
                                    top: `${parsedTextAnnotation?.position.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: '120px',
                                    height: '60px',
                                    color: parsedTextAnnotation?.style?.color || '#ffffff',
                                    fontFamily:
                                        parsedTextAnnotation?.style?.fontFamily ||
                                        'Arial, sans-serif',
                                    fontSize: parsedTextAnnotation?.style?.fontSize || '16px',
                                    fontWeight: parsedTextAnnotation?.style?.fontWeight || 'normal',
                                    textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                                    pointerEvents: 'auto',
                                }}
                                title="Drag to move, resize with ↘ handle"
                            >
                                <div
                                    className={styles.textContent}
                                    contentEditable={true}
                                    suppressContentEditableWarning={true}
                                    style={{
                                        outline: 'none',
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: parsedTextAnnotation?.textContent || ''
                                    }}
                                />
                            </div>
                        )}
                </div>
            </div>
        );
    };

    const renderImageGrid = (images: any[], startIndex: number, layout: string) => {
        const imagesPerPage = getImagesPerPage(layout);
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

    const renderSingleImage = (startIndex: number) => {
        if (startIndex >= imageData.length) return (
            <div className="w-full aspect-square flex flex-col justify-center items-center p-6 shadow-lg bg-gray-100 rounded-lg">
                <div className="text-center">
                    <h3 className="text-base font-semibold text-gray-800 mb-2">No Image</h3>
                    <p className="text-sm text-gray-600">This page has no image</p>
                </div>
            </div>
        );

        const image = imageData[startIndex];
        const parsedTextAnnotation = parseTextAnnotation(image);
        const isSelected = selectedImageIndex === startIndex;

        return (
            <div
                onClick={() => onImageSelect && onImageSelect(image, startIndex)}
                style={getContainerStyle(image)}
                className={`aspect-square w-full max-w-sm overflow-hidden relative cursor-pointer transition-all duration-200 rounded-lg ${isSelected
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
                        alt={`Image ${startIndex + 1}`}
                        className="w-full h-full object-cover"
                        style={getImageStyle(image)}
                    />
                </div>

                {/* Text Annotation */}
                {parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left: `${parsedTextAnnotation?.position.x}%`,
                            top: `${parsedTextAnnotation?.position.y}%`,
                            transform: 'translate(-50%, -50%)',
                            color: parsedTextAnnotation?.style?.color || '#ffffff',
                            fontSize: parsedTextAnnotation?.style?.fontSize || '20px',
                            fontFamily: parsedTextAnnotation?.style?.fontFamily || 'Arial, sans-serif',
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

                {/* Image index label */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded">
                    {startIndex + 1} of {imageData.length}
                </div>
            </div>
        );
    };

    // Calculate start index for current slide (2 pages per slide)
    const getStartIndexForSlide = (slideIndex: number, pageIndex: number) => {
        const globalLayout = albumData?.layoutPage || 'single';
        const imagesPerPage = getImagesPerPage(globalLayout);
        return (slideIndex * 2 + pageIndex) * imagesPerPage;
    };

    const renderPageContent = (slideIndex: number, pageIndex: number, isLeftPage: boolean) => {
        const layout = getLayoutForPage(slideIndex, pageIndex);
        const startIndex = getStartIndexForSlide(slideIndex, pageIndex);
        const backgroundIndex = slideIndex * 2 + pageIndex;
        const pageBackground = pageBackgrounds[backgroundIndex] || albumData?.bookDesign;

        // Check if we have any images for this page
        const hasImages = startIndex < imageData.length;

        if (!hasImages) {
            return (
                <div className="w-full aspect-square flex flex-col justify-center items-center p-6 shadow-lg bg-gray-100 rounded-lg relative">
                    {/* Individual Layout selector button for each page */}
                    <button
                        onClick={() => setShowLayoutSelector({ pageIndex })}
                        className="absolute top-2 right-2 z-20 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                        title={`Change Layout for ${isLeftPage ? 'Left' : 'Right'} Page`}
                    >
                        <Layout size={12} className="text-gray-600" />
                    </button>

                    <div className="text-center">
                        <h3 className="text-base font-semibold text-gray-800 mb-2">No Images</h3>
                        <p className="text-sm text-gray-600">{isLeftPage ? 'Left' : 'Right'} page has no images</p>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="w-full aspect-square flex flex-col justify-center items-center p-4 shadow-lg relative rounded-lg"
                style={{
                    background: pageBackground
                        ? `url("${pageBackground}") no-repeat center/cover`
                        : albumData?.bookDesign
                            ? `url("${albumData?.bookDesign}") no-repeat center/cover`
                            : `linear-gradient(135deg, #8B4513 0%, #4A230C 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Individual Layout selector button for each page */}
                <button
                    onClick={() => setShowLayoutSelector({ pageIndex })}
                    className="absolute top-2 right-2 z-20 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    title={`Change Layout for ${isLeftPage ? 'Left' : 'Right'} Page`}
                >
                    <Layout size={12} className="text-gray-600" />
                </button>

                {/* Page indicator */}
                <div className="absolute top-2 left-2 z-20 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {isLeftPage ? 'Left' : 'Right'} • {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </div>

                {/* Render content based on layout */}
                <div className="w-full h-full flex justify-center items-center relative">
                    {layout === 'multiple' ? (
                        renderImageGrid(imageData, startIndex, layout)
                    ) : layout === 'single' ? (
                        renderSingleImage(startIndex)
                    ) : (
                        renderSingleImage(startIndex)
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
                <div className="relative w-full max-w-6xl">
                    {/* Individual Layout selector dropdown */}
                    {showLayoutSelector && (
                        <div
                            className="absolute z-30 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-64"
                            style={{
                                top: '60px',
                                right: showLayoutSelector.pageIndex === 0 ? '60%' : '20%',
                            }}
                        >
                            <div className="text-xs font-medium text-gray-700 mb-3 px-1">
                                Choose Layout for {showLayoutSelector.pageIndex === 0 ? 'Left' : 'Right'} Page:
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {availableLayouts.map((layoutOption) => {
                                    const currentPageLayout = getLayoutForPage(currentSlide, showLayoutSelector.pageIndex);
                                    return (
                                        <button
                                            key={layoutOption}
                                            onClick={() => handleLayoutChange(layoutOption, showLayoutSelector.pageIndex)}
                                            className={`p-2 text-xs rounded-md transition-all hover:scale-105 ${currentPageLayout === layoutOption
                                                ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                                                : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                                }`}
                                        >
                                            {layoutOption.charAt(0).toUpperCase() + layoutOption.slice(1)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <button
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>

                    <button
                        onClick={nextSlide}
                        disabled={currentSlide >= totalSlides - 1}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={24} className="text-gray-600" />
                    </button>

                    {/* Page content - Show 2 pages side by side */}
                    <div className="px-20">
                        <div className="flex gap-6 justify-center items-center">
                            {/* Left Page */}
                            <div className="flex-1 max-w-md">
                                {renderPageContent(currentSlide, 0, true)}
                            </div>

                            {/* Spine/Center divider */}
                            <div className="w-4 bg-gradient-to-r from-gray-300 to-gray-400 h-96 rounded-sm shadow-md flex-shrink-0"></div>

                            {/* Right Page */}
                            <div className="flex-1 max-w-md">
                                {renderPageContent(currentSlide, 1, false)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page indicators with slide counter */}
            <div className="flex flex-col items-center space-y-2 p-4">
                <div className="text-sm text-gray-500 font-medium">
                    Slide {currentSlide + 1} of {totalSlides} • {currentPageLayout.charAt(0).toUpperCase() + currentPageLayout.slice(1)} Layout • 2 Pages per Slide
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
