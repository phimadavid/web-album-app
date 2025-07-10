"use client"
import { EnhancedFile } from '@/backend/types/image';
import { Cloud, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

type addPhotoViewGridProps = {
    images: EnhancedFile[];
    onClose: () => void
};

const AddPhotoViewGrid: React.FC<addPhotoViewGridProps> = ({ images, onClose }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    if (!images || images.length === 0) {
        return (
            <div className="p-6 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-500">No images to display</p>
            </div>
        );
    }

    const handleSave = () => {
        setIsRefreshing(true);

        // Close the modal first
        onClose();

        // Force a refresh of the page to reload the FlippingBook
        setTimeout(() => {
            router.refresh();
            setIsRefreshing(false);
        }, 500);
    };

    return (
        <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className="overflow-y-auto px-3" style={{ maxHeight: 'calc(170vh - 250px)', maxWidth: '100%' }}>
                    <div className="min-w-max">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                            {images.map((file, index) => {
                                // Normalize text annotation position if it's outside the 0-1 range
                                if (file.metadata?.textAnnotation?.position) {
                                    if (file.metadata.textAnnotation.position.y > 1) {
                                        file.metadata.textAnnotation.position.y =
                                            file.metadata.textAnnotation.position.y > 100
                                                ? file.metadata.textAnnotation.position.y / 1000
                                                : file.metadata.textAnnotation.position.y / 100;
                                    }
                                    if (file.metadata.textAnnotation.position.x > 1) {
                                        file.metadata.textAnnotation.position.x =
                                            file.metadata.textAnnotation.position.x > 100
                                                ? file.metadata.textAnnotation.position.x / 1000
                                                : file.metadata.textAnnotation.position.x / 100;
                                    }
                                }

                                // Compute transform styles safely - Always apply zoom if present
                                const rotationTransform = file.metadata?.rotation ? `rotate(${file.metadata.rotation}deg)` : '';
                                const zoomTransform = file.metadata?.zoom ? `scale(${file.metadata.zoom})` : '';
                                const combinedTransform = `${rotationTransform} ${zoomTransform}`.trim();

                                // Handle zoom position correctly - don't multiply by 100 if values are already percentages
                                let transformOrigin = 'center center';
                                if (file.metadata?.zoomPosition) {
                                    // Check if values are already in percentage format (>1)
                                    const x = file.metadata.zoomPosition.x;
                                    const y = file.metadata.zoomPosition.y;

                                    // If values are already percentages (like 50), use directly
                                    if (x >= 1 && y >= 1) {
                                        transformOrigin = `${x}% ${y}%`;
                                    }
                                    // If values are decimals (like 0.5), convert to percentages
                                    else {
                                        transformOrigin = `${x * 100}% ${y * 100}%`;
                                    }
                                }

                                return (
                                    <div
                                        key={index}
                                        className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-square"
                                    >
                                        {file.metadata?.isCover && (
                                            <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
                                                Cover
                                            </div>
                                        )}

                                        <div className="w-full h-full relative overflow-hidden">
                                            <img
                                                src={file.preview || ''}
                                                alt={file.filename || `Image ${index + 1}`}
                                                className="absolute w-full h-full object-contain"
                                                style={{
                                                    transform: combinedTransform || 'none',
                                                    transformOrigin: transformOrigin
                                                }}
                                            />
                                        </div>

                                        {/* Text Annotation - with improved visibility */}
                                        {file.metadata?.textAnnotation && file.metadata.textAnnotation.position && file.metadata.textAnnotation.textContent && (
                                            <div
                                                className="absolute z-30 pointer-events-none"
                                                style={{
                                                    left: `${file.metadata.textAnnotation.position.x * 100}%`,
                                                    top: `${file.metadata.textAnnotation.position.y * 100}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    color: file.metadata.textAnnotation.style?.color || '#ffffff',
                                                    fontSize: file.metadata.textAnnotation.style?.fontSize || '24px',
                                                    fontFamily: file.metadata.textAnnotation.style?.fontFamily || 'Arial, sans-serif',
                                                    fontWeight: file.metadata.textAnnotation.style?.fontWeight || 'normal',
                                                    textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '80%',
                                                    textAlign: 'center',
                                                    boxShadow: '0 0 8px rgba(0,0,0,0.5)'
                                                }}
                                            >
                                                {file.metadata.textAnnotation.textContent}
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 z-20">
                                            <div className="bg-green-100 p-1.5 rounded-full">
                                                <Cloud size={16} className="text-green-600" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleSave}
                    disabled={isRefreshing}
                    className="flex items-center justify-center bg-blue-600 h-10 px-6 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isRefreshing ? (
                        <>
                            <RefreshCw size={18} className="mr-2 animate-spin" />
                            Refreshing...
                        </>
                    ) : (
                        "Save & View Book"
                    )}
                </button>
            </div>
        </>
    );
};

export default AddPhotoViewGrid;
