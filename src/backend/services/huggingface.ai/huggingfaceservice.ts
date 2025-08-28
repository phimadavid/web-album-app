import { inferLocationFromTimeZone } from "@/backend/helpers/inferlocation";
import { EnhancedFile } from "@/backend/types/image";

/**
 * Process an image using the approach provided in your code snippet
 * This uses the Hugging Face router approach which may be more reliable
 * @param file Image file to process
 * @returns Enhanced file with caption metadata
 ***/

export async function processImageWithHuggingFace(
   file: File
): Promise<EnhancedFile> {
   try {
      // Create basic enhanced file
      const enhancedFile: EnhancedFile = {
         ...file,
         originalFile: file,
         filename: file.name,
         preview: URL.createObjectURL(file),
         metadata: {
            captureDate: file.lastModified
               ? new Date(file.lastModified)
               : undefined,
            labels: [],
            tags: [],
         },
         height: 0,
         width: 0,
      };

      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      enhancedFile.width = dimensions.width;
      enhancedFile.height = dimensions.height;

      // Get image caption using the router approach
      // const caption = await getCaptionFromAPI(file);

      // if (caption) {
      //   // Extract potential labels from the caption
      //   const words = caption
      //     .split(' ')
      //     .map((word) => word.toLowerCase())
      //     .filter((word) => word.length > 3) // Filter out short words
      //     .map((word) => word.replace(/[.,;:!?]$/g, '')); // Remove punctuation

      //   // Get unique words as potential tags
      //   const uniqueWords = [...new Set(words)];

      //   // Update the metadata
      //   enhancedFile.metadata = {
      //     ...enhancedFile.metadata,
      //     caption: caption,
      //     labels: uniqueWords.slice(0, 5).map((word) => ({
      //       description: word,
      //     })), // Use top 5 words as labels
      //     tags: uniqueWords,
      //   };
      // }

      return enhancedFile;
   } catch (error) {
      console.error("Error processing image with Hugging Face Router:", error);
      return {
         ...file,
         originalFile: file,
         filename: file.name,
         preview: URL.createObjectURL(file),
         metadata: {
            captureDate: file.lastModified
               ? new Date(file.lastModified)
               : undefined,
         },
         height: 0,
         width: 0,
      };
   }
}

/** Gets the dimensions of an image file***/
async function getImageDimensions(
   file: File
): Promise<{ width: number; height: number }> {
   return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
         resolve({
            width: img.width,
            height: img.height,
         });
         URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
         reject(new Error("Failed to load image"));
         URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
   });
}

/** Gets the Timezone of an image file***/
export async function processImageWithTimeZone(
   file: File
): Promise<EnhancedFile> {
   const enhancedFile: EnhancedFile = {
      ...file,
      originalFile: file,
      filename: file.name,
      preview: URL.createObjectURL(file),
      metadata: {
         captureDate: file.lastModified
            ? new Date(file.lastModified)
            : undefined,
      },
      height: 0,
      width: 0,
   };

   // Add location based on time zone
   if (enhancedFile.metadata?.captureDate) {
      const locationData = inferLocationFromTimeZone(
         enhancedFile.metadata.captureDate
      );

      if (locationData) {
         enhancedFile.metadata.location = {
            name: locationData.region,
            coordinates: locationData.coordinates,
            confidence:
               locationData.accuracy >= 0.8
                  ? 0.8
                  : locationData.accuracy >= 0.5
                    ? 0.5
                    : 0.3,
            source: "time-zone-inference" as string,
         };
      }
   }

   return enhancedFile;
}

/**
 * Organize images by location based on Vision API results
 * @param images Array of enhanced files
 * @returns Organized array of enhanced files
 */

export function organizeImagesByLocation(
   images: EnhancedFile[]
): EnhancedFile[] {
   // Group images by location name
   const locationGroups: { [key: string]: EnhancedFile[] } = {};

   // First add images with location data
   images.forEach(img => {
      if (img.metadata?.location?.name) {
         const locationKey = img.metadata.location.name;
         if (!locationGroups[locationKey]) {
            locationGroups[locationKey] = [];
         }
         locationGroups[locationKey].push(img);
      }
   });

   // Then add images without location data at the end
   const withLocation = Object.values(locationGroups).flat();
   const withoutLocation = images.filter(img => !img.metadata?.location?.name);

   return [...withLocation, ...withoutLocation];
}

/**
 * Get caption by calling the Next.js API route
 */
async function getCaptionFromAPI(file: File): Promise<string> {
   try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Call the API route
      const response = await fetch("/api/caption", {
         method: "POST",
         body: formData,
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(`API error: ${response.status} - ${errorData.error}`);
      }

      const result = await response.json();
      return result.caption || "";
   } catch (error) {
      console.error("Error getting image caption from API:", error);
      return "";
   }
}

/**
 * Get caption using the Hugging Face router approach
 * This uses the approach from your code snippet
 */

// async function getCaptionWithRouter(file: File): Promise<string> {
//     try {
//         const arrayBuffer = await file.arrayBuffer(); // --> Convert file to appropriate format
//         const blob = new Blob([arrayBuffer], { type: file.type });
//         const apiKey = process.env.NEXT_PUBLIC_HF_API_KEY; // --> The API key

//         if (!apiKey) {
//             console.log('No Hugging Face API key found in environment');
//             return '';
//         }

//         /***
//          * Try this model the response data format is different from the previous one
//          * only response data structure is labels
//          *
//          * Enference API .../google/vit-base-patch16-224
//          */

//         // Hugging Face router endpoint
//         const response = await fetch(
//             "https://router.huggingface.co/hf-inference/models/nlpconnect/vit-gpt2-image-captioning",
//             {
//                 headers: {
//                     Authorization: `Bearer ${apiKey}`,
//                     "Content-Type": file.type // Use the file's content type (e.g., "image/jpeg")
//                 },
//                 method: "POST",
//                 body: blob, // Send the blob directly
//             }
//         );

//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
//         }

//         const result = await response.json();

//         // Handle the response based on its format
//         if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
//             return result[0].generated_text;
//         } else if (typeof result === 'object' && result.generated_text) {
//             return result.generated_text;
//         } else {
//             return '';
//         }

//     } catch (error) {
//         console.error('Error getting image caption:', error);
//         return '';
//     }
// }
