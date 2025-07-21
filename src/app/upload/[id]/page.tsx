"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import { EnhancedFile } from "@/backend/types/image";

import UploadedImagesGrid from "./components/uploaded.images";
import { UploadProgressOverlay } from "../components/UploadProgressOverlay";
import { useUploadQueue } from "../hooks/useUploadQueue";

import { organizeImagesWithAI } from './helper/analyser.function';
import { inferLocationFromTimeZone } from "@/backend/helpers/inferlocation";
import { groupImagesByVisionContent } from "./google.ai.analysis/ai.analysis";
import { identifyEvents, cleanupObjectURLs } from "@/backend/helpers/exif.helpers";
import { determineBestOrganizationMethod } from "@/backend/helpers/determin.method";

import { processImageWithHuggingFace } from "@/backend/services/huggingface.ai/huggingfaceservice";
import { Upload, AlertCircle, Check, Laptop, Calendar, MapPin, Users, X } from "lucide-react";

export default function UploadPage({ params }: { params: { id: string } }) {
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<EnhancedFile[]>([]);
  const [organizedImages, setOrganizedImages] = useState<EnhancedFile[]>([]);
  const [suggestedOrganization, setSuggestedOrganization] = useState<string>("none");

  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<
    "idle" | "extracting" | "analyzing" | "organizing" | "complete"
  >("idle");

  const dragAreaRef = useRef<HTMLDivElement>(null);
  const computerInputRef = useRef<HTMLInputElement>(null);
  const [organizationMethod, setOrganizationMethod] = useState<string>("auto");
  const [processingProgress, setProcessingProgress] = useState<number>();

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  // Upload queue integration
  const uploadQueue = useUploadQueue({
    albumId: params.id,
    maxConcurrent: 3,
    maxRetries: 3,
    onAllComplete: () => {
      // Update album status and navigate to next step
      fetch(`/api/album/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      setUploadComplete(true);
    },
    onItemComplete: (item) => {
      console.log("Upload completed for:", item.file.filename);
    },
    onItemError: (item) => {
      console.error("Upload failed for:", item.file.filename, item.error);
    },
  });

  useEffect(() => {
    if (organizedImages.length === 0) return;

    const getTimeZoneRegion = (dateString?: string | Date): string | null => {
      if (!dateString) return null;

      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const dateStr = date.toString();
      const timeZoneMatch = dateStr.match(/GMT([+-]\d{4})/);

      if (!timeZoneMatch) return null;

      const timeZone = timeZoneMatch[1];

      const timeZoneMap: Record<string, string> = {
        '+0800': 'Southeast Asia',
        '+0900': 'East Asia',
        '+0530': 'South Asia',
        '+0100': 'Central Europe',
        '+0000': 'Western Europe',
        '-0500': 'Eastern North America',
        '-0800': 'Western North America',
      };

      return timeZoneMap[timeZone] || `Time Zone ${timeZone}`;
    };

    const withExactDate = organizedImages.filter(img => img.metadata?.captureDate).length;

    const withLocation = organizedImages.filter(img => {
      if (img.metadata?.gpsLocation) return true;
      if (img.metadata?.captureDate && getTimeZoneRegion(img.metadata.captureDate)) {
        return true;
      }

      return false;
    }).length;

    const withAiTags = organizedImages.filter(img =>
      img.metadata?.aiTags && img.metadata.aiTags.length > 0
    ).length;

    const datePercentage = (withExactDate / organizedImages.length) * 100;
    const locationPercentage = (withLocation / organizedImages.length) * 100;
    const aiTagsPercentage = (withAiTags / organizedImages.length) * 100;

    let suggested = "none";

    if (datePercentage >= 70 && locationPercentage >= 50) {
      suggested = "event";
    }

    else if (aiTagsPercentage >= 70) {
      suggested = "content";
    }

    else if (datePercentage >= 70) {
      suggested = "date";
    }

    else if (locationPercentage >= 50) {
      suggested = "location";
    }

    else if (datePercentage >= 30) {
      suggested = "date";
    }

    setSuggestedOrganization(suggested);

    if (organizationMethod === "auto" && suggested !== "none") {
      organizeImages(suggested);
    }
  }, [organizedImages.length, organizationMethod]);

  /**
   * the system automatically sorts them by location, date, and everything you wrote (i suppose in the image), with the option for manual intervention.
   * Stage 1: Automatic Photo Upload and Sorting
   *  The software automatically sorts by:
          - Capture dates (from photo metadata)
          - GPS locations (if available)
          - Event sequence identification by timeline
          - Facial recognition (if available in software)

   * @param files 
   * @returns 
   */

  const processFiles = async (files: File[]) => {

    // Check for maximum image limit
    // if (files.length + uploadedImages.length > MAX_IMAGES) {
    //   setError(`Maximum ${MAX_IMAGES} images allowed`);
    //   return;
    // }

    setError("");
    setIsProcessing(true);
    setProcessingPhase("extracting");
    setProcessingProgress(0);

    try {
      // PHASE 1: EXTRACTING - Process files with Vision API
      const enhancedFilesPromises = files.map(async (file, index) => {
        try {

          setProcessingProgress(Math.floor((index / files.length) * 33));
          const hfenhancedFile = await processImageWithHuggingFace(file);
          const event = hfenhancedFile.metadata?.tags;

          let captureLocation = null;

          if (hfenhancedFile.metadata?.captureDate instanceof Date) {
            captureLocation = inferLocationFromTimeZone(hfenhancedFile.metadata.captureDate);
          }

          if (captureLocation && hfenhancedFile) {
            hfenhancedFile.metadata = {
              ...hfenhancedFile.metadata,
              inferredLocation: captureLocation,
              eventGroupTags: event,
            };
          }

          return hfenhancedFile;
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          return null;
        }
      });

      const enhancedFilesWithNulls = await Promise.all(enhancedFilesPromises);
      const enhancedFiles = enhancedFilesWithNulls as EnhancedFile[];

      if (enhancedFiles.length === 0 && files.length > 0) {
        setError("Unable to process any of the selected images. Please try again.");
        setIsProcessing(false);
        setProcessingProgress(0);
        return;
      }

      // PHASE 2: ANALYZING - Use a single batch analysis instead of per-file analysis
      setProcessingPhase("analyzing");
      setProcessingProgress(33);

      const batchAnalysisPromises = enhancedFiles.map(async (file, index) => {
        const analysisProgress = 33 + Math.floor((index / enhancedFiles.length) * 33);
        setProcessingProgress(analysisProgress);
        return file;
      });

      await Promise.all(batchAnalysisPromises);
      setProcessingProgress(66);

      // PHASE 3: ORGANIZING - Optimize organization
      setProcessingPhase("organizing");

      const newUploadedImages = [...uploadedImages, ...enhancedFiles];
      setUploadedImages(newUploadedImages);
      const validMethod = organizationMethod === "auto"
        ? determineBestOrganizationMethod(newUploadedImages)
        : organizationMethod as 'date' | 'location' | 'event';

      setProcessingProgress(80);

      let organizedFiles: EnhancedFile[];

      if (validMethod === "content") {
        const contentGroups = groupImagesByVisionContent(newUploadedImages);
        organizedFiles = Object.values(contentGroups).flat();
      } else {
        organizedFiles = organizeImagesWithAI(newUploadedImages, validMethod as 'date' | 'location' | 'event');
      }

      setProcessingProgress(95);
      setOrganizedImages(organizedFiles);

      // PHASE 4: COMPLETE - Auto-start upload
      setProcessingPhase("complete");
      setProcessingProgress(100);

      // Automatically start uploading the organized images
      setTimeout(() => {
        uploadQueue.addToQueue(organizedFiles);
        uploadQueue.startUploads();
      }, 1000); // Small delay to show completion

    } catch (err) {
      console.error("Error in batch processing:", err);
      setError(
        err instanceof Error
          ? `Error processing images: ${err.message}`
          : "Error processing image metadata. Please try again."
      );
    } finally {
      requestAnimationFrame(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
      });
    }
  };

  const organizeImages = useCallback((method: string) => {
    if (uploadedImages.length === 0) {
      return;
    }

    setIsProcessing(true);
    setProcessingPhase("organizing");
    setProcessingProgress(0);

    try {
      let organizedFiles: EnhancedFile[] = [];

      if (method === "content") {
        const contentGroups = groupImagesByVisionContent(uploadedImages);

        const sortedGroups = Object.entries(contentGroups)
          .sort(([groupA], [groupB]) => {
            if (groupA.startsWith('Event:')) return -1;
            if (groupB.startsWith('Event:')) return 1;
            if (groupA === 'Portrait' || groupA === 'Group Photo') return -1;
            if (groupB === 'Portrait' || groupB === 'Group Photo') return 1;
            return groupA.localeCompare(groupB);
          });

        organizedFiles = sortedGroups.flatMap(([groupName, images]) => {
          return images;
        });

      } else {
        const validMethod = method as 'date' | 'location' | 'event';
        organizedFiles = organizeImagesWithAI(uploadedImages, validMethod);
      }

      for (let i = 0; i < uploadedImages.length; i++) {
        setProcessingProgress(Math.floor((i / uploadedImages.length) * 100));
      }

      setOrganizedImages(organizedFiles);
      setProcessingPhase("complete");

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
      }, 1500);

    } catch (error) {
      console.error("Error organizing images:", error);

      setOrganizedImages([...uploadedImages]);
      setError("Error organizing images. Original order maintained.");

      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [uploadedImages]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      const invalidFiles = files.filter(
        (file) => !ALLOWED_TYPES.includes(file.type)
      );

      if (invalidFiles.length > 0) {
        setError(`Please upload only JPG or PNG files. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }

      await processFiles(files);

      if (e.target) {
        e.target.value = '';
      }
    },
    [uploadedImages.length]
    // , MAX_IMAGES
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragAreaRef.current) {
      dragAreaRef.current.classList.add('border-blue-500');
      dragAreaRef.current.classList.add('bg-blue-50');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('border-blue-500');
      dragAreaRef.current.classList.remove('bg-blue-50');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('border-blue-500');
      dragAreaRef.current.classList.remove('bg-blue-50');
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);

      // Filter for images
      const imageFiles = files.filter(file => ALLOWED_TYPES.includes(file.type));

      if (imageFiles.length === 0) {
        setError("Please drop only image files (JPG or PNG)");
        return;
      }

      if (files.length !== imageFiles.length) {
        setError(`${files.length - imageFiles.length} non-image files were ignored`);
      }

      processFiles(imageFiles);
    }
  }, [uploadedImages.length]); // --> , MAX_IMAGES

  const handleUploadConfirmed = async () => {
    setError("");

    // Add files to upload queue and start uploading
    uploadQueue.addToQueue(organizedImages);
    uploadQueue.startUploads();
  };

  const handleRemoveImage = useCallback((index: number) => {
    // Remove from both arrays
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      return identifyEvents(newImages);
    });

    setOrganizedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });
  }, []);

  const handleRemoveAllImages = useCallback(() => {
    if (confirm("Are you sure you want to remove all uploaded images?")) {
      setUploadedImages([]);
      setOrganizedImages([]);
    }
  }, []);

  const getOrganizationSummary = () => {
    if (organizationMethod === "auto") {
      switch (suggestedOrganization) {
        case "event":
          return "Organized chronologically by events";
        case "date":
          return "Organized by capture date";
        case "location":
          return "Organized by location";
        default:
          return "Original order";
      }
    } else {
      return "Original order";
    }
  };

  useEffect(() => {
    return () => {
      cleanupObjectURLs([...uploadedImages, ...organizedImages]);
    };
  }, []);




  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-6 mb-6">
            {!uploadComplete ? (
              <div>
                <div className="flex flex-col w-full items-end">
                  <h1 className="text-2xl font-bold mb-2">Upload pictures</h1>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  {/* Computer Upload */}
                  <div
                    className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    onClick={() => computerInputRef.current?.click()}
                  >
                    <input
                      ref={computerInputRef}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center h-full justify-center">
                      <div className="rounded-full bg-green-100 p-3 mb-3">
                        <Laptop size={24} className="text-green-600" />
                      </div>
                      <p className="text-gray-700 font-medium">Computer</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Browse files from your device
                      </p>
                    </div>
                  </div>

                  {/* Drag & Drop Area */}
                  <div
                    ref={dragAreaRef}
                    className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center h-full justify-center">
                      <div className="rounded-full bg-purple-100 p-3 mb-3">
                        <Upload size={24} className="text-purple-600" />
                      </div>
                      <p className="text-gray-700 font-medium">Drag & Drop</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Drop files anywhere here
                      </p>
                    </div>
                  </div>
                </div>

                {isProcessing && (
                  <div className="flex flex-col justify-center mb-4 bg-blue-50 p-5 rounded-lg shadow-sm">
                    <div className="flex flex-col items-center justify-center mb-3">
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          {processingPhase === "complete" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                              <Check size={16} className="text-green-500" />
                            </div>
                          )}
                        </div>
                        <span className="text-blue-700 font-medium">
                          {processingPhase === "extracting" && "Extracting image data..."}
                          {processingPhase === "analyzing" && "Analyzing content using A.I..."}
                          {processingPhase === "organizing" && "Organizing photos using A.I..."}
                          {processingPhase === "complete" && "Processing complete!"}
                        </span>
                      </div>
                      <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {processingProgress}%
                      </span>
                    </div>

                    {/* Current task details */}
                    <div className="mt-3 flex items-center justify-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                        {processingPhase === "extracting" && <Upload size={16} className="text-blue-600" />}
                        {processingPhase === "analyzing" && <AlertCircle size={16} className="text-blue-600" />}
                        {processingPhase === "organizing" && <Laptop size={16} className="text-blue-600" />}
                        {processingPhase === "complete" && <Check size={16} className="text-green-600" />}
                      </div>
                      <p className="text-sm text-blue-700">
                        {processingPhase === "extracting" && "AI is analyzing your photos to identify people, objects, and scenes. This helps organize them into meaningful groups."}
                        {processingPhase === "analyzing" && "Converting technical data into useful information about locations, events, and photo content."}
                        {processingPhase === "organizing" && "Creating the perfect arrangement of your photos based on time, location, and content."}
                        {processingPhase === "complete" && "Your photos have been successfully processed and are ready for the next step!"}
                      </p>
                    </div>
                  </div>
                )}

                {organizedImages.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-col mb-4 flex-wrap gap-2">
                    </div>
                    <div>
                      {organizedImages.length > 1 && (
                        <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-end flex-wrap gap-3 mb-3">
                            <h3 className="text-sm font-medium text-gray-700">Photo Organization</h3>

                            {suggestedOrganization !== "none" && (
                              <div className="flex items-center">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mr-2">
                                  AI Recommendation: {suggestedOrganization.charAt(0).toUpperCase() + suggestedOrganization.slice(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            {/* Auto button */}
                            <button
                              className={`px-3 py-2 text-sm rounded-md flex items-center ${organizationMethod === "auto"
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              onClick={() => {
                                if (organizationMethod !== "auto") {
                                  setOrganizationMethod("auto");

                                  // If we have a suggestion, apply it immediately without any processing state
                                  if (suggestedOrganization !== "none") {
                                    const method = suggestedOrganization;

                                    // Direct organization - never setting isProcessing to true
                                    if (method === "content") {
                                      const contentGroups = groupImagesByVisionContent(uploadedImages);
                                      const organized = Object.values(contentGroups).flat();
                                      setOrganizedImages(organized);
                                    } else {
                                      const validMethod = method as 'date' | 'location' | 'event';
                                      // Using a simplified version that doesn't set processing states
                                      const organizedFiles = (() => {
                                        if (validMethod === 'date') {
                                          // Sort by date without setting any processing state
                                          return [...uploadedImages].sort((a, b) => {
                                            const dateA = a.metadata?.captureDate ? new Date(a.metadata.captureDate).getTime() : 0;
                                            const dateB = b.metadata?.captureDate ? new Date(b.metadata.captureDate).getTime() : 0;
                                            return dateB - dateA; // Newest first
                                          });
                                        } else if (validMethod === 'location') {
                                          // Group by location without setting any processing state
                                          const locationGroups: Record<string, EnhancedFile[]> = {};

                                          uploadedImages.forEach(img => {
                                            const locationName = img.metadata?.gpsLocation?.locationName ||
                                              img.metadata?.vision?.detectedLocationName ||
                                              'Unknown Location';

                                            if (!locationGroups[locationName]) {
                                              locationGroups[locationName] = [];
                                            }

                                            locationGroups[locationName].push(img);
                                          });

                                          return Object.values(locationGroups).flat();
                                        } else {
                                          // For event or any other method, just use the event grouping logic
                                          // without setting any processing state
                                          return organizeImagesWithAI(uploadedImages, validMethod);
                                        }
                                      })();

                                      setOrganizedImages(organizedFiles);
                                    }
                                  }
                                }
                              }}
                              disabled={uploadQueue.isUploading}
                            >
                              <Check size={16} className={`mr-1 ${organizationMethod === "auto" ? "text-white" : "text-blue-600"}`} />
                              Organize with A.I (Recommended)
                            </button>

                            {/* Date button */}
                            <button
                              className={`px-3 py-2 text-sm rounded-md flex items-center ${organizationMethod === "date"
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              onClick={() => {
                                if (organizationMethod !== "date") {
                                  setOrganizationMethod("date");

                                  // Simple date sort without any processing state
                                  const sortedImages = [...uploadedImages].sort((a, b) => {
                                    const dateA = a.metadata?.captureDate ? new Date(a.metadata.captureDate).getTime() : 0;
                                    const dateB = b.metadata?.captureDate ? new Date(b.metadata.captureDate).getTime() : 0;
                                    return dateB - dateA; // Newest first
                                  });

                                  setOrganizedImages(sortedImages);
                                }
                              }}
                              disabled={uploadQueue.isUploading}
                            >
                              <Calendar size={16} className={`mr-1 ${organizationMethod === "date" ? "text-white" : "text-blue-600"}`} />
                              By Date
                            </button>

                            {/* Location button */}
                            <button
                              className={`px-3 py-2 text-sm rounded-md flex items-center ${organizationMethod === "location"
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              onClick={() => {
                                if (organizationMethod !== "location") {
                                  setOrganizationMethod("location");

                                  // Simple location grouping without any processing state
                                  const locationGroups: Record<string, EnhancedFile[]> = {};

                                  uploadedImages.forEach(img => {
                                    const locationName = img.metadata?.gpsLocation?.locationName ||
                                      img.metadata?.vision?.detectedLocationName ||
                                      'Unknown Location';

                                    if (!locationGroups[locationName]) {
                                      locationGroups[locationName] = [];
                                    }

                                    locationGroups[locationName].push(img);
                                  });

                                  const organizedByLocation = Object.values(locationGroups).flat();
                                  setOrganizedImages(organizedByLocation);
                                }
                              }}
                              disabled={uploadQueue.isUploading}
                            >
                              <MapPin size={16} className={`mr-1 ${organizationMethod === "location" ? "text-white" : "text-blue-600"}`} />
                              By Location
                            </button>

                            {/* Event button */}
                            <button
                              className={`px-3 py-2 text-sm rounded-md flex items-center ${organizationMethod === "event"
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              onClick={() => {
                                if (organizationMethod !== "event") {
                                  setOrganizationMethod("event");

                                  // Implementation that doesn't use functions that set processing state
                                  // Group by event type from metadata
                                  const eventGroups: Record<string, EnhancedFile[]> = {};
                                  const nonEventImages: EnhancedFile[] = [];

                                  uploadedImages.forEach(img => {
                                    const eventType = img.metadata?.vision?.detectedEventType ||
                                      img.metadata?.eventGroup;

                                    if (eventType) {
                                      if (!eventGroups[eventType]) {
                                        eventGroups[eventType] = [];
                                      }
                                      eventGroups[eventType].push(img);
                                    } else {
                                      nonEventImages.push(img);
                                    }
                                  });

                                  // Combine event groups and non-event images
                                  const organized = [
                                    ...Object.values(eventGroups).flat(),
                                    ...nonEventImages
                                  ];

                                  setOrganizedImages(organized);
                                }
                              }}
                              disabled={uploadQueue.isUploading}
                            >
                              <Users size={16} className={`mr-1 ${organizationMethod === "event" ? "text-white" : "text-blue-600"}`} />
                              By Event
                            </button>

                          </div>

                          <div className="mt-3 text-xs text-gray-500 flex items-center justify-end">
                            {organizationMethod === "auto" && (
                              <p>Automatically organizes photos using AI to determine the best method based on your photos' metadata.</p>
                            )}
                            {organizationMethod === "date" && (
                              <p>Orders photos chronologically based on when they were taken.</p>
                            )}
                            {organizationMethod === "location" && (
                              <p>Groups photos by where they were taken, using GPS data or location information.</p>
                            )}
                            {organizationMethod === "event" && (
                              <p>Organizes photos by detected events, combining date and location data to identify related moments.</p>
                            )}
                            {organizationMethod === "content" && (
                              <p>Groups similar photos together based on what's in them — people, objects, scenes, etc.</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mb-4 flex justify-end items-start bg-blue-50 rounded-lg text-sm">
                        <div className="flex p-2">
                          <div className="flex flex-col text-blue-800">
                            <div className="flex flex-row justify-end">
                              <Check size={16} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                              <p className="font-medium">{getOrganizationSummary()}</p>
                            </div>
                            <p className="mt-1">
                              Your photos have been automatically organized using A.I for the best viewing experience.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pb-5 pt-2 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            Uploaded Images: {organizedImages.length}
                          </h3>
                        </div>
                        <div className='box space-x-2'>
                          {organizedImages.length > 1 && (
                            <button
                              onClick={handleRemoveAllImages}
                              className="p-2 w-40 rounded-full bg-red-500 text-white hover:bg-red-600"
                              title="Clear all"
                            >
                              Clear all Images
                            </button>
                          )}
                          <button
                            onClick={handleUploadConfirmed}
                            disabled={uploadQueue.isUploading}
                            className="bg-blue-600 h-10 w-36 text-white py-2 px-4 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Continue
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {organizedImages.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="relative aspect-square">
                              <img
                                src={file.preview}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-full object-cover rounded"
                              />
                              {!uploadQueue.isUploading && (
                                <button
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-opacity hover:bg-red-600"
                                  aria-label="Remove image"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <UploadedImagesGrid images={uploadedImages} params={params} />
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress Overlay */}
      <UploadProgressOverlay
        queue={uploadQueue.queue}
        stats={uploadQueue.stats}
        isUploading={uploadQueue.isUploading}
        onPauseAll={uploadQueue.pauseAll}
        onResumeAll={uploadQueue.resumeAll}
        onClearCompleted={uploadQueue.clearCompleted}
        onRetryItem={uploadQueue.retryItem}
        onPauseItem={uploadQueue.pauseItem}
        onResumeItem={uploadQueue.resumeItem}
        onRemoveItem={uploadQueue.removeFromQueue}
      />
    </div>
  );
}
