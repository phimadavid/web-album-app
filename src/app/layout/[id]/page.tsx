'use client';

import axios from 'axios';
import React, { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { ImageArrangementLayoutProps } from '../types';
import ImageAlbumLayoutSelector from "../image.layout.selector";

const page: React.FC<ImageArrangementLayoutProps> = ({ params }) => {
    const [uploadedImages, setUploadedImages] = React.useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const { data, status } = await axios.get(`/api/images/${params.id}`);
                if (status !== 200) {
                    throw new Error('Network response was not ok');
                }
                setUploadedImages(data);
            } catch (error) {
                console.error('Error fetching images:', error);
            }
        };
        fetchImages();
    }, [params.id])

    const handleLayoutSelect = async (layout: string) => {
        try {
            // Create or update the layout selection
            await axios.post(`/api/book-layout/${params.id}`, { layout, albumId: params.id });

            // Update the layout configuration
            await axios.patch(`/api/book-layout/${params.id}`, {
                layout,
                albumId: params.id
            });
        } catch (error) {
            console.error('Error updating layout:', error);
        }
    };

    const handleViewTemplates = () => {
        router.push(`/design/${params.id}`);
    };

    return (
        <main className="bg-gray-50 min-h-screen py-8">
            <ImageAlbumLayoutSelector
                params={params}
                totalImages={uploadedImages.length}
                onLayoutSelect={handleLayoutSelect}
                onViewTemplates={handleViewTemplates}
            />
        </main>
    );
};

export default page;
