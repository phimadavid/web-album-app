"use client";

import React, { useState, useCallback, useRef } from "react";
import { EnhancedFile } from "@/backend/types/image";

export interface UploadItem {
   id: string;
   file: EnhancedFile;
   status:
      | "pending"
      | "uploading"
      | "success"
      | "error"
      | "paused"
      | "cancelled";
   progress: number;
   error?: string;
   speed?: number; // bytes per second
   timeRemaining?: number; // seconds
   retryCount: number;
   uploadedImageId?: string;
}

interface UseUploadQueueProps {
   albumId: string;
   maxConcurrent?: number;
   maxRetries?: number;
   onAllComplete?: () => void;
   onItemComplete?: (item: UploadItem) => void;
   onItemError?: (item: UploadItem) => void;
}

export function useUploadQueue({
   albumId,
   maxConcurrent = 3,
   maxRetries = 3,
   onAllComplete,
   onItemComplete,
   onItemError,
}: UseUploadQueueProps) {
   const [queue, setQueue] = useState<UploadItem[]>([]);
   const [isUploading, setIsUploading] = useState(false);
   const activeUploads = useRef(new Set<string>());
   const abortControllers = useRef(new Map<string, AbortController>());

   const addToQueue = useCallback((files: EnhancedFile[]) => {
      const newItems: UploadItem[] = files.map((file, index) => ({
         id: crypto.randomUUID(),
         file: {
            ...file,
            sortOrder: index,
         } as EnhancedFile,
         status: "pending" as const,
         progress: 0,
         retryCount: 0,
      }));

      setQueue(prev => [...prev, ...newItems]);
      return newItems;
   }, []);

   const removeFromQueue = useCallback((id: string) => {
      // Cancel if currently uploading
      const controller = abortControllers.current.get(id);
      if (controller) {
         controller.abort();
         abortControllers.current.delete(id);
      }

      setQueue(prev => prev.filter(item => item.id !== id));
      activeUploads.current.delete(id);
   }, []);

   const clearCompleted = useCallback(() => {
      setQueue(prev => prev.filter(item => item.status !== "success"));
   }, []);

   const uploadSingleFile = useCallback(
      async (item: UploadItem): Promise<void> => {
         const controller = new AbortController();
         abortControllers.current.set(item.id, controller);

         setQueue(prev =>
            prev.map(q =>
               q.id === item.id ? { ...q, status: "uploading", progress: 0 } : q
            )
         );

         try {
            const formData = new FormData();

            // Handle the enhanced file properly
            const enhancedFile = item.file as any;

            if (enhancedFile.originalFile instanceof File) {
               formData.append("file", enhancedFile.originalFile);
            } else if (enhancedFile instanceof File) {
               formData.append("file", enhancedFile);
            } else if (
               enhancedFile.preview &&
               typeof enhancedFile.preview === "string" &&
               enhancedFile.preview.startsWith("blob:")
            ) {
               const response = await fetch(enhancedFile.preview);
               const blob = await response.blob();
               const fileName =
                  enhancedFile.filename || enhancedFile.name || "image.jpg";
               formData.append("file", blob, fileName);
            } else {
               throw new Error("Invalid file format");
            }

            formData.append("albumId", albumId);
            formData.append("sortOrder", (item.file.sortOrder || 0).toString());

            // Add metadata
            const metadata = {
               preview: item.file.preview,
               captureDate: item.file.metadata?.captureDate,
               gpsLocation: item.file.metadata?.gpsLocation,
               eventGroup: item.file.metadata?.eventGroup,
               caption: item.file.metadata?.caption,
               event_tags: item.file.metadata?.eventGroupTags,
               locationName: item.file.metadata?.inferredLocation?.region,
               height: item.file.height,
               width: item.file.width,
            };

            formData.append("metadata", JSON.stringify(metadata));

            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            const startTime = Date.now();

            // Track upload progress
            xhr.upload.addEventListener("progress", event => {
               if (event.lengthComputable) {
                  const progress = (event.loaded / event.total) * 100;
                  const elapsed = (Date.now() - startTime) / 1000;
                  const speed = event.loaded / elapsed;
                  const timeRemaining =
                     speed > 0 ? (event.total - event.loaded) / speed : 0;

                  setQueue(prev =>
                     prev.map(q =>
                        q.id === item.id
                           ? {
                                ...q,
                                progress,
                                speed,
                                timeRemaining,
                             }
                           : q
                     )
                  );
               }
            });

            // Handle completion
            const uploadPromise = new Promise<void>((resolve, reject) => {
               xhr.addEventListener("load", () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                     const response = JSON.parse(xhr.responseText);
                     setQueue(prev =>
                        prev.map(q =>
                           q.id === item.id
                              ? {
                                   ...q,
                                   status: "success",
                                   progress: 100,
                                   uploadedImageId: response.imageId,
                                }
                              : q
                        )
                     );
                     onItemComplete?.(item);
                     resolve();
                  } else {
                     const errorText = xhr.responseText;
                     let errorMessage = "Upload failed";
                     try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.error || errorMessage;
                     } catch {
                        // Use default error message
                     }
                     reject(new Error(errorMessage));
                  }
               });

               xhr.addEventListener("error", () => {
                  reject(new Error("Network error occurred"));
               });

               xhr.addEventListener("abort", () => {
                  reject(new Error("Upload cancelled"));
               });
            });

            // Handle abort signal
            if (controller.signal.aborted) {
               throw new Error("Upload cancelled");
            }

            controller.signal.addEventListener("abort", () => {
               xhr.abort();
            });

            xhr.open("POST", "/api/upload/single");
            xhr.send(formData);

            await uploadPromise;
         } catch (error) {
            if (controller.signal.aborted) {
               setQueue(prev =>
                  prev.map(q =>
                     q.id === item.id ? { ...q, status: "cancelled" } : q
                  )
               );
            } else {
               const errorMessage =
                  error instanceof Error ? error.message : "Unknown error";

               setQueue(prev =>
                  prev.map(q =>
                     q.id === item.id
                        ? {
                             ...q,
                             status: "error",
                             error: errorMessage,
                             retryCount: q.retryCount + 1,
                          }
                        : q
                  )
               );

               onItemError?.({ ...item, error: errorMessage });

               // Auto-retry if under limit
               if (item.retryCount < maxRetries) {
                  setTimeout(
                     () => {
                        retryItem(item.id);
                     },
                     2000 * Math.pow(2, item.retryCount)
                  ); // Exponential backoff
               }
            }
         } finally {
            activeUploads.current.delete(item.id);
            abortControllers.current.delete(item.id);
         }
      },
      [albumId, maxRetries, onItemComplete, onItemError]
   );

   const processQueue = useCallback(async () => {
      if (!isUploading) return;

      const pendingItems = queue.filter(item => item.status === "pending");
      const availableSlots = maxConcurrent - activeUploads.current.size;

      if (availableSlots <= 0 || pendingItems.length === 0) {
         // Check if all uploads are complete
         const hasActiveUploads = queue.some(item =>
            ["uploading", "pending"].includes(item.status)
         );

         if (!hasActiveUploads && queue.length > 0) {
            setIsUploading(false);
            onAllComplete?.();
         }
         return;
      }

      const itemsToProcess = pendingItems.slice(0, availableSlots);

      for (const item of itemsToProcess) {
         activeUploads.current.add(item.id);
         uploadSingleFile(item);
      }
   }, [isUploading, queue, maxConcurrent, uploadSingleFile, onAllComplete]);

   const retryItem = useCallback(
      async (id: string) => {
         const item = queue.find(q => q.id === id);
         if (!item || item.retryCount >= maxRetries) return;

         setQueue(prev =>
            prev.map(q =>
               q.id === id
                  ? {
                       ...q,
                       status: "pending",
                       error: undefined,
                       progress: 0,
                    }
                  : q
            )
         );

         // Process the queue to start this retry
         processQueue();
      },
      [queue, maxRetries, processQueue]
   );

   const pauseItem = useCallback((id: string) => {
      const controller = abortControllers.current.get(id);
      if (controller) {
         controller.abort();
         abortControllers.current.delete(id);
      }

      setQueue(prev =>
         prev.map(q => (q.id === id ? { ...q, status: "paused" } : q))
      );
      activeUploads.current.delete(id);
   }, []);

   const resumeItem = useCallback(
      (id: string) => {
         setQueue(prev =>
            prev.map(q => (q.id === id ? { ...q, status: "pending" } : q))
         );
         processQueue();
      },
      [processQueue]
   );

   const startUploads = useCallback(() => {
      if (queue.length === 0) return;
      setIsUploading(true);
   }, [queue.length]);

   const pauseAll = useCallback(() => {
      // Pause all active uploads
      activeUploads.current.forEach(id => {
         pauseItem(id);
      });
      setIsUploading(false);
   }, [pauseItem]);

   const resumeAll = useCallback(() => {
      setIsUploading(true);
   }, []);

   const clearAll = useCallback(() => {
      // Cancel all active uploads
      abortControllers.current.forEach(controller => {
         controller.abort();
      });
      abortControllers.current.clear();
      activeUploads.current.clear();
      setQueue([]);
      setIsUploading(false);
   }, []);

   // Process queue whenever it changes
   React.useEffect(() => {
      if (isUploading) {
         processQueue();
      }
   }, [queue, isUploading, processQueue]);

   // Calculate stats
   const stats = React.useMemo(() => {
      const total = queue.length;
      const completed = queue.filter(item => item.status === "success").length;
      const failed = queue.filter(item => item.status === "error").length;
      const uploading = queue.filter(
         item => item.status === "uploading"
      ).length;
      const pending = queue.filter(item => item.status === "pending").length;

      const overallProgress = total > 0 ? (completed / total) * 100 : 0;

      // Calculate total upload speed
      const uploadingItems = queue.filter(item => item.status === "uploading");
      const totalSpeed = uploadingItems.reduce(
         (sum, item) => sum + (item.speed || 0),
         0
      );

      // Estimate time remaining
      const remainingItems = total - completed;
      const avgSpeed = totalSpeed > 0 ? totalSpeed : 0;
      const estimatedTimeRemaining =
         avgSpeed > 0 && remainingItems > 0
            ? (remainingItems * (10 * 1024 * 1024)) / avgSpeed // Assume 10MB avg per image
            : 0;

      return {
         total,
         completed,
         failed,
         uploading,
         pending,
         overallProgress,
         totalSpeed,
         estimatedTimeRemaining,
      };
   }, [queue]);

   return {
      queue,
      stats,
      isUploading,
      addToQueue,
      removeFromQueue,
      retryItem,
      pauseItem,
      resumeItem,
      startUploads,
      pauseAll,
      resumeAll,
      clearAll,
      clearCompleted,
   };
}
