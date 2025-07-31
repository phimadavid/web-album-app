"use client"
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FallingLines } from 'react-loader-spinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Eye } from 'lucide-react';

import { ImageDataProps, TemplateGenerationProps } from '../../../design/types/template';
import { withAuth } from '@/backend/withAuth';
import AddPhotos from '../../../edit/components/addphotos';
import AutoTemplateGenerator from '../../components/auto.template.generator';

const UserDesignPage: React.FC<TemplateGenerationProps> = ({ params }) => {
    const router = useRouter();
    const [images, setImages] = useState<ImageDataProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [albumData, setAlbumData] = useState<any>(null);
    const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
    const { isLoading: authLoading, isAuthenticated, logout } = withAuth({
        role: 'user',
        redirectTo: '/signin',
    });

    const fetchCoverImages = async () => {
        if (!params.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/upload?albumId=${params.id}`);

            if (response.data && Array.isArray(response.data)) {
                let images = response.data.filter((image: ImageDataProps) =>
                    image && image.metadata
                );

                // Process textAnnotation strings into objects and replace blob URLs with persistent URLs
                images = images.map((image: ImageDataProps) => {
                    const processedImage = {
                        ...image,
                        height: image.height || 0,
                        width: image.width || 0
                    };

                    // Replace blob URL with the persistent image URL
                    if (processedImage.previewUrl && processedImage.previewUrl.startsWith('blob:')) {
                        processedImage.previewUrl = processedImage.imageUrl || `/api/images/${processedImage.id}`;
                    }

                    // Parse textAnnotation if it's a string
                    if (processedImage.metadata?.textAnnotation &&
                        typeof processedImage.metadata.textAnnotation === 'string') {
                        try {
                            processedImage.metadata.textAnnotation = JSON.parse(
                                processedImage.metadata.textAnnotation
                            );
                        } catch (err) {
                            console.error('Error parsing textAnnotation:', err);
                        }
                    }

                    // Parse event_tags if it's a string
                    if (processedImage.metadata?.event_tags &&
                        typeof processedImage.metadata.event_tags === 'string') {
                        try {
                            processedImage.metadata.event_tags = JSON.parse(
                                processedImage.metadata.event_tags
                            );
                        } catch (err) {
                            console.error('Error parsing event_tags:', err);
                        }
                    }

                    return processedImage;
                });

                setImages(images);
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch images'));
            console.error('Error fetching images:', err);
            setImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchAlbumData = async () => {
            try {
                const response = await fetch('/api/me/albums');
                if (response.ok) {
                    const data = await response.json();
                    const album = data.data.find((a: any) => a.id === params.id);
                    setAlbumData(album);
                }
            } catch (err) {
                console.error('Error fetching album data:', err);
            }
        };

        if (isAuthenticated) {
            fetchAlbumData();
            fetchCoverImages();
        }
    }, [params.id, isAuthenticated]);

    const handleBackToDashboard = () => {
        router.push('/me/dashboard');
    };

    const handlePreview = () => {
        router.push(`/me/preview?albumId=${params.id}`);
    };

    const handleUploadPhotos = () => {
        setShowAddPhotosModal(true);
    };

    const handleCloseAddPhotosModal = () => {
        setShowAddPhotosModal(false);
        // Refresh the images after modal closes
        fetchCoverImages();
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <FallingLines
                    color="#4fa94d"
                    width="100"
                    visible={true}
                    aria-label="falling-circles-loading"
                />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg mb-4">Please login to access this page</div>
                    <Button
                        onClick={logout}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">

            {/* Main Content */}
            <div className="flex-1">
                {/* Header */}
                <div className="bg-white shadow-sm border-b p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {albumData?.name || 'Album Design'}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Design and customize your album
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={handleUploadPhotos}
                                className="flex items-center space-x-2"
                            >
                                <Upload className="h-4 w-4" />
                                <span>Upload Photos</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handlePreview}
                                className="flex items-center space-x-2"
                            >
                                <Eye className="h-4 w-4" />
                                <span>Preview</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container max-w-full px-5 py-4">
                    {error && (
                        <Card className="p-4 mb-4 bg-red-50 border-red-200">
                            <div className="text-red-700">
                                <p className="font-medium">Error loading images: {error.message}</p>
                                <p className="text-sm">Please check the Album ID and try again.</p>
                            </div>
                        </Card>
                    )}

                    {!params.id && !isLoading && (
                        <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
                            <div className="text-blue-700">
                                <p>Please provide an Album ID to load cover images.</p>
                            </div>
                        </Card>
                    )}

                    {images.length === 0 && !isLoading && !error && (
                        <Card className="p-8 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No photos uploaded yet
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Upload some photos to start designing your album
                            </p>
                            <Button
                                onClick={handleUploadPhotos}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Photos
                            </Button>
                        </Card>
                    )}

                    {images.length > 0 && (
                        <div>
                            <AutoTemplateGenerator
                                albumId={params.id}
                                Images={images}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Add Photos Modal */}
            {showAddPhotosModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Add Photos</h2>
                            <button
                                onClick={handleCloseAddPhotosModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto h-full">
                            <AddPhotos params={params} onClose={handleCloseAddPhotosModal} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDesignPage;
