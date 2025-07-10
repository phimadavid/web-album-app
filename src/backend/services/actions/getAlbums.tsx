
import { useState, useEffect } from 'react';
import axios from 'axios';
import { TextAnnotation } from '@/backend/types/image';
import { AlbumDataProps, ImageDataProps } from '@/app/edit/data-types/types';

export const useAlbumData = (albumId: string) => {
  const [albumData, setAlbumData] = useState<AlbumDataProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageBackgrounds, setPageBackgrounds] = useState<string[]>([]);
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const albumName = await axios.get(`/api/album/${albumId}`);
        const bookName = albumName?.data?.name;

        const endpoints = {
          format: `/api/createalbum/${albumId}`,
          images: `/api/images/${albumId}`,
          designs: `/api/book/${albumId}`,
          layout: `/api/book-layout/${albumId}`,
        };

        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const [albumResponse, imagesResponse, designResponse, layoutResponse] =
          await axios.all([
            axios.get(`${endpoints.format}?t=${timestamp}`),
            axios.get(`${endpoints.images}?t=${timestamp}`),
            axios.get(`${endpoints.designs}?t=${timestamp}`),
            axios.get(`${endpoints.layout}?t=${timestamp}`),
          ]);

        const albumDataFormat = albumResponse.data;
        const imagesData = imagesResponse.data;
        const designData = designResponse.data;
        const layoutData = layoutResponse.data;

        const layoutValue = typeof layoutData === 'string'
          ? layoutData
          : (layoutData?.layout || layoutData?.layoutType || 'single');

        const mappedImages: Array<{ previewurl: string }> = imagesData.map(
          (img: ImageDataProps) => ({
            previewurl: img.previewUrl,
          })
        );

        setPageBackgrounds(Array(mappedImages.length).fill(''));
        setCustomPrompts(Array(mappedImages.length).fill(''));

        setAlbumData({
          bookName: bookName,
          webSizePx: albumDataFormat.webSizePx,
          webPhotoSizePx: albumDataFormat.webPhotoSizePx,
          layoutPage: layoutValue,
          images: imagesData,
          bookDesign: designData.data.templateImage,
        });
      } catch (error) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching album data:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [albumId]);

  const handleSaveAlbumName = async (newName: string): Promise<void> => {
    try {
      // Make API call to update the album name
      await axios.patch(`/api/album/${albumId}`, {
        name: newName,
      });

      console.log('Album name updated successfully');
    } catch (error) {
      console.error('Failed to update album name:', error);
    }
  };

  // Save updated text annotation
  // const handleSaveTextAnnotation = useCallback(
  //   async (
  //     updatedAnnotation: TextAnnotation,
  //     imageIndex: number
  //   ): Promise<void> => {
  //     try {
  //       if (!albumData?.images?.[imageIndex]?.id) {
  //         console.error('Image ID not found');
  //         return;
  //       }

  //       // Create a deep copy of the albumData to avoid direct state mutations
  //       const updatedAlbumData = { ...albumData };
  //       const updatedImages = [...(updatedAlbumData.images || [])];

  //       // Make sure metadata exists
  //       if (!updatedImages[imageIndex].metadata) {
  //         updatedImages[imageIndex].metadata = {};
  //       }

  //       // Update the text annotation in the image metadata
  //       updatedImages[imageIndex].metadata.textAnnotation = updatedAnnotation;

  //       // Update the albumData state
  //       updatedAlbumData.images = updatedImages;
  //       setAlbumData(updatedAlbumData);

  //       // Send the update to the server
  //       const imageId: string = albumData.images[imageIndex].id;
  //       console.log("🚀 ~ useAlbumData ~ imageId:", imageId)
  //       await axios.patch(`/api/image-annotation/${imageId}`, {
  //         textAnnotation: updatedAnnotation,
  //       });

  //       console.log('Text annotation updated successfully');
  //     } catch (error) {
  //       console.error('Failed to update text annotation:', error);
  //       // Error handling - you could set an error state here if needed
  //     }
  //   },
  //   [albumData, setAlbumData]
  // );

  return {
    albumData,
    isLoading,
    pageBackgrounds,
    customPrompts,
    error,
    setAlbumData,
    setIsLoading,
    setPageBackgrounds,
    setCustomPrompts,
    setError,
    handleSaveAlbumName,
    // handleSaveTextAnnotation,
  };
};
