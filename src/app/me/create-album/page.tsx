"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FallingLines } from 'react-loader-spinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, Upload, ImageIcon, Book } from 'lucide-react';
import Book3D from '../../terms/components/book3d';
import { withAuth } from '@/backend/withAuth';

interface ImageData {
    imageUrl: string;
    photographer: string;
    photographerUrl: string;
    pexelsUrl: string;
}

interface AlbumFormat {
    id: string;
    name: string;
    dimensions: string;
    photosize: string;
    webSizePx: string;
    webPhotoSizePx: string;
    coverType: string;
    paperQuality: string;
    description: string;
}

const albumFormats: AlbumFormat[] = [
    {
        id: 'standard',
        name: 'Standard Album',
        dimensions: '8x10',
        photosize: '4x6',
        webSizePx: '1920x1080',
        webPhotoSizePx: '800x600',
        coverType: 'hardcover',
        paperQuality: 'premium',
        description: 'Perfect for everyday memories'
    },
    {
        id: 'premium',
        name: 'Premium Album',
        dimensions: '11x14',
        photosize: '6x8',
        webSizePx: '2560x1440',
        webPhotoSizePx: '1200x800',
        coverType: 'hardcover',
        paperQuality: 'professional',
        description: 'High-quality professional album'
    },
    {
        id: 'mini',
        name: 'Mini Album',
        dimensions: '6x6',
        photosize: '3x3',
        webSizePx: '1080x1080',
        webPhotoSizePx: '600x600',
        coverType: 'softcover',
        paperQuality: 'standard',
        description: 'Compact and portable'
    }
];

export default function CreateAlbumPage() {
    const router = useRouter();
    const [backgroundImage, setBackgroundImage] = useState<ImageData | null>(null);
    const [albumName, setAlbumName] = useState('');
    const [selectedFormat, setSelectedFormat] = useState<AlbumFormat | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isLoading: authLoading, isAuthenticated, logout } = withAuth({
        role: 'user',
        redirectTo: '/signin',
    });

    useEffect(() => {
        const fetchRandomImage = async () => {
            try {
                const response = await fetch('/api/random-image');
                if (!response.ok) throw new Error('Failed to fetch image');
                const data = await response.json();
                setBackgroundImage(data);
            } catch (error) {
                console.error('Error fetching background image:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRandomImage();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!albumName.trim()) {
            setError('Album name is required');
            return;
        }

        if (!selectedFormat) {
            setError('Please select an album format');
            return;
        }

        if (!termsAccepted) {
            setError('You must accept the terms and conditions');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const albumData = {
                name: albumName,
                termsAccepted: termsAccepted,
                status: 'draft',
                format: selectedFormat.id,
                dimensions: selectedFormat.dimensions,
                photosize: selectedFormat.photosize,
                webSizePx: selectedFormat.webSizePx,
                webPhotoSizePx: selectedFormat.webPhotoSizePx,
                coverType: selectedFormat.coverType,
                paperQuality: selectedFormat.paperQuality,
            };

            const response = await fetch('/api/me/albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(albumData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create album');
            }

            const result = await response.json();

            // Redirect to album dashboard or design page
            router.push(`/me/dashboard`);
        } catch (error) {
            console.error('Error creating album:', error);
            setError(error instanceof Error ? error.message : 'Failed to create album');
        } finally {
            setIsCreating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <FallingLines
                    color="#4fa94d"
                    width="100"
                    visible={true}
                    aria-label="falling-circles-loading"
                />
                <p className="mt-4 text-gray-600">Loading...</p>
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
        <div className="min-h-screen sm:min-h-[650px] relative bg-gray-50">
            {/* Background Image */}
            {backgroundImage && (
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <Image
                        src={backgroundImage.imageUrl}
                        alt="Background"
                        fill
                        className="object-cover blur-sm brightness-40"
                        priority
                    />
                </div>
            )}

            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            Create Your Album
                        </h1>
                        <p className="text-white/80 text-lg">
                            Design a beautiful album to preserve your memories
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Album Name Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="p-6 bg-white/90 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 flex items-center">
                                    <Book className="mr-2 h-5 w-5 text-blue-600" />
                                    Album Details
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Album Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={albumName}
                                            onChange={(e) => setAlbumName(e.target.value)}
                                            placeholder="Enter your album name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Format Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="p-6 bg-white/90 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 flex items-center">
                                    <ImageIcon className="mr-2 h-5 w-5 text-blue-600" />
                                    Select Album Format
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {albumFormats.map((format) => (
                                        <div
                                            key={format.id}
                                            onClick={() => setSelectedFormat(format)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedFormat?.id === format.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium text-gray-900">{format.name}</h3>
                                                {selectedFormat?.id === format.id && (
                                                    <Check className="h-5 w-5 text-blue-600" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                                            <div className="text-xs text-gray-500">
                                                <p>Dimensions: {format.dimensions}</p>
                                                <p>Photo Size: {format.photosize}</p>
                                                <p>Cover: {format.coverType}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Terms and Conditions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="p-6 bg-white/90 backdrop-blur-sm">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-700">
                                        I accept the{' '}
                                        <a href="/terms" className="text-blue-600 hover:text-blue-800">
                                            terms and conditions
                                        </a>
                                    </label>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md"
                            >
                                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                <span className="text-red-700">{error}</span>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex justify-center"
                        >
                            <Button
                                type="submit"
                                disabled={isCreating}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? (
                                    <>
                                        <FallingLines
                                            color="#ffffff"
                                            width="20"
                                            visible={true}
                                            aria-label="creating-album"
                                        />
                                        <span className="ml-2">Creating Album...</span>
                                    </>
                                ) : (
                                    'Create Album'
                                )}
                            </Button>
                        </motion.div>
                    </form>
                </div>
            </main>
        </div>
    );
}
