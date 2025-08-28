import EXIF from "exif-js";
import { EnhancedFile, LocationData, ProgressCallback } from "../types/image";

/**
 * Map EXIF orientation values to rotation angles in degrees
 */
const orientationToRotation: Record<number, number> = {
   1: 0, // Normal orientation
   3: 180, // 180° rotation (upside-down)
   6: 90, // 90° clockwise rotation (portrait right)
   8: 270, // 270° clockwise rotation (portrait left)
};

/**
 * Rotates an image based on its EXIF orientation
 * @param {string} imgSrc - The image source URL
 * @param {number} orientation - The EXIF orientation value (1-8)
 * @returns {Promise<string>} - A promise that resolves to the rotated image URL
 */
export const rotateImageBasedOnOrientation = (
   imgSrc: string,
   orientation: number
): Promise<string> => {
   return new Promise((resolve, reject) => {
      // If orientation is normal (1) or invalid, just return the original
      if (!orientation || orientation === 1) {
         resolve(imgSrc);
         return;
      }

      const img = new Image();
      img.onload = () => {
         const canvas = document.createElement("canvas");
         const ctx = canvas.getContext("2d");

         if (!ctx) {
            console.error("Could not get canvas context");
            resolve(imgSrc);
            return;
         }

         // Set proper canvas dimensions before transform
         if ([5, 6, 7, 8].includes(orientation)) {
            // Swap width and height for 90° or 270° rotations
            canvas.width = img.height;
            canvas.height = img.width;
         } else {
            canvas.width = img.width;
            canvas.height = img.height;
         }

         // Transform context based on orientation
         switch (orientation) {
            case 2: // horizontal flip
               ctx.transform(-1, 0, 0, 1, canvas.width, 0);
               break;
            case 3: // 180° rotation
               ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height);
               break;
            case 4: // vertical flip
               ctx.transform(1, 0, 0, -1, 0, canvas.height);
               break;
            case 5: // vertical flip + 90 rotate right
               ctx.transform(0, 1, 1, 0, 0, 0);
               break;
            case 6: // 90° rotate right
               ctx.transform(0, 1, -1, 0, canvas.width, 0);
               break;
            case 7: // horizontal flip + 90 rotate right
               ctx.transform(0, -1, -1, 0, canvas.width, canvas.height);
               break;
            case 8: // 90° rotate left
               ctx.transform(0, -1, 1, 0, 0, canvas.height);
               break;
            default: // normal
               break;
         }

         // Draw image
         ctx.drawImage(img, 0, 0);

         // Convert to blob and resolve
         canvas.toBlob(
            blob => {
               if (blob) {
                  // Clean up the original URL
                  URL.revokeObjectURL(imgSrc);

                  // Create and return a new URL
                  resolve(URL.createObjectURL(blob));
               } else {
                  console.error("Failed to create blob from canvas");
                  resolve(imgSrc);
               }
            },
            "image/jpeg",
            0.95
         ); // Use high quality for the rotated image
      };

      img.onerror = () => {
         console.error("Failed to load image for rotation");
         resolve(imgSrc); // Fall back to original if there's an error
      };

      img.src = imgSrc;
   });
};

/**
 * Converts GPS coordinates from EXIF format (degrees, minutes, seconds) to decimal degrees
 */
export const convertDMSToDD = (
   degrees: number,
   minutes: number,
   seconds: number,
   direction: string
): number => {
   let dd = degrees + minutes / 60 + seconds / 3600;

   if (direction === "S" || direction === "W") {
      dd = dd * -1;
   }

   return dd;
};

/**
 * Extracts GPS data from EXIF tags
 */
export const parseGPSData = (tags: any): LocationData | null => {
   if (!tags.GPSLatitude || !tags.GPSLongitude) {
      return null;
   }

   try {
      const lat = convertDMSToDD(
         tags.GPSLatitude[0].numerator / tags.GPSLatitude[0].denominator,
         tags.GPSLatitude[1].numerator / tags.GPSLatitude[1].denominator,
         tags.GPSLatitude[2].numerator / tags.GPSLatitude[2].denominator,
         tags.GPSLatitudeRef
      );

      const lng = convertDMSToDD(
         tags.GPSLongitude[0].numerator / tags.GPSLongitude[0].denominator,
         tags.GPSLongitude[1].numerator / tags.GPSLongitude[1].denominator,
         tags.GPSLongitude[2].numerator / tags.GPSLongitude[2].denominator,
         tags.GPSLongitudeRef
      );

      return { latitude: lat, longitude: lng };
   } catch (error) {
      console.error("Error parsing GPS data:", error);
      return null;
   }
};

/**
 * Gets a location name from GPS coordinates using OpenStreetMap Nominatim API
 */
export const getLocationName = async (
   latitude: number,
   longitude: number
): Promise<string> => {
   try {
      const response = await fetch(
         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
         { headers: { "User-Agent": "PhotoAlbumApp/1.0" } }
      );

      if (!response.ok) throw new Error("Geocoding request failed");

      const data = await response.json();

      // Extract most relevant location info (city or neighborhood)
      if (data.address) {
         return (
            data.address.suburb ||
            data.address.neighbourhood ||
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county ||
            "Unknown location"
         );
      }

      return "Unknown location";
   } catch (error) {
      console.error("Error getting location name:", error);
      return "Unknown location";
   }
};

/**
 * Extract EXIF data from an image file with automatic rotation
 */
export const extractExifData = (file: File): Promise<EnhancedFile> => {
   return new Promise(resolve => {
      const enhancedFile = file as EnhancedFile;

      // Create temporary URL first to use for reading orientation
      const tempUrl = URL.createObjectURL(file);

      // Skip non-JPEG files for EXIF extraction since EXIF-JS primarily supports JPEG
      if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
         enhancedFile.preview = tempUrl;
         enhancedFile.metadata = {
            captureDate: undefined,
            gpsLocation: undefined,
            eventGroup: "Unsorted",
         };
         resolve(enhancedFile);
         return;
      }

      // Read the file as an array buffer for EXIF extraction
      const reader = new FileReader();
      reader.onload = function (e) {
         const result = e.target?.result;
         if (!result) {
            enhancedFile.preview = tempUrl;
            resolve(enhancedFile);
            return;
         }

         // Get EXIF data - using a proper function expression to maintain context
         EXIF.getData(file as any, async () => {
            // Now 'this' refers to the file object with EXIF data attached
            const allTags = EXIF.getAllTags(this);

            // Extract orientation
            let orientation = 1; // Default orientation (no rotation)
            if (allTags.Orientation) {
               orientation = parseInt(allTags.Orientation);
            }

            // Extract creation date
            let captureDate: Date | undefined;
            if (allTags.DateTimeOriginal) {
               try {
                  // Parse EXIF date format (YYYY:MM:DD HH:MM:SS)
                  const parts = allTags.DateTimeOriginal.split(" ");
                  const dateParts = parts[0].split(":");
                  const timeParts = parts[1].split(":");

                  captureDate = new Date(
                     parseInt(dateParts[0]),
                     parseInt(dateParts[1]) - 1, // Month is 0-based in JS Date
                     parseInt(dateParts[2]),
                     parseInt(timeParts[0]),
                     parseInt(timeParts[1]),
                     parseInt(timeParts[2])
                  );
               } catch (e) {
                  console.error("Error parsing date:", e);
               }
            }

            // Extract GPS data
            let gpsLocation: LocationData | undefined;
            const gpsData = parseGPSData(allTags);

            if (gpsData) {
               gpsLocation = {
                  latitude: gpsData.latitude,
                  longitude: gpsData.longitude,
                  // Location name will be fetched later in a batch operation
               };
            }

            // Determine if image needs rotation based on orientation
            if (orientation !== 1) {
               try {
                  // Get the auto-rotation angle based on orientation
                  const rotationAngle = orientationToRotation[orientation] || 0;

                  // Apply rotation to the image and get the new URL
                  const rotatedImageUrl = await rotateImageBasedOnOrientation(
                     tempUrl,
                     orientation
                  );

                  // Set the rotated image as the preview
                  enhancedFile.preview = rotatedImageUrl;

                  enhancedFile.metadata = {
                     captureDate,
                     gpsLocation,
                     eventGroup: "Unsorted", // Will be determined later after all files are processed
                  };
               } catch (error) {
                  console.error("Error applying auto-rotation:", error);
                  // If rotation fails, use the original image
                  enhancedFile.preview = tempUrl;
                  enhancedFile.metadata = {
                     captureDate,
                     gpsLocation,
                     eventGroup: "Unsorted",
                  };
               }
            } else {
               // No rotation needed
               enhancedFile.preview = tempUrl;
               enhancedFile.metadata = {
                  captureDate,
                  gpsLocation,
                  eventGroup: "Unsorted",
               };
            }

            resolve(enhancedFile);
         });
      };

      reader.readAsArrayBuffer(file);
   });
};

/**
 * Alternative method to extract EXIF data using image element for images without proper EXIF
 * This can extract creation date from the file's last modified date as fallback
 */
export const extractImageMetadataFallback = (
   file: File
): Promise<EnhancedFile> => {
   return new Promise(resolve => {
      const enhancedFile = file as EnhancedFile;
      enhancedFile.preview = URL.createObjectURL(file);

      // Try to use file's last modified date as a fallback
      const lastModified = new Date(file.lastModified);

      enhancedFile.metadata = {
         captureDate: lastModified,
         gpsLocation: undefined,
         eventGroup: "Unsorted",
      };

      // Create image element to try to get any additional metadata
      const img = new Image();
      img.onload = function () {
         // We could extract width/height here if needed
         resolve(enhancedFile);
      };

      img.onerror = function () {
         // Just resolve with what we have
         resolve(enhancedFile);
      };

      img.src = enhancedFile.preview;
   });
};

/**
 * Function to identify events based on time gaps and location
 */
export const identifyEvents = (files: EnhancedFile[]): EnhancedFile[] => {
   if (files.length === 0) return [];

   // First, sort all files by date
   const sortedFiles = [...files].sort((a, b) => {
      const dateA = a.metadata?.captureDate || new Date(0);
      const dateB = b.metadata?.captureDate || new Date(0);
      return dateA.getTime() - dateB.getTime();
   });

   let currentEventId = 1;
   let lastDate: Date | null = null;
   let lastLocation: string | null = null;

   // Time gap that defines a new event (in milliseconds)
   const TIME_GAP_THRESHOLD = 3 * 60 * 60 * 1000; // 3 hours

   // Process files and assign event groups
   sortedFiles.forEach((file, index) => {
      const currentDate = file.metadata?.captureDate;
      const currentLocation = file.metadata?.gpsLocation?.locationName;

      // Start a new event if:
      // 1. This is the first file
      // 2. There's a significant time gap
      // 3. The location has changed significantly
      if (
         index === 0 ||
         !currentDate ||
         !lastDate ||
         currentDate.getTime() - lastDate.getTime() > TIME_GAP_THRESHOLD ||
         (currentLocation && lastLocation && currentLocation !== lastLocation)
      ) {
         // Format the date to be part of the event name
         const dateString = currentDate
            ? currentDate.toLocaleDateString(undefined, {
                 month: "short",
                 day: "numeric",
                 year:
                    currentDate.getFullYear() !== new Date().getFullYear()
                       ? "numeric"
                       : undefined,
              })
            : "Unknown Date";

         const locationString = currentLocation || "";

         // Create event name with date and optional location
         let eventName = `Event ${currentEventId}: ${dateString}`;
         if (locationString) {
            eventName += ` - ${locationString}`;
         }

         file.metadata = {
            ...file.metadata,
            eventGroup: eventName,
         };

         currentEventId++;
      } else {
         // Continue the current event
         file.metadata = {
            ...file.metadata,
            eventGroup:
               sortedFiles[index - 1].metadata?.eventGroup ||
               `Event ${currentEventId}`,
         };
      }

      // Update last values
      lastDate = currentDate || null;
      lastLocation = currentLocation || null;
   });

   return sortedFiles;
};

/**
 * Fetches location names for all images with GPS data with progress reporting
 */
export const fetchLocationNames = async (
   files: EnhancedFile[],
   progressCallback?: ProgressCallback
): Promise<EnhancedFile[]> => {
   // Create a map to deduplicate location requests
   const locationMap = new Map<string, string>();

   // Create a list of unique locations to fetch
   const locationsToFetch: {
      latitude: number;
      longitude: number;
      key: string;
   }[] = [];

   files.forEach(file => {
      if (
         file.metadata?.gpsLocation &&
         !file.metadata.gpsLocation.locationName
      ) {
         const { latitude, longitude } = file.metadata.gpsLocation;
         // Create a key to identify unique locations (rounded to reduce API calls)
         const locationKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;

         if (!locationMap.has(locationKey)) {
            locationsToFetch.push({
               latitude,
               longitude,
               key: locationKey,
            });
            locationMap.set(locationKey, ""); // Reserve this spot
         }
      }
   });

   // Fetch locations in batches to avoid rate limits (5 at a time)
   const BATCH_SIZE = 5;
   const DELAY_BETWEEN_BATCHES = 1000; // 1 second

   for (let i = 0; i < locationsToFetch.length; i += BATCH_SIZE) {
      const batch = locationsToFetch.slice(i, i + BATCH_SIZE);

      // Fetch all locations in this batch in parallel
      const batchResults = await Promise.all(
         batch.map(async ({ latitude, longitude, key }) => {
            const locationName = await getLocationName(latitude, longitude);
            return { locationKey: key, locationName };
         })
      );

      // Store results in our map
      batchResults.forEach(({ locationKey, locationName }) => {
         locationMap.set(locationKey, locationName);
      });

      // Report progress if callback provided
      if (progressCallback) {
         progressCallback(i + batch.length);
      }

      // Delay before next batch to avoid rate limits
      if (i + BATCH_SIZE < locationsToFetch.length) {
         await new Promise(resolve =>
            setTimeout(resolve, DELAY_BETWEEN_BATCHES)
         );
      }
   }

   // Apply location names to all files
   const updatedFiles = files.map(file => {
      if (
         file.metadata?.gpsLocation &&
         !file.metadata.gpsLocation.locationName
      ) {
         const { latitude, longitude } = file.metadata.gpsLocation;
         const locationKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
         const locationName =
            locationMap.get(locationKey) || "Unknown location";

         file.metadata.gpsLocation.locationName = locationName;
      }

      return file;
   });

   return updatedFiles;
};

/**
 * Clean up object URLs to prevent memory leaks
 */
export const cleanupObjectURLs = (files: EnhancedFile[]): void => {
   files.forEach(file => {
      if (file.preview) {
         URL.revokeObjectURL(file.preview);
      }
   });
};
