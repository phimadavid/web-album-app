"use client";

import 'react-image-crop/dist/ReactCrop.css';
import { useState, useCallback, useEffect, useRef } from "react";

import { EnhancedFile } from "@/backend/types/image";
import { identifyEvents, cleanupObjectURLs } from "@/backend/helpers/exif.helpers";
import { Upload, AlertCircle, Check, Laptop } from "lucide-react";

import { inferLocationFromTimeZone } from "@/backend/helpers/inferlocation";
import { processImageWithHuggingFace } from "@/backend/services/huggingface.ai/huggingfaceservice";
import { determineBestOrganizationMethod } from "@/backend/helpers/determin.method";
import { groupImagesByVisionContent } from '@/app/upload/[id]/google.ai.analysis/ai.analysis';
import { organizeImagesWithAI } from '@/app/upload/[id]/helper/analyser.function';
import EditableImage from '@/app/upload/[id]/components/image.layer.editing';
import AddPhotoViewGrid from './addphotogrid';
import { useUploadQueue } from '@/app/upload/hooks/useUploadQueue';
import { UploadProgressOverlay } from '@/app/upload/components/UploadProgressOverlay';


type AddPhotosProps = {
    params: { id: string }
    onClose: () => void;
}

export default function AddPhotos({ params, onClose }: AddPhotosProps) {
    const [isHaggadah, setIsHaggadah] = useState(false);
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
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [organizationMethod, setOrganizationMethod] = useState<string>("auto");
    const [processingProgress, setProcessingProgress] = useState<number>();
    const [pendingCoverAction, setPendingCoverAction] = useState<{ index: number, isUnset: boolean } | null>(null);

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

    // Upload queue integration
    const uploadQueue = useUploadQueue({
        albumId: params.id,
        maxConcurrent: 3,
        maxRetries: 3,
        onAllComplete: () => {
            setUploadComplete(true);
        },
        onItemComplete: (item) => {
            console.log("Upload completed for:", item.file.filename);
        },
        onItemError: (item) => {
            console.error("Upload failed for:", item.file.filename, item.error);
        },
    });

    // Refactored useEffect with proper dependencies and improved organization detection
    useEffect(() => {
        // Skip if no images to organize
        if (organizedImages.length === 0) return;

        // Helper function to extract time zone region from date
        const getTimeZoneRegion = (dateString?: string | Date): string | null => {
            if (!dateString) return null;

            const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
            const dateStr = date.toString();
            const timeZoneMatch = dateStr.match(/GMT([+-]\d{4})/);

            if (!timeZoneMatch) return null;

            const timeZone = timeZoneMatch[1];

            // Map time zones to general regions
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

        // Count images with different types of metadata
        const withExactDate = organizedImages.filter(img => img.metadata?.captureDate).length;

        // Count images with either GPS location or time zone-derived location
        const withLocation = organizedImages.filter(img => {
            // Has explicit GPS data
            if (img.metadata?.gpsLocation) return true;

            // Or has date with time zone information
            if (img.metadata?.captureDate && getTimeZoneRegion(img.metadata.captureDate)) {
                return true;
            }

            return false;
        }).length;

        // Count images with AI tags
        const withAiTags = organizedImages.filter(img =>
            img.metadata?.aiTags && img.metadata.aiTags.length > 0
        ).length;

        // Calculate percentages
        const datePercentage = (withExactDate / organizedImages.length) * 100;
        const locationPercentage = (withLocation / organizedImages.length) * 100;
        const aiTagsPercentage = (withAiTags / organizedImages.length) * 100;

        // Determine best organization method
        let suggested = "none";

        // Organize by event when we have both date and location data
        if (datePercentage >= 70 && locationPercentage >= 50) {
            suggested = "event";
        }
        // Organize by content if we have good AI tagging
        else if (aiTagsPercentage >= 70) {
            suggested = "content";
        }
        // Organize by date if most images have dates
        else if (datePercentage >= 70) {
            suggested = "date";
        }
        // Organize by location if enough images have location data
        else if (locationPercentage >= 50) {
            suggested = "location";
        }
        // Default to date if we have some dates
        else if (datePercentage >= 30) {
            suggested = "date";
        }

        // Store the suggested organization method
        setSuggestedOrganization(suggested);

        // If we're in auto mode and have a suggestion, apply it
        if (organizationMethod === "auto" && suggested !== "none") {
            organizeImages(suggested);
        }
    }, [organizedImages.length, organizationMethod]);

    /**
     * the system automatically sorts them by location, date, and everything you wrote (i suppose in the image), with the option for manual intervention.
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

            // PHASE 4: COMPLETE
            setProcessingPhase("complete");
            setProcessingProgress(100);

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
                // Group by AI-detected content
                const contentGroups = groupImagesByVisionContent(uploadedImages);
                // Sort groups by priority (events first, then group photos, etc.)
                const sortedGroups = Object.entries(contentGroups)
                    .sort(([groupA], [groupB]) => {
                        // Events first, then people, then other content
                        if (groupA.startsWith('Event:')) return -1;
                        if (groupB.startsWith('Event:')) return 1;
                        if (groupA === 'Portrait' || groupA === 'Group Photo') return -1;
                        if (groupB === 'Portrait' || groupB === 'Group Photo') return 1;
                        return groupA.localeCompare(groupB);
                    });
                // Flatten groups into a single array while preserving group order
                organizedFiles = sortedGroups.flatMap(([groupName, images]) => {
                    return images;
                });

            } else {
                const validMethod = method as 'date' | 'location' | 'event';
                organizedFiles = organizeImagesWithAI(uploadedImages, validMethod);
            }

            // Update progress while organizing
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

            // In case of error, fall back to original order
            setOrganizedImages([...uploadedImages]);
            setError("Error organizing images. Original order maintained.");

            // Reset processing state
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
    }, [uploadedImages.length]);

    const handleUploadConfirmed = async () => {
        setShowConfirmDialog(false);
        setError("");

        // Add files to upload queue and start uploading
        uploadQueue.addToQueue(organizedImages);
        uploadQueue.startUploads();
    };

    const handleSubmit = async () => {
        setShowConfirmDialog(true);
    };

    const handleCheckPhotos = () => {
        setShowConfirmDialog(false);
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

    const updateImageInState = (index: number, updatedFile: EnhancedFile): void => {
        setOrganizedImages(prev => {
            const newArray = [...prev];
            return newArray;
        });

        setUploadedImages(prev => {
            const uploadIndex = prev.findIndex(img =>
                img.preview === organizedImages[index].preview);

            if (uploadIndex >= 0) {
                const newArray = [...prev];
                newArray[uploadIndex] = updatedFile;
                return newArray;
            }
            return prev;
        });

        setOrganizedImages(prev => {
            const uploadIndex = prev.findIndex(img =>
                img.preview === organizedImages[index].preview);

            if (uploadIndex >= 0) {
                const newArray = [...prev];
                newArray[uploadIndex] = updatedFile;
                return newArray;
            }
            return prev;
        });
    };


    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                        {!uploadComplete ? (
                            <div>
                                <div className="flex flex-col w-full items-end">
                                    {error && (
                                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-start">
                                            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                                            <div>{error}</div>
                                        </div>
                                    )}
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
                                        <div>
                                            <div className="pb-5 pt-2 flex justify-end">
                                                {organizedImages.length > 1 && (
                                                    <button
                                                        onClick={handleRemoveAllImages}
                                                        className="p-2 w-40 rounded-sm bg-red-500 text-white hover:bg-red-600"
                                                        title="Clear all"
                                                    >
                                                        Clear all Images
                                                    </button>
                                                )}
                                                <div className="ml-3">
                                                    <button
                                                        onClick={handleSubmit}
                                                        disabled={uploadQueue.isUploading}
                                                        className="bg-blue-600 h-10 w-36 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                    >
                                                        Continue
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                                                {organizedImages.map((file, index) => (
                                                    <div key={index} className="relative">
                                                        <EditableImage
                                                            file={file}
                                                            index={index}
                                                            handleRemoveImage={handleRemoveImage}
                                                            updateImageInState={updateImageInState}
                                                            disabled={uploadQueue.isUploading}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (

                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2">
                                    <h2 className="text-xl col-start-2 font-semibold mb-4 text-end pr-8">Upload Complete</h2>
                                </div>
                                <AddPhotoViewGrid images={uploadedImages} onClose={onClose} />
                            </>
                        )}
                    </div>

                    {isHaggadah && (
                        <p className="text-sm text-gray-500">
                            Haggadot prices will be updated at the checkout stage
                        </p>
                    )}
                </div>
            </div>

            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white border rounded-lg p-6 w-full text-end max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-2">Before You Continue</h3>
                        <p className="text-gray-600 leading-5 mb-10">
                            Before we upload your photos to our green cloud, it's a good idea to check that you haven't
                            accidentally left anything important out of the photos (heads, flowers, etc.).
                        </p>
                        <div className="flex justify-end h-12 space-x-3">
                            <button
                                onClick={handleCheckPhotos}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                            >
                                Check Photos
                            </button>
                            <button
                                onClick={handleUploadConfirmed}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Photos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pendingCoverAction !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-end z-40">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto">
                        <h3 className="font-medium text-lg text-end mb-2">
                            {pendingCoverAction.isUnset
                                ? "Remove Cover Image?"
                                : "Set as Cover Image?"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 text-end">
                            {pendingCoverAction.isUnset
                                ? "This image will no longer be used as the cover for your collection."
                                : "This image will be used as the cover for your collection."}
                        </p>
                    </div>
                </div>
            )}

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
