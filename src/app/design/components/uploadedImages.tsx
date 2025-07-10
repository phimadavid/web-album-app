"use client"
import React, { useState } from 'react';
import { UploadedImagesGalleryProps } from '../types/uploaded.data';
import { ChevronRight } from 'lucide-react';

const UploadedImagesGallery: React.FC<UploadedImagesGalleryProps> = ({ images, onSetCoverImage }) => {
    const [loadingCoverId, setLoadingCoverId] = useState<string | null>(null);

    if (!images || images.length === 0) return (
        <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
            <p className="text-gray-500">No images uploaded yet</p>
        </div>
    );

    return (
        <div className="w-full py-5">
            <div className="overflow-x-auto pb-4">
                <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
                    {images.map((file, index) => {
                        let parsedTextAnnotation = null;
                        if (file.metadata?.textAnnotation) {
                            try {
                                parsedTextAnnotation = typeof file.metadata.textAnnotation === 'string'
                                    ? JSON.parse(file.metadata.textAnnotation)
                                    : file.metadata.textAnnotation;
                            } catch (error) {
                                console.error('Error parsing textAnnotation:', error);
                            }
                        }

                        const getImageStyle = () => {
                            let style: React.CSSProperties = {};

                            if (file.metadata?.rotation) {
                                style.transform = `rotate(${file.metadata.rotation}deg)`;
                            }

                            if (file.metadata?.zoom || 1.0 > 1.0) {
                                style = {
                                    ...style,
                                    transform: `${style.transform ? style.transform : ''} scale(${file.metadata?.zoom})`,
                                    transformOrigin: `${file.metadata?.zoomPosition?.x || 50}% ${file.metadata?.zoomPosition?.y || 50}%`
                                };
                                style.objectFit = 'cover';
                            }
                            return style;
                        };


                        return (
                            <div
                                key={file.id}
                                className="relative flex-shrink-0 w-40 h-40 rounded-lg overflow-hidden border border-gray-200 group hover:shadow-md transition-shadow"
                            >
                                <div className="relative group col-start-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-square">
                                    {file.metadata?.isCover && (
                                        <div className="absolute top-2 left-2 z-40 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
                                            Cover
                                        </div>
                                    )}

                                    <div className="w-full h-full relative overflow-hidden">
                                        <img
                                            src={file.s3Url}
                                            alt={file.filename || `Image ${index + 1}`}
                                            className="absolute w-full h-full object-contain"
                                            style={getImageStyle()}
                                        />
                                    </div>

                                    {parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent && (
                                        <div
                                            className="absolute pointer-events-none"
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
                                                boxShadow: '0 0 8px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            {parsedTextAnnotation.textContent}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setLoadingCoverId(file.id);
                                            onSetCoverImage(file.id);
                                        }}
                                        className={`mt-2 px-2 py-1 rounded text-xs font-medium ${file.metadata?.isCover
                                            ? 'bg-blue-700 text-white cursor-default'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                            }`}
                                        disabled={file.metadata?.isCover || loadingCoverId === file.id}
                                    >
                                        {file.metadata?.isCover
                                            ? 'Current Cover'
                                            : loadingCoverId === file.id
                                                ? 'Setting...'
                                                : 'Set as Cover'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center mt-2">
                <span className="text-xs text-gray-500 flex items-center">
                    <ChevronRight size={20} className='text-gray-700' />
                    Scroll for more
                </span>
            </div>
        </div>
    );
};

export default UploadedImagesGallery;

