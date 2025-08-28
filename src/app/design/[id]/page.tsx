"use client";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { FallingLines } from "react-loader-spinner";
import AutoTemplateGenerator from "../components/auto.template.generator";
import { ImageDataProps, TemplateGenerationProps } from "../types/template";

const TemplateGeneration: React.FC<TemplateGenerationProps> = ({ params }) => {
   const [images, setImages] = useState<ImageDataProps[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<Error | null>(null);

   useEffect(() => {
      const fetchCoverImages = async () => {
         if (!params.id) {
            setIsLoading(false);
            return;
         }

         setIsLoading(true);
         setError(null);

         try {
            const response = await axios.get(
               `/api/upload?albumId=${params.id}`
            );

            if (response.data && Array.isArray(response.data)) {
               let images = response.data.filter(
                  (image: ImageDataProps) => image && image.metadata
               );

               // Process textAnnotation strings into objects and replace blob URLs with persistent URLs
               images = images.map((image: ImageDataProps) => {
                  const processedImage = {
                     ...image,
                     height: image.height || 0,
                     width: image.width || 0,
                  };

                  // Replace blob URL with the persistent image URL
                  if (
                     processedImage.previewUrl &&
                     processedImage.previewUrl.startsWith("blob:")
                  ) {
                     processedImage.previewUrl =
                        processedImage.imageUrl ||
                        `/api/images/${processedImage.id}`;
                  }

                  // Parse textAnnotation if it's a string
                  if (
                     processedImage.metadata?.textAnnotation &&
                     typeof processedImage.metadata.textAnnotation === "string"
                  ) {
                     try {
                        processedImage.metadata.textAnnotation = JSON.parse(
                           processedImage.metadata.textAnnotation
                        );
                     } catch (err) {
                        console.error("Error parsing textAnnotation:", err);
                     }
                  }

                  // Parse event_tags if it's a string
                  if (
                     processedImage.metadata?.event_tags &&
                     typeof processedImage.metadata.event_tags === "string"
                  ) {
                     try {
                        processedImage.metadata.event_tags = JSON.parse(
                           processedImage.metadata.event_tags
                        );
                     } catch (err) {
                        console.error("Error parsing event_tags:", err);
                     }
                  }

                  return processedImage;
               });

               setImages(images);
            } else {
               throw new Error("Invalid response format from API");
            }
         } catch (err) {
            setError(
               err instanceof Error ? err : new Error("Failed to fetch images")
            );
            console.error("Error fetching images:", err);
            setImages([]);
         } finally {
            setIsLoading(false);
         }
      };

      fetchCoverImages();
   }, [params.id]);

   if (isLoading) {
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

   return (
      <div className="container min-h-[screen] max-w-full px-5">
         <div className="p-4">
            {error && (
               <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                  <p>Error loading images: {error.message}</p>
                  <p>Please check the Album ID and try again.</p>
               </div>
            )}

            {!params.id && !isLoading && (
               <div className="p-4 mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700">
                  <p>Please provide an Album ID to load cover images.</p>
               </div>
            )}

            {images.length > 0 && (
               <div>
                  <AutoTemplateGenerator albumId={params.id} Images={images} />
               </div>
            )}
         </div>
      </div>
   );
};

export default TemplateGeneration;
