"use client"
import React, { useState } from 'react';
import { EnhancedFile } from '@/backend/types/image';
import { CreateAlbumTypes } from '@/backend/types/album';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import AlbumWizard from '@/app/upload/wizard/album.wizard';

type ImageGalleryProps = {
    images: EnhancedFile[];
    params: { id: string };
}

const UploadedImagesGrid: React.FC<ImageGalleryProps> = ({ images, params }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="p-6 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-500">No images to display</p>
            </div>
        );
    }

    const handleComplete = async (albumData: CreateAlbumTypes) => {

        setIsLoading(true);

        try {
            const response = await fetch('/api/createalbum', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...albumData,
                    albumId: params.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                    errorData?.error || `Failed to create album: ${response.statusText}`
                );
            }

            router.push(`/layout/${params.id}`);

        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to create album'
            );
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='grid grid-cols-1 grid-rows-2 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className="min-h-xl col-start-1 md:col-start-1 col-span-3">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-end justify-center max-w-2xl mx-auto">
                        <h2 className="text-xl col-start-1 font-semibold mb-4 text-end">Upload Complete</h2>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Select Your Photo Album Format
                        </h1>

                        <p className="mt-2 text-gray-600 leading-6">
                            Your images have been successfully uploaded and are ready for the next step.
                            Follow the steps below to create your custom photo album.
                        </p>
                    </div>

                    <AlbumWizard onComplete={handleComplete} params={params} />

                    {isLoading && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="bg-white p-6 rounded-lg shadow-xl">
                                <div className="flex items-center space-x-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                    <p className="text-lg">Creating your album...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadedImagesGrid;

