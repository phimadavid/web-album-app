"use client";

import React, { useState, useEffect, useCallback } from "react";

import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import AddPhotos from "../components/addphotos";
import { ThreeDots } from "react-loader-spinner";
import Loading from "../components/loading.state";
import ErrorMessage from "../components/error.features";
import { AnimatePresence, motion } from "framer-motion";
import { NoteFeature } from "../components/note.features";
import PageSlider from "../components/page-slider";
import ImageEditor from "../components/image-editor";

import bookHand from "./../../../../../public/images/book-hand.png";

import { useAlbumData } from "@/backend/services/actions/getAlbums";
import { generateTemplateImage } from "@/lib/services/hf.generate.template";
import {
   AddPhotosModalProps,
   AlbumDataProps,
   AsideNavigationProps,
   BookAlbumPageProps,
   FlippingBookProps,
   GeneratedCaption,
} from "../data-types/types";
import {
   ChevronRight,
   ChevronLeft,
   ImagePlus,
   Upload,
   Layout,
   Grid,
   PaintBucket,
   Edit3,
   Palette,
   SquareX,
   WandSparkles,
   RefreshCw,
   X,
   Check,
   BookOpen,
   Eye,
   Save,
} from "lucide-react";

const BookAlbumPage = ({ params }: BookAlbumPageProps) => {
   const paramsId = params.id;

   const [currentPage, setCurrentPage] = useState(0);
   const [isGenerating, setIsGenerating] = useState(false);
   const [showCaptionModal, setShowCaptionModal] = useState(false);
   const [isLayoutChanging, setIsLayoutChanging] = useState(false);
   const [isBookInitialized, setIsBookInitialized] = useState(false);
   const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [activePromptIndex, setActivePromptIndex] = useState<number | null>(
      null
   );
   const [setError, isSetError] = useState<string>("");
   const [isToLoading, setIsToLoading] = useState(false);
   const [pageBackgrounds, setPageBackgrounds] = useState<string[]>([]);
   const [showAsideNavigation, setShowAsideNavigation] = useState(false);
   const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
   const [isSaving, setIsSaving] = useState(false);
   const [showPreviewModal, setShowPreviewModal] = useState(false);
   const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
   const [generatedCaptions, setGeneratedCaptions] = useState<
      GeneratedCaption[]
   >([]);
   const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);
   const [pageLayouts, setPageLayouts] = useState<string[]>([]);
   const [selectedImage, setSelectedImage] = useState<any | null>(null);
   const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
   const [activeEditorPanel, setActiveEditorPanel] = useState<string | null>(
      "editor"
   );

   // Function to handle individual page layout changes
   const handlePageLayoutChange = (slideIndex: number, layout: string) => {
      const newPageLayouts = [...pageLayouts];
      newPageLayouts[slideIndex] = layout;
      setPageLayouts(newPageLayouts);

      toast.success(`Page ${slideIndex + 1} layout changed to ${layout}`, {
         position: "bottom-right",
         autoClose: 2000,
      });
   };

   const {
      albumData,
      error,
      isLoading,
      setAlbumData,
      setCustomPrompts,
      handleSaveAlbumName,
   } = useAlbumData(params.id);

   const handlePhotosSaved = useCallback(() => {
      setIsRefreshing(true);

      if (setAlbumData && setIsToLoading) {
         setIsToLoading(true);

         axios
            .get(`/api/images/${params.id}`)
            .then(response => {
               setAlbumData((prevData: AlbumDataProps | null) => {
                  if (!prevData) return null;
                  return {
                     ...prevData,
                     images: response.data,
                  };
               });

               if (response.data && response.data.length) {
                  setPageBackgrounds(Array(response.data.length).fill(""));
                  setCustomPrompts(Array(response.data.length).fill(""));
               }
            })
            .catch(error => {
               console.error("Failed to refresh album data:", error);
               isSetError("Failed to refresh album data after adding photos");
            })
            .finally(() => {
               setIsToLoading(false);
               setIsRefreshing(false);
            });
      }
   }, [
      params.id,
      setAlbumData,
      setIsToLoading,
      setPageBackgrounds,
      setCustomPrompts,
      setError,
   ]);

   useEffect(() => {
      const initializeBookLayout = async () => {
         if (!albumData || isLoading || isBookInitialized) return;

         if (albumData?.layoutPage) {
            setIsBookInitialized(true);
            return;
         }
      };

      initializeBookLayout();
   }, [albumData?.layoutPage, isLoading, isBookInitialized]);

   if (isLoading) {
      return (
         <div className="flex flex-col h-screen items-center mt-32 justify-start w-full px-4">
            <div className="bg-white p-8 text-center place-items-center max-w-md mx-auto">
               <div>
                  <ThreeDots
                     color="#0000FF"
                     width="80"
                     visible={true}
                     aria-label="loading-indicator"
                  />
               </div>
               <h3 className="text-lg font-semibold text-gray-800 mt-4">
                  Navigating to edit mode
               </h3>
               <p className="text-sm text-gray-600 mt-2">
                  Please wait while we prepare your editing workspace...
               </p>
            </div>
         </div>
      );
   }

   if (error)
      return (
         <div>
            <ErrorMessage errorname={error} />
         </div>
      );

   const handleAddPhotos = () => {
      setShowAddPhotosModal(true);
   };

   const handleChangeLayout = async (layout: string): Promise<void> => {
      try {
         setIsLayoutChanging(true);
         const layoutType =
            layout === "multiple"
               ? "multiple"
               : layout === "sidebyside"
                 ? "sidebyside"
                 : layout === "magazine"
                   ? "magazine"
                   : layout === "palaroid"
                     ? "palaroid"
                     : layout === "Timeline"
                       ? "Timeline"
                       : layout === "random"
                         ? "random"
                         : "single";

         const albumId = params.id;

         setAlbumData(
            (prevData: AlbumDataProps | null): AlbumDataProps | null =>
               prevData
                  ? {
                       ...prevData,
                       layoutPage: layoutType,
                    }
                  : null
         );

         const data = await axios.patch(`/api/book-layout/${albumId}`, {
            layout: layoutType,
            albumId,
         });

         if (data.status === 200) {
            toast.success("Layout updated successfully", {
               position: "bottom-right",
               autoClose: 3000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
            });
         }
      } catch (error) {
         console.error("Failed to change layout:", error);

         setAlbumData(
            (prevData: AlbumDataProps | null): AlbumDataProps | null =>
               prevData
                  ? {
                       ...prevData,
                       layoutPage:
                          layout === "multiple" ? "single" : "multiple",
                    }
                  : null
         );
      } finally {
         setIsLayoutChanging(false);
      }
   };

   const handleChangeDesign = (designType: string, value?: string): void => {
      if (designType === "albumName" && value) {
         setAlbumData(
            (prevData: AlbumDataProps | null): AlbumDataProps | null => {
               if (!prevData) return null;
               return {
                  ...prevData,
                  bookName: value,
               };
            }
         );

         handleSaveAlbumName(value);
      }
   };

   const handleAddCaption = () => {
      setShowCaptionModal(true);
   };

   const handlePageChange = (page: number) => {
      setCurrentPage(page);
   };

   // Mode switching functions
   const switchToEditMode = () => {
      setViewMode("edit");
      setShowAsideNavigation(true);
   };

   const switchToPreviewMode = () => {
      if (viewMode === "edit") {
         // Show preview modal when in edit mode
         setShowPreviewModal(true);
      } else {
         setViewMode("preview");
         setShowAsideNavigation(false);
      }
   };

   const closePreviewModal = () => {
      setShowPreviewModal(false);
   };

   const handleSave = async () => {
      setIsSaving(true);
      try {
         // Add any save logic here if needed
         toast.success("Changes saved successfully!", {
            position: "bottom-right",
            autoClose: 2000,
         });
      } catch (error) {
         console.error("Error saving changes:", error);
         toast.error("Failed to save changes", {
            position: "bottom-right",
            autoClose: 2000,
         });
      } finally {
         setIsSaving(false);
      }
   };

   // Generate a single background based on a specific prompt
   const generateSingleBackground = async (
      promptWord: string,
      pageIndex: number
   ) => {
      if (!promptWord.trim()) return;

      try {
         setIsGenerating(true);
         setActivePromptIndex(pageIndex);

         // Generate two backgrounds - one for front, one for back
         const frontBackgroundImages = await generateTemplateImage(promptWord);
         const backBackgroundImages = await generateTemplateImage(promptWord);

         // Use the first generated image from each array
         const frontBackgroundImage = frontBackgroundImages[0];
         const backBackgroundImage = backBackgroundImages[0];

         // Calculate the actual indices for front and back pages
         const frontPageIndex = pageIndex * 2; // Front side
         const backPageIndex = pageIndex * 2 + 1; // Back side

         // Update backgrounds for both front and back
         setPageBackgrounds(prev => {
            const updated = [...prev];
            updated[frontPageIndex] = frontBackgroundImage;
            updated[backPageIndex] = backBackgroundImage;
            return updated;
         });

         toast.success("Backgrounds generated for both front and back!", {
            position: "bottom-right",
            autoClose: 3000,
         });
      } catch (error) {
         console.error(
            `Error generating background for prompt "${promptWord}":`,
            error
         );
         toast.error("Failed to generate backgrounds. Please try again.", {
            position: "bottom-right",
            autoClose: 3000,
         });
      } finally {
         setIsGenerating(false);
         setActivePromptIndex(null);
      }
   };

   const generateAllPagesBackground = async (promptWord: string) => {
      if (!promptWord.trim() || !albumData?.images) return;

      try {
         setIsGenerating(true);

         // Calculate total number of content pages (excluding covers)
         const totalContentPages = Math.ceil(albumData.images.length / 2);

         // Generate backgrounds for each content page (both front and back)
         for (let pageNum = 0; pageNum < totalContentPages; pageNum++) {
            try {
               // Generate two different backgrounds for variety
               const frontBackgroundImages =
                  await generateTemplateImage(promptWord);
               const backBackgroundImages =
                  await generateTemplateImage(promptWord);

               const frontBackgroundImage = frontBackgroundImages[0];
               const backBackgroundImage = backBackgroundImages[0];

               // Calculate indices for front and back
               const frontPageIndex = pageNum * 2;
               const backPageIndex = pageNum * 2 + 1;

               setPageBackgrounds(prev => {
                  const updated = [...prev];
                  updated[frontPageIndex] = frontBackgroundImage;
                  updated[backPageIndex] = backBackgroundImage;
                  return updated;
               });

               // Small delay between generations to avoid overwhelming the API
               await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
               console.error(
                  `Failed to generate background for page ${pageNum}:`,
                  error
               );
            }
         }

         toast.success(
            "Backgrounds generated for all pages (front and back)!",
            {
               position: "bottom-right",
               autoClose: 3000,
            }
         );
      } catch (error) {
         console.error("Error generating backgrounds for all pages:", error);
         toast.error("Failed to generate backgrounds. Please try again.", {
            position: "bottom-right",
            autoClose: 3000,
         });
      } finally {
         setIsGenerating(false);
      }
   };

   // Parse dimensions from string "20x20" format
   const getAlbumBookDimensions = () => {
      if (!albumData || !albumData.webSizePx)
         return { width: 530, height: 520 };
      // Handle both 'x' and '×' characters as separators
      const dimensions = albumData.webSizePx.split(/[x×]/);
      const width = Number(dimensions[0]);
      const height = Number(dimensions[1]);

      return { width, height };
   };

   const getImagePixel = () => {
      if (!albumData || !albumData.webPhotoSizePx)
         return { width: 530, height: 520 };
      // Handle both 'x' and '×' characters as separators
      const dimensions = albumData.webPhotoSizePx.split(/[x×]/);
      const photoWidth = Number(dimensions[0]);
      const photoHeight = Number(dimensions[1]);

      return { photoWidth, photoHeight };
   };

   // Function to generate AI captions for selected image or all images
   const generateCaptionsForCurrentPage = async () => {
      if (!albumData?.images || albumData.images.length === 0) return;

      try {
         setIsGeneratingCaptions(true);

         const newCaptions: GeneratedCaption[] = [];

         // If a specific image is selected, generate caption only for that image
         if (
            selectedImageIndex >= 0 &&
            selectedImageIndex < albumData.images.length
         ) {
            const image = albumData.images[selectedImageIndex];

            // Check if caption already exists for this image
            const existingCaption = generatedCaptions.find(
               caption => caption.imageIndex === selectedImageIndex
            );
            if (existingCaption) {
               toast.info(
                  `Caption already exists for Image ${selectedImageIndex + 1}`,
                  {
                     position: "bottom-right",
                     autoClose: 2000,
                  }
               );
               return;
            }

            // Generate caption for selected image
            const mockCaptions = await generateMockCaptions(image);

            const captionData: GeneratedCaption = {
               id: `caption-${Date.now()}-${selectedImageIndex}`,
               shortCaption: mockCaptions.short,
               longCaption: mockCaptions.long,
               imageIndex: selectedImageIndex,
               createdAt: new Date(),
            };

            newCaptions.push(captionData);

            toast.success(
               `Generated caption for Image ${selectedImageIndex + 1}!`,
               {
                  position: "bottom-right",
                  autoClose: 3000,
               }
            );
         } else {
            // No specific image selected, generate for all uncaptioned images
            for (let i = 0; i < albumData.images.length; i++) {
               const image = albumData.images[i];
               if (!image) continue;

               // Skip if caption already exists for this image
               const existingCaption = generatedCaptions.find(
                  caption => caption.imageIndex === i
               );
               if (existingCaption) continue;

               // Mock AI caption generation - replace with actual AI service call
               const mockCaptions = await generateMockCaptions(image);

               const captionData: GeneratedCaption = {
                  id: `caption-${Date.now()}-${i}`,
                  shortCaption: mockCaptions.short,
                  longCaption: mockCaptions.long,
                  imageIndex: i,
                  createdAt: new Date(),
               };

               newCaptions.push(captionData);
            }

            toast.success(
               `Generated ${newCaptions.length} new captions for your album!`,
               {
                  position: "bottom-right",
                  autoClose: 3000,
               }
            );
         }

         setGeneratedCaptions(prev => [...prev, ...newCaptions]);
      } catch (error) {
         console.error("Error generating captions:", error);
         toast.error("Failed to generate captions. Please try again.", {
            position: "bottom-right",
            autoClose: 3000,
         });
      } finally {
         setIsGeneratingCaptions(false);
      }
   };

   // Mock function to simulate AI caption generation
   const generateMockCaptions = async (
      image: any
   ): Promise<{ short: string; long: string }> => {
      // Simulate API delay
      await new Promise(resolve =>
         setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      // Mock captions based on image metadata or random generation
      const shortCaptions = [
         "Beautiful moment",
         "Precious memory",
         "Special day",
         "Happy times",
         "Life's joy",
         "Sweet memories",
      ];

      const longCaptions = [
         "A beautiful moment captured in time, filled with joy and happiness that will be treasured forever.",
         "This precious memory showcases the beauty of life's simple pleasures and meaningful connections.",
         "A special day that reminds us of the importance of celebrating life's wonderful moments together.",
         "Happy times shared with loved ones, creating memories that warm our hearts for years to come.",
         "Life's joyful moments like these remind us to appreciate the beauty in everyday experiences.",
         "Sweet memories that capture the essence of love, laughter, and the bonds that matter most.",
      ];

      const randomShort =
         shortCaptions[Math.floor(Math.random() * shortCaptions.length)];
      const randomLong =
         longCaptions[Math.floor(Math.random() * longCaptions.length)];

      return {
         short: randomShort,
         long: randomLong,
      };
   };

   // Function to save caption to text annotation
   const saveCaptionToTextAnnotation = async (
      captionText: string,
      imageIndex: number,
      captionId: string
   ) => {
      try {
         if (!albumData?.images || imageIndex >= albumData.images.length) {
            throw new Error("Invalid image index");
         }

         const image = albumData.images[imageIndex];

         // Create text annotation object
         const textAnnotation = {
            textContent: captionText,
            position: { x: 50, y: 85 }, // Default position at bottom center
            style: {
               fontSize: "18px",
               color: "#ffffff",
               fontFamily: "Arial, sans-serif",
               fontWeight: "bold",
            },
         };

         // Update the image metadata with text annotation
         const response = await axios.patch(
            `/api/images/${image.id}/text-annotation`,
            {
               textAnnotation: textAnnotation,
            }
         );

         if (response.status === 200) {
            // Update local state
            interface ImageMetadata {
               textAnnotation: {
                  textContent: string;
                  position: { x: number; y: number };
                  style: {
                     fontSize: string;
                     color: string;
                     fontFamily: string;
                     fontWeight: string;
                  };
               };
               [key: string]: any; // For other metadata properties
            }

            interface AlbumImage {
               id?: string;
               s3Url?: string;
               previewUrl?: string;
               metadata: ImageMetadata;
               [key: string]: any; // For other image properties
            }

            interface AlbumData {
               images?: AlbumImage[];
               bookName?: string;
               [key: string]: any; // For other album properties
            }

            setAlbumData(
               (prevData: AlbumDataProps | null): AlbumDataProps | null => {
                  if (!prevData) return null;

                  const updatedImages = prevData.images
                     ? [...prevData.images]
                     : [];
                  if (updatedImages[imageIndex]) {
                     updatedImages[imageIndex] = {
                        ...updatedImages[imageIndex],
                        metadata: {
                           ...updatedImages[imageIndex].metadata,
                           textAnnotation: textAnnotation,
                        },
                     };
                  }

                  return {
                     ...prevData,
                     images: updatedImages,
                  };
               }
            );

            setCopiedCaptionId(captionId);
            toast.success("Caption saved to image!", {
               position: "bottom-right",
               autoClose: 2000,
            });

            // Reset saved state after 2 seconds
            setTimeout(() => setCopiedCaptionId(null), 2000);
         }
      } catch (error) {
         console.error("Failed to save caption to text annotation:", error);
         toast.error("Failed to save caption to image", {
            position: "bottom-right",
            autoClose: 2000,
         });
      }
   };

   // Function to handle image updates from the editor
   const handleImageUpdate = (index: number, updatedImage: any) => {
      setAlbumData((prevData: AlbumDataProps | null): AlbumDataProps | null => {
         if (!prevData || !prevData.images) return prevData;

         const updatedImages = [...prevData.images];
         if (updatedImages[index]) {
            updatedImages[index] = updatedImage;
         }

         return {
            ...prevData,
            images: updatedImages,
         };
      });

      // Update selected image if it's the one being edited
      if (index === selectedImageIndex) {
         setSelectedImage(updatedImage);
      }

      toast.success("Image updated successfully!", {
         position: "bottom-right",
         autoClose: 2000,
      });
   };

   // Function to handle image selection
   const handleImageSelect = (image: any, index: number) => {
      setSelectedImage(image);
      setSelectedImageIndex(index);
   };

   // Function to handle image selection and auto-open editor
   const handleImageSelectAndEdit = (image: any, index: number) => {
      setSelectedImage(image);
      setSelectedImageIndex(index);
      // Auto-open editor panel by setting active panel to 'editor'
      setActiveEditorPanel("editor");
   };

   const isContentPage: boolean =
      (currentPage > 0 &&
         currentPage < (albumData?.images?.length || 0) / 1 + 1) ||
      (currentPage === 0 && !!albumData?.images?.length);

   const AlbumBookName = albumData?.bookName;
   const lastPhotoIndex = albumData?.images?.length
      ? albumData?.images?.length - 1
      : 0;
   const numberOfImage = albumData?.images?.length;
   const lastPhoto = albumData?.images?.[lastPhotoIndex];
   const lastPhotoUrl = lastPhoto?.previewUrl || "";

   const { width, height } = getAlbumBookDimensions();
   const { photoWidth, photoHeight } = getImagePixel();

   return (
      <div className="flex w-full flex-col">
         {/* Mobile Header */}
         <div className="lg:hidden bg-blue-50 p-4 flex items-center justify-between border-b">
            <div className="flex-1">
               <p className="font-bold text-center">{AlbumBookName}</p>
               {isRefreshing && isToLoading && (
                  <div className="flex items-center justify-center text-blue-600 mt-2">
                     <RefreshCw size={16} className="animate-spin mr-1" />
                     <span className="text-sm">Refreshing...</span>
                  </div>
               )}
            </div>

            {/* Mobile Mode Toggle Buttons */}
            <div className="flex gap-2">
               <button
                  onClick={switchToEditMode}
                  className={`p-2 rounded-lg shadow-md transition-colors flex items-center gap-1 ${
                     viewMode === "edit"
                        ? "bg-blue-600 text-white"
                        : "bg-white hover:bg-gray-50"
                  }`}
               >
                  <Edit3 size={16} />
                  <span className="text-sm">Edit</span>
               </button>
               {viewMode === "edit" && (
                  <button
                     onClick={handleSave}
                     disabled={isSaving}
                     className={`p-2 rounded-lg shadow-md transition-colors flex items-center gap-1 ${
                        isSaving
                           ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                           : "bg-green-600 text-white hover:bg-green-700"
                     }`}
                  >
                     {isSaving ? (
                        <>
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           <span className="text-sm">Saving...</span>
                        </>
                     ) : (
                        <>
                           <Save size={16} />
                           <span className="text-sm">Save</span>
                        </>
                     )}
                  </button>
               )}
               <button
                  onClick={switchToPreviewMode}
                  className={`p-2 rounded-lg shadow-md transition-colors flex items-center gap-1 ${
                     viewMode === "preview"
                        ? "bg-blue-600 text-white"
                        : "bg-white hover:bg-gray-50"
                  }`}
               >
                  <Eye size={16} />
                  <span className="text-sm">Preview</span>
               </button>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row">
            {/* Main Content */}
            <div className="flex-1">
               {/* Desktop Header */}
               <div className="hidden lg:flex flex-col md:flex-row justify-center">
                  <div className="flex flex-row justify-between w-full px-10 pt-4">
                     <div>
                        <p className="font-bold">{AlbumBookName}</p>
                        <span className="box italic text-xs">album name</span>
                     </div>
                     <div className="flex gap-2">
                        <button
                           onClick={switchToPreviewMode}
                           className={`px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2 ${
                              viewMode === "preview"
                                 ? "bg-blue-600 text-white"
                                 : "bg-white hover:bg-gray-50 border border-gray-200"
                           }`}
                        >
                           <Eye size={16} />
                           <span>Preview</span>
                        </button>
                     </div>
                  </div>

                  {isRefreshing && isToLoading && (
                     <div className="flex items-center text-blue-600 ml-4">
                        <RefreshCw size={16} className="animate-spin mr-1" />
                        <span className="text-sm">Refreshing...</span>
                     </div>
                  )}
               </div>

               <motion.div>
                  {isLayoutChanging || isRefreshing || isToLoading ? (
                     <Loading />
                  ) : viewMode === "edit" ? (
                     <PageSlider
                        albumData={albumData}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        pageBackgrounds={pageBackgrounds}
                        onSave={handleSave}
                        isSaving={isSaving}
                        onPreview={switchToPreviewMode}
                        pageLayouts={pageLayouts}
                        onPageLayoutChange={handlePageLayoutChange}
                        selectedImageIndex={selectedImageIndex}
                        onImageSelect={handleImageSelectAndEdit}
                     />
                  ) : (
                     <FlippingBook
                        coverColor="#8B4513"
                        albumData={albumData}
                        photoWidth={photoWidth}
                        photoHeight={photoHeight}
                        width={width}
                        height={height}
                        coverImage={albumData?.bookDesign}
                        lastPhoto={lastPhoto}
                        lastPhotoUrl={lastPhotoUrl}
                        numberOfImages={numberOfImage}
                        onPageChange={handlePageChange}
                        key={albumData?.layoutPage || "default"}
                        isLayoutChanging={isLayoutChanging}
                        pageBackgrounds={pageBackgrounds}
                        pageLayouts={pageLayouts}
                     />
                  )}
               </motion.div>
            </div>

            {/* Aside Navigation - Only show in edit mode */}
            <div
               className={`${viewMode === "edit" && showAsideNavigation ? "block" : "hidden"} max-w-96 ${viewMode === "edit" ? "lg:block" : "lg:hidden"}`}
            >
               <AsideNavigation
                  params={paramsId}
                  albumData={albumData as AlbumDataProps}
                  currentPage={currentPage}
                  onAddPhotos={handleAddPhotos}
                  onChangeLayout={handleChangeLayout}
                  onChangeDesign={handleChangeDesign}
                  onAddCaption={handleAddCaption}
                  generateSingleBackground={generateSingleBackground}
                  isGeneratingBackground={isGenerating}
                  generateAllPagesBackground={generateAllPagesBackground}
                  onClose={() => setShowAsideNavigation(false)}
                  isContentPage={isContentPage}
                  generateCaptionsForCurrentPage={
                     generateCaptionsForCurrentPage
                  }
                  isGeneratingCaptions={isGeneratingCaptions}
                  generatedCaptions={generatedCaptions}
                  saveCaptionToTextAnnotation={saveCaptionToTextAnnotation}
                  copiedCaptionId={copiedCaptionId}
                  selectedImage={selectedImage}
                  selectedImageIndex={selectedImageIndex}
                  onImageUpdate={handleImageUpdate}
                  onImageSelect={handleImageSelectAndEdit}
                  activePanel={activeEditorPanel}
                  setActivePanel={setActiveEditorPanel}
               />
            </div>
         </div>

         {/* Mobile Overlay */}
         {showAsideNavigation && (
            <div
               className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
               onClick={() => setShowAsideNavigation(false)}
            />
         )}

         <AnimatePresence>
            {showAddPhotosModal && (
               <AddPhotosModal
                  params={params}
                  isOpen={showAddPhotosModal}
                  onClose={() => setShowAddPhotosModal(false)}
                  onPhotosSaved={handlePhotosSaved}
               />
            )}
         </AnimatePresence>

         <AnimatePresence>
            {showCaptionModal && (
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed inset-0 flex items-center justify-center z-30 p-4"
               >
                  <div
                     className="absolute inset-0 bg-black bg-opacity-50"
                     onClick={() => setShowCaptionModal(false)}
                  ></div>
                  <motion.div
                     className="relative bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 z-70 max-h-[90vh] overflow-y-auto"
                     initial={{ scale: 0.95 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0.95 }}
                  >
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                           Under Testing and Development
                        </h3>
                        <button
                           onClick={() => setShowCaptionModal(false)}
                           className="text-gray-500 hover:text-gray-700 transition-colors"
                           aria-label="Close"
                        >
                           <SquareX size={25} className="mr-2 text-red-600" />
                        </button>
                     </div>

                     <NoteFeature description="This feature is currently in development and testing phase." />

                     <div className="text-gray-600 mb-6">
                        <p>
                           Our development team is working on implementing the
                           photo upload functionality. This feature will allow
                           you to add caption in the images to your album.
                        </p>
                        <p className="mt-2">Expected completion: Soon</p>
                     </div>

                     <div className="flex justify-end">
                        <button
                           onClick={() => setShowCaptionModal(false)}
                           className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                           Got it
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Preview Modal */}
         <AnimatePresence>
            {showPreviewModal && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
               >
                  <div
                     className="absolute inset-0 bg-black bg-opacity-50"
                     onClick={closePreviewModal}
                  ></div>
                  <motion.div
                     className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden z-60"
                     initial={{ scale: 0.9, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.9, y: 20 }}
                     transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                     }}
                  >
                     {/* Modal Header */}
                     <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                           <BookOpen size={24} className="text-blue-600" />
                           <div>
                              <h3 className="text-lg font-semibold text-gray-800">
                                 Book Preview
                              </h3>
                              <p className="text-sm text-gray-600">
                                 {AlbumBookName}
                              </p>
                           </div>
                        </div>
                        <button
                           onClick={closePreviewModal}
                           className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                           aria-label="Close Preview"
                        >
                           <X size={24} className="text-gray-600" />
                        </button>
                     </div>

                     {/* Modal Content */}
                     <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                        <FlippingBook
                           coverColor="#8B4513"
                           albumData={albumData}
                           photoWidth={photoWidth}
                           photoHeight={photoHeight}
                           width={width}
                           height={height}
                           coverImage={albumData?.bookDesign}
                           lastPhoto={lastPhoto}
                           lastPhotoUrl={lastPhotoUrl}
                           numberOfImages={numberOfImage}
                           onPageChange={handlePageChange}
                           key={`preview-${albumData?.layoutPage || "default"}`}
                           isLayoutChanging={isLayoutChanging}
                           pageBackgrounds={pageBackgrounds}
                           pageLayouts={pageLayouts}
                        />
                     </div>

                     {/* Modal Footer */}
                     <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                           Use the navigation arrows to flip through your book
                        </div>
                        <button
                           onClick={closePreviewModal}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                           <Eye size={16} />
                           Close Preview
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

const AddPhotosModal: React.FC<AddPhotosModalProps> = ({
   isOpen,
   onClose,
   params,
   onPhotosSaved,
}) => {
   const [isClosing, setIsClosing] = useState(false);

   useEffect(() => {
      const handleEscKey = (event: KeyboardEvent) => {
         if (event.key === "Escape") {
            handleClose();
         }
      };

      if (isOpen) {
         document.addEventListener("keydown", handleEscKey);
      }

      return () => {
         document.removeEventListener("keydown", handleEscKey);
      };
   }, [isOpen]);

   const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
         setIsClosing(false);
         onClose();
      }, 300);
   };

   const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
         handleClose();
      }
   };

   if (!isOpen) return null;

   return (
      <div
         className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         onClick={handleBackdropClick}
      >
         <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
               opacity: isClosing ? 0 : 1,
               scale: isClosing ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md lg:max-w-5xl mx-4 max-h-[90vh] sm:max-h-[80vh]"
            onClick={e => e.stopPropagation()}
         >
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold">Add Photos</h3>
               <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700"
               >
                  <SquareX size={25} className="mr-2 text-red-600" />
               </button>
            </div>
            <div className="overflow-y-auto h-[calc(90vh-120px)] sm:h-[calc(80vh-100px)]">
               <AddPhotos
                  params={params}
                  onClose={() => {
                     // If onPhotosSaved callback exists, call it to trigger book refresh
                     if (onPhotosSaved) {
                        onPhotosSaved();
                     }
                     handleClose();
                  }}
               />
            </div>
         </motion.div>
      </div>
   );
};

const FlippingBook: React.FC<FlippingBookProps> = ({
   width,
   height,
   photoHeight,
   photoWidth,
   coverColor,
   coverImage,
   lastPhoto,
   lastPhotoUrl,
   onPageChange,
   numberOfImages,
   albumData,
   isLayoutChanging,
   pageBackgrounds,
   pageLayouts,
   handleTextContentSave,
}) => {
   const [currentLocation, setCurrentLocation] = useState<number>(0);
   const [isBookOpen, setIsBookOpen] = useState<boolean>(false);
   const [isAtBeginning, setIsAtBeginning] = useState<boolean>(true);
   const [hasAutoOpened, setHasAutoOpened] = useState<boolean>(false);

   const imageData = albumData?.images || [];
   const pageLayout = albumData?.layoutPage;

   // Function to get layout for a specific page
   const getLayoutForPage = (pageIndex: number): string => {
      // If pageLayouts array exists and has a layout for this page, use it
      if (pageLayouts && pageLayouts[pageIndex]) {
         return pageLayouts[pageIndex];
      }
      // Otherwise, fall back to global layout
      return pageLayout || "single";
   };

   // Function to get images per page for a specific layout
   const getImagesPerPageForLayout = (layout: string): number => {
      switch (layout) {
         case "multiple":
            return 4;
         case "sidebyside":
            return 2;
         case "magazine":
            return 4;
         case "palaroid":
            return 4;
         case "Timeline":
            return 3;
         case "random":
            return 2;
         default:
            return 1;
      }
   };

   const imagesPerPage = getImagesPerPageForLayout(pageLayout || "single");

   const imagesPerPaper = imagesPerPage * 2;
   const actualNumOfPapers = Math.ceil(imageData.length / 2) || 0;

   const numOfPapers =
      pageLayout === "multiple"
         ? Math.max(actualNumOfPapers / 2)
         : pageLayout === "sidebyside"
           ? Math.max(actualNumOfPapers - 2)
           : pageLayout === "magazine"
             ? Math.max(actualNumOfPapers / 2)
             : pageLayout === "palaroid"
               ? Math.max(actualNumOfPapers / 2)
               : pageLayout === "Timeline"
                 ? Math.max(actualNumOfPapers / 2)
                 : pageLayout === "random"
                   ? Math.max(actualNumOfPapers)
                   : Math.max(actualNumOfPapers + 1);

   const maxLocation = numOfPapers + 2;

   useEffect(() => {
      if (!hasAutoOpened && !isLayoutChanging) {
         const timer = setTimeout(() => {
            openBook();
            setCurrentLocation(2);
            if (onPageChange) {
               onPageChange(2);
            }
            setHasAutoOpened(true);
         }, 1500);

         return () => clearTimeout(timer);
      }
   }, [isLayoutChanging, hasAutoOpened, onPageChange]);

   const bookVariants = {
      closed: (isAtBeginning: boolean) => ({
         x: isAtBeginning ? "0%" : "100%",
         transition: {
            duration: 0.5,
            ease: "easeInOut" as const,
         },
      }),
      open: {
         x: "50%",
         transition: {
            duration: 0.5,
            ease: "easeInOut" as const,
         },
      },
   };

   const buttonVariants = {
      hidden: {
         x: 0,
         transition: {
            duration: 0.5,
            ease: "easeInOut" as const,
         },
      },
      visible: (isLeft: boolean) => ({
         x: isLeft ? -180 : 180,
         transition: {
            duration: 0.5,
            ease: "easeInOut" as const,
         },
      }),
   };

   const pageVariants = {
      unflipped: {
         rotateY: 0,
         transition: {
            duration: 0.7,
            ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number], // Custom easing for paper flip feel
         },
      },
      flipped: {
         rotateY: -180,
         transition: {
            duration: 0.7,
            ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
         },
      },
   };

   const openBook = () => {
      setIsBookOpen(true);
      setIsAtBeginning(false);
   };

   const closeBook = (atBeginning: boolean) => {
      setIsBookOpen(false);
      setIsAtBeginning(atBeginning);
   };

   const goNextPage = () => {
      if (currentLocation < maxLocation) {
         if (currentLocation === 1) {
            openBook();
         } else if (currentLocation === numOfPapers + 1) {
            closeBook(false);
         }
         setCurrentLocation(currentLocation + 1);

         if (onPageChange) {
            onPageChange(currentLocation + 1);
         }
      }
   };

   const goPrevPage = () => {
      if (currentLocation > 1) {
         if (currentLocation === 2) {
            closeBook(true);
         } else if (currentLocation === maxLocation) {
            openBook();
         }
         setCurrentLocation(currentLocation - 1);

         // Call the page change callback if provided
         if (onPageChange) {
            onPageChange(currentLocation - 1);
         }
      }
   };

   const formatDate = (dateString: string | null) => {
      if (!dateString) return "";

      try {
         const date = new Date(dateString);
         return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
         });
      } catch (e) {
         return "";
      }
   };

   const parseTextAnnotation = (image: any) => {
      if (!image?.metadata?.textAnnotation) return null;

      try {
         // Check if textAnnotation is a string and parse it
         if (typeof image?.metadata?.textAnnotation === "string") {
            return JSON.parse(image?.metadata?.textAnnotation);
         } else {
            // It's already an object
            return image?.metadata?.textAnnotation;
         }
      } catch (error) {
         console.error("Error parsing textAnnotation:", error);
         return null;
      }
   };

   const getImageStyle = (image: any) => {
      let style: React.CSSProperties = {
         objectFit: "cover",
         transform: "",
      };

      if (image?.metadata?.rotation) {
         style.transform = `rotate(${image?.metadata.rotation}deg)`;
      }

      if ((image?.metadata?.zoom || 1.0) > 1.0) {
         style = {
            ...style,
            transform: `${style.transform ? style.transform : ""} scale(${image?.metadata?.zoom})`,
            transformOrigin: `${image?.metadata?.zoomPosition?.x || 50}% ${image?.metadata?.zoomPosition?.y || 50}%`,
            objectFit: "cover",
         };
      }

      return style;
   };

   const getContainerStyle = (image: any) => {
      let style: React.CSSProperties = {
         overflow: "hidden",
         position: "relative",
         display: "flex",
         justifyContent: "center",
         alignItems: "center",
         width: "100%",
         height: "100%",
      };

      if ((image?.metadata?.zoom || 1.0) > 1.0) {
         style.overflow = "hidden"; // Ensure overflow is hidden to contain the zoomed content
      }

      return style;
   };

   const renderImage = (image: any, index: number) => {
      if (!image) return null;

      const parsedTextAnnotation = parseTextAnnotation(image);

      return (
         <div
            key={`image-${index}`}
            className="flex justify-center items-center relative"
            style={{
               width: pageLayout === "multiple" ? "50%" : "100%",
               height: pageLayout === "multiple" ? "50%" : "100%",
               padding: "4px",
            }}
         >
            <div
               style={getContainerStyle(image)}
               className="border-2 border-white aspect-square"
            >
               <div
                  style={{
                     width: `${(image?.metadata?.zoom || 1.0) * 100}%`,
                     height: `${(image?.metadata?.zoom || 1.0) * 100}%`,
                     position: "relative",
                  }}
               >
                  <img
                     src={image.s3Url}
                     alt={`Image ${index}`}
                     className="w-full h-full"
                     style={getImageStyle(image)}
                  />
               </div>

               {/* Text Annotation */}
               {parsedTextAnnotation &&
                  parsedTextAnnotation.position &&
                  parsedTextAnnotation.textContent && (
                     <div
                        className="absolute pointer-events-none"
                        style={{
                           left: `${parsedTextAnnotation?.position.x}%`,
                           top: `${parsedTextAnnotation?.position.y}%`,
                           transform: "translate(-50%, -50%)",
                           color:
                              parsedTextAnnotation?.style?.color || "#ffffff",
                           fontSize:
                              parsedTextAnnotation?.style?.fontSize || "24px",
                           fontFamily:
                              parsedTextAnnotation?.style?.fontFamily ||
                              "Arial, sans-serif",
                           fontWeight:
                              parsedTextAnnotation?.style?.fontWeight ||
                              "normal",
                           textShadow:
                              "0px 0px 4px #000000, 0px 0px 4px #000000",
                           backgroundColor: "rgba(0, 0, 0, 0.3)",
                           padding: "4px 8px",
                           borderRadius: "4px",
                           whiteSpace: "nowrap",
                           textAlign: "center",
                           boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                        }}
                     >
                        {parsedTextAnnotation?.textContent}
                     </div>
                  )}
            </div>

            {/* Editable Text Annotation -- this text annotation is a text content on the image, this part is to save and edit the text annotation */}
            {/* {parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent && (
          <EditableTextAnnotation
            textAnnotation={parsedTextAnnotation}
            onSave={(updatedAnnotation) => {
              const defaultStyle = {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'normal'
              };

              handleTextContentSave({
                ...updatedAnnotation,
                style: {
                  ...defaultStyle,
                  ...updatedAnnotation.style
                }
              }, index);
            }}
            imageIndex={index}
          />
        )} */}
         </div>
      );
   };

   const renderSidebySideStyle = (images: any[], startIndex: number = 0) => {
      const leftImage = startIndex < images.length ? images[startIndex] : null;
      const rightImage =
         startIndex + 1 < images.length ? images[startIndex + 1] : null;

      return (
         <div className="w-full h-full flex gap-2">
            {/* Left side */}
            <div className="flex-1 flex justify-center items-center">
               {leftImage ? (
                  <div className="w-full h-full relative">
                     <div
                        style={getContainerStyle(leftImage)}
                        className="border-2 border-white w-full h-full"
                     >
                        <img
                           src={leftImage.s3Url}
                           alt={`Image ${startIndex}`}
                           className="w-full h-full"
                           style={getImageStyle(leftImage)}
                        />
                     </div>
                     {/* Text Annotation for left image */}
                     {(() => {
                        const parsedTextAnnotation =
                           parseTextAnnotation(leftImage);
                        return parsedTextAnnotation &&
                           parsedTextAnnotation.position &&
                           parsedTextAnnotation.textContent ? (
                           <div
                              className="absolute z-30 pointer-events-none"
                              style={{
                                 left: `${parsedTextAnnotation.position.x}%`,
                                 top: `${parsedTextAnnotation.position.y}%`,
                                 transform: "translate(-50%, -50%)",
                                 color:
                                    parsedTextAnnotation.style?.color ||
                                    "#ffffff",
                                 fontSize:
                                    parsedTextAnnotation.style?.fontSize ||
                                    "24px",
                                 fontFamily:
                                    parsedTextAnnotation.style?.fontFamily ||
                                    "Arial, sans-serif",
                                 fontWeight:
                                    parsedTextAnnotation.style?.fontWeight ||
                                    "normal",
                                 textShadow:
                                    "0px 0px 4px #000000, 0px 0px 4px #000000",
                                 backgroundColor: "rgba(0, 0, 0, 0.3)",
                                 padding: "4px 8px",
                                 borderRadius: "4px",
                                 whiteSpace: "nowrap",
                                 maxWidth: "80%",
                                 textAlign: "center",
                                 boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                              }}
                           >
                              {parsedTextAnnotation.textContent}
                           </div>
                        ) : null;
                     })()}
                  </div>
               ) : (
                  <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400">
                     No Image
                  </div>
               )}
            </div>

            {/* Right side */}
            <div className="flex-1 flex justify-center items-center">
               {rightImage ? (
                  <div className="w-full h-full relative">
                     <div
                        style={getContainerStyle(rightImage)}
                        className="border-2 border-white w-full h-full"
                     >
                        <img
                           src={rightImage.s3Url}
                           alt={`Image ${startIndex + 1}`}
                           className="w-full h-full"
                           style={getImageStyle(rightImage)}
                        />
                     </div>
                     {/* Text Annotation for right image */}
                     {(() => {
                        const parsedTextAnnotation =
                           parseTextAnnotation(rightImage);
                        return parsedTextAnnotation &&
                           parsedTextAnnotation.position &&
                           parsedTextAnnotation.textContent ? (
                           <div
                              className="absolute z-30 pointer-events-none"
                              style={{
                                 left: `${parsedTextAnnotation.position.x}%`,
                                 top: `${parsedTextAnnotation.position.y}%`,
                                 transform: "translate(-50%, -50%)",
                                 color:
                                    parsedTextAnnotation.style?.color ||
                                    "#ffffff",
                                 fontSize:
                                    parsedTextAnnotation.style?.fontSize ||
                                    "24px",
                                 fontFamily:
                                    parsedTextAnnotation.style?.fontFamily ||
                                    "Arial, sans-serif",
                                 fontWeight:
                                    parsedTextAnnotation.style?.fontWeight ||
                                    "normal",
                                 textShadow:
                                    "0px 0px 4px #000000, 0px 0px 4px #000000",
                                 backgroundColor: "rgba(0, 0, 0, 0.3)",
                                 padding: "4px 8px",
                                 borderRadius: "4px",
                                 whiteSpace: "nowrap",
                                 maxWidth: "80%",
                                 textAlign: "center",
                                 boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                              }}
                           >
                              {parsedTextAnnotation.textContent}
                           </div>
                        ) : null;
                     })()}
                  </div>
               ) : (
                  <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400">
                     No Image
                  </div>
               )}
            </div>
         </div>
      );
   };

   const renderMagazineStyle = (images: any[], startIndex: number = 0) => {
      const mainImage = startIndex < images.length ? images[startIndex] : null;
      const thumbnails = images.slice(startIndex + 1, startIndex + 4);

      return (
         <div className="w-full h-full flex">
            {/* Main image (2/3 width) */}
            <div className="w-2/3 pr-2">
               {mainImage ? (
                  <div className="w-full h-full relative">
                     <div
                        style={getContainerStyle(mainImage)}
                        className="border-2 border-white w-full h-full"
                     >
                        <img
                           src={mainImage.s3Url}
                           alt={`Main Image ${startIndex}`}
                           className="w-full h-full"
                           style={getImageStyle(mainImage)}
                        />
                     </div>
                     {/* Text Annotation for main image */}
                     {(() => {
                        const parsedTextAnnotation =
                           parseTextAnnotation(mainImage);
                        return parsedTextAnnotation &&
                           parsedTextAnnotation.position &&
                           parsedTextAnnotation.textContent ? (
                           <div
                              className="absolute z-30 pointer-events-none"
                              style={{
                                 left: `${parsedTextAnnotation.position.x}%`,
                                 top: `${parsedTextAnnotation.position.y}%`,
                                 transform: "translate(-50%, -50%)",
                                 color:
                                    parsedTextAnnotation.style?.color ||
                                    "#ffffff",
                                 fontSize:
                                    parsedTextAnnotation.style?.fontSize ||
                                    "20px",
                                 fontFamily:
                                    parsedTextAnnotation.style?.fontFamily ||
                                    "Arial, sans-serif",
                                 fontWeight:
                                    parsedTextAnnotation.style?.fontWeight ||
                                    "normal",
                                 textShadow:
                                    "0px 0px 4px #000000, 0px 0px 4px #000000",
                                 backgroundColor: "rgba(0, 0, 0, 0.3)",
                                 padding: "4px 8px",
                                 borderRadius: "4px",
                                 whiteSpace: "nowrap",
                                 maxWidth: "80%",
                                 textAlign: "center",
                                 boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                              }}
                           >
                              {parsedTextAnnotation.textContent}
                           </div>
                        ) : null;
                     })()}
                  </div>
               ) : (
                  <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400">
                     No Main Image
                  </div>
               )}
            </div>

            {/* Thumbnail column (1/3 width) */}
            <div className="w-1/3 grid grid-rows-3 gap-2">
               {thumbnails.map((image, index) => (
                  <div
                     key={`thumb-${startIndex + 1 + index}`}
                     className="w-full aspect-square relative"
                  >
                     {image ? (
                        <div className="w-full h-full relative">
                           <div
                              style={getContainerStyle(image)}
                              className="border-2 border-white w-full h-full"
                           >
                              <img
                                 src={image.s3Url}
                                 alt={`Thumbnail ${startIndex + 1 + index}`}
                                 className="w-full h-full"
                                 style={getImageStyle(image)}
                              />
                           </div>
                           {/* Text Annotation for thumbnail */}
                           {(() => {
                              const parsedTextAnnotation =
                                 parseTextAnnotation(image);
                              return parsedTextAnnotation &&
                                 parsedTextAnnotation.position &&
                                 parsedTextAnnotation.textContent ? (
                                 <div
                                    className="absolute z-30 pointer-events-none"
                                    style={{
                                       left: `${parsedTextAnnotation.position.x}%`,
                                       top: `${parsedTextAnnotation.position.y}%`,
                                       transform: "translate(-50%, -50%)",
                                       color:
                                          parsedTextAnnotation.style?.color ||
                                          "#ffffff",
                                       fontSize: "12px",
                                       fontFamily:
                                          parsedTextAnnotation.style
                                             ?.fontFamily ||
                                          "Arial, sans-serif",
                                       fontWeight:
                                          parsedTextAnnotation.style
                                             ?.fontWeight || "normal",
                                       textShadow: "0px 0px 2px #000000",
                                       backgroundColor: "rgba(0, 0, 0, 0.4)",
                                       padding: "2px 4px",
                                       borderRadius: "2px",
                                       whiteSpace: "nowrap",
                                       maxWidth: "90%",
                                       textAlign: "center",
                                    }}
                                 >
                                    {parsedTextAnnotation.textContent}
                                 </div>
                              ) : null;
                           })()}
                        </div>
                     ) : (
                        <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs">
                           No Image
                        </div>
                     )}
                  </div>
               ))}
               {/* Fill empty grid cells if there are fewer than 3 thumbnails */}
               {Array.from({
                  length: Math.max(0, 3 - thumbnails.length),
               }).map((_, index) => (
                  <div
                     key={`empty-thumb-${index}`}
                     className="w-full aspect-square relative"
                  >
                     <div className="w-full h-full border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs">
                        No Image
                     </div>
                  </div>
               ))}
            </div>
         </div>
      );
   };

   const renderPalaroidStyle = (images: any[], startIndex: number = 0) => {
      const images_to_render = images.slice(startIndex, startIndex + 4);

      return (
         <div className="w-full h-full flex flex-wrap justify-center items-center gap-4 p-4">
            {images_to_render.map((image, index) => {
               const rotation = [-8, 12, -5, 7][index] || 0; // Random-ish rotations for polaroid effect
               return (
                  <div
                     key={`polaroid-${startIndex + index}`}
                     className="bg-white p-3 shadow-lg relative"
                     style={{
                        transform: `rotate(${rotation}deg)`,
                        width: "45%",
                        maxWidth: "180px",
                     }}
                  >
                     {image ? (
                        <div className="relative">
                           <div
                              style={getContainerStyle(image)}
                              className="w-full aspect-square mb-3"
                           >
                              <img
                                 src={image.s3Url}
                                 alt={`Polaroid ${startIndex + index}`}
                                 className="w-full h-full"
                                 style={getImageStyle(image)}
                              />
                           </div>

                           {/* Date at bottom of polaroid */}
                           <div className="text-center text-xs text-gray-600 font-handwriting">
                              {image.metadata?.capturedAt
                                 ? formatDate(image.metadata.capturedAt)
                                 : `Photo ${startIndex + index + 1}`}
                           </div>

                           {/* Text Annotation for polaroid */}
                           {(() => {
                              const parsedTextAnnotation =
                                 parseTextAnnotation(image);
                              return parsedTextAnnotation &&
                                 parsedTextAnnotation.position &&
                                 parsedTextAnnotation.textContent ? (
                                 <div
                                    className="absolute z-30 pointer-events-none"
                                    style={{
                                       left: `${parsedTextAnnotation.position.x}%`,
                                       top: `${parsedTextAnnotation.position.y}%`,
                                       transform: "translate(-50%, -50%)",
                                       color:
                                          parsedTextAnnotation.style?.color ||
                                          "#ffffff",
                                       fontSize:
                                          parsedTextAnnotation.style
                                             ?.fontSize || "16px",
                                       fontFamily:
                                          parsedTextAnnotation.style
                                             ?.fontFamily ||
                                          "Arial, sans-serif",
                                       fontWeight:
                                          parsedTextAnnotation.style
                                             ?.fontWeight || "normal",
                                       textShadow:
                                          "0px 0px 4px #000000, 0px 0px 4px #000000",
                                       backgroundColor: "rgba(0, 0, 0, 0.3)",
                                       padding: "2px 6px",
                                       borderRadius: "3px",
                                       whiteSpace: "nowrap",
                                       maxWidth: "80%",
                                       textAlign: "center",
                                    }}
                                 >
                                    {parsedTextAnnotation.textContent}
                                 </div>
                              ) : null;
                           })()}
                        </div>
                     ) : (
                        <div className="w-full aspect-square border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs mb-3">
                           No Image
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      );
   };

   const renderTimeline = (images: any[], startIndex: number = 0) => {
      const images_to_render = images.slice(startIndex, startIndex + 3);

      return (
         <div className="w-full h-full flex flex-col justify-center p-4">
            {/* Timeline line */}
            <div className="relative flex flex-col gap-6">
               <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-400"></div>

               {images_to_render.map((image, index) => (
                  <div
                     key={`timeline-${startIndex + index}`}
                     className="flex items-center gap-4"
                  >
                     {/* Timeline dot */}
                     <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-md flex-shrink-0 z-10"></div>

                     {/* Content */}
                     <div className="flex-1 flex gap-4 items-center">
                        {image ? (
                           <>
                              {/* Image */}
                              <div className="w-24 h-24 relative flex-shrink-0">
                                 <div
                                    style={getContainerStyle(image)}
                                    className="border-2 border-white w-full h-full rounded-lg overflow-hidden"
                                 >
                                    <img
                                       src={image.s3Url}
                                       alt={`Timeline ${startIndex + index}`}
                                       className="w-full h-full"
                                       style={getImageStyle(image)}
                                    />
                                 </div>

                                 {/* Text Annotation for timeline image */}
                                 {(() => {
                                    const parsedTextAnnotation =
                                       parseTextAnnotation(image);
                                    return parsedTextAnnotation &&
                                       parsedTextAnnotation.position &&
                                       parsedTextAnnotation.textContent ? (
                                       <div
                                          className="absolute z-30 pointer-events-none"
                                          style={{
                                             left: `${parsedTextAnnotation.position.x}%`,
                                             top: `${parsedTextAnnotation.position.y}%`,
                                             transform: "translate(-50%, -50%)",
                                             color:
                                                parsedTextAnnotation.style
                                                   ?.color || "#ffffff",
                                             fontSize: "12px", // Smaller for timeline
                                             fontFamily:
                                                parsedTextAnnotation.style
                                                   ?.fontFamily ||
                                                "Arial, sans-serif",
                                             fontWeight:
                                                parsedTextAnnotation.style
                                                   ?.fontWeight || "normal",
                                             textShadow: "0px 0px 2px #000000",
                                             backgroundColor:
                                                "rgba(0, 0, 0, 0.4)",
                                             padding: "1px 3px",
                                             borderRadius: "2px",
                                             whiteSpace: "nowrap",
                                             maxWidth: "90%",
                                             textAlign: "center",
                                          }}
                                       >
                                          {parsedTextAnnotation.textContent}
                                       </div>
                                    ) : null;
                                 })()}
                              </div>

                              {/* Date and description */}
                              <div className="flex-1">
                                 <div className="text-sm font-semibold text-gray-800">
                                    {image.metadata?.capturedAt
                                       ? formatDate(image.metadata.capturedAt)
                                       : `Event ${startIndex + index + 1}`}
                                 </div>
                                 <div className="text-xs text-gray-600 mt-1">
                                    Photo {startIndex + index + 1}
                                 </div>
                              </div>
                           </>
                        ) : (
                           <div className="flex gap-4 items-center flex-1">
                              <div className="w-24 h-24 border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-xs rounded-lg">
                                 No Image
                              </div>
                              <div className="flex-1">
                                 <div className="text-sm font-semibold text-gray-400">
                                    No Event
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      );
   };

   const renderImageGrid = (images: any[], startIndex: number) => {
      return (
         <div className="w-full h-full flex flex-wrap justify-center items-center">
            {Array.from({ length: imagesPerPage }).map((_, i) => {
               const imageIndex = startIndex + i;
               const image =
                  imageIndex < imageData.length ? imageData[imageIndex] : null;
               return renderImage(image, imageIndex);
            })}
         </div>
      );
   };

   // Function to render all styles randomly - this is the main function that renders different layout styles
   const renderAllStyles = (
      images: any[],
      startIndex: number,
      pageIndex: number
   ) => {
      // Array of available layout styles
      const layoutStyles = [
         "single",
         "sidebyside",
         "magazine",
         "palaroid",
         "Timeline",
         "multiple",
      ];

      // Use page index to determine which style to use (creates consistent randomness)
      const styleIndex = pageIndex % layoutStyles.length;
      const selectedStyle = layoutStyles[styleIndex];

      // Render based on the selected style
      switch (selectedStyle) {
         case "multiple":
            return renderImageGrid(images, startIndex);
         case "sidebyside":
            return renderSidebySideStyle(images, startIndex);
         case "magazine":
            return renderMagazineStyle(images, startIndex);
         case "palaroid":
            return renderPalaroidStyle(images, startIndex);
         case "Timeline":
            return renderTimeline(images, startIndex);
         case "single":
         default:
            return renderImage(
               startIndex < images.length ? images[startIndex] : null,
               startIndex
            );
      }
   };

   const renderPapers = () => {
      const frontCover = (
         <div
            className="paper absolute w-full h-full top-0 left-0"
            style={{
               zIndex: currentLocation > 1 ? 1 : numOfPapers + 2,
               perspective: "1500px",
            }}
         >
            <motion.div
               className="front absolute w-full h-full top-0 left-0 z-[20] rounded-r-md overflow-hidden"
               style={{
                  transformOrigin: "left",
                  backfaceVisibility: "hidden",
                  boxShadow: "2px 2px 10px rgba(0,0,0,0.2)",
                  background: coverImage
                     ? `url("${coverImage}") no-repeat center/cover`
                     : `linear-gradient(135deg, ${coverColor || "#8B4513"} 0%, #4A230C 100%)`,
               }}
               initial="unflipped"
               animate={currentLocation > 1 ? "flipped" : "unflipped"}
               variants={pageVariants}
            >
               {currentLocation <= 1 && (
                  <div className="front-content w-full h-full flex flex-col justify-center items-end z-0">
                     <div
                        className="absolute top-0 left-0 bg-transparent w-[12px] h-full aspect-square blur-[1px] brightness-50"
                        style={{
                           border: "3px groove #cccccc",
                        }}
                     ></div>
                     <span
                        className="absolute text-white text-sm -left-4 top-[50%] z-50"
                        style={{
                           transform: "rotate(-90deg)",
                           transformOrigin: "center",
                           top: "50%",
                        }}
                     >
                        {albumData?.bookName}
                     </span>
                     <div
                        className="bg-transparent w-full h-full aspect-square z-50 blur-[3px] brightness-50"
                        style={{
                           border: "4px groove #cccccc",
                        }}
                     ></div>
                  </div>
               )}
            </motion.div>

            <motion.div
               className="back absolute w-full h-full top-0 left-0"
               style={{
                  transformOrigin: "left",
                  background: coverImage
                     ? `url("${coverImage}") no-repeat center/cover`
                     : `linear-gradient(135deg, ${coverColor || "#8B4513"} 0%, #4A230C 100%)`,
               }}
               initial="unflipped"
               animate={currentLocation > 1 ? "flipped" : "unflipped"}
               variants={pageVariants}
            >
               <div
                  className="back-content w-full h-full flex flex-col justify-center items-end"
                  style={{ transform: "rotateY(180deg)" }}
               >
                  <div className="bg-white w-[420px] h-[440px] aspect-square"></div>
               </div>
            </motion.div>
         </div>
      );

      const contentPages = Array.from({ length: numOfPapers }, (_, i) => {
         const paperIndex = i + 1;
         const isFlipped = currentLocation > paperIndex + 1;
         const startFrontIndex = i * imagesPerPaper;
         const startBackIndex = i * imagesPerPaper + imagesPerPage;

         // Get backgrounds for current page - now properly indexed for front and back
         const frontPageBackgroundIndex = i * 2; // Front side background index
         const backPageBackgroundIndex = i * 2 + 1; // Back side background index

         const frontPageBackground =
            pageBackgrounds[frontPageBackgroundIndex] || coverImage;
         const backPageBackground =
            pageBackgrounds[backPageBackgroundIndex] || coverImage;

         return (
            <div
               key={`paper-${paperIndex}`}
               id={`p${paperIndex}`}
               className="paper absolute flex justify-center items-center w-[400px] h-[400px]"
               style={{
                  zIndex: isFlipped ? paperIndex + 1 : numOfPapers - i + 1,
                  perspective: "1500px",
               }}
            >
               {/* Content page - Front side */}
               <motion.div
                  className="front absolute w-full h-full top-1 left-0 bg-white border-l-[3px] border-[#0b0d0e] z-10"
                  style={{
                     transformOrigin: "left",
                     backfaceVisibility: "hidden",
                  }}
                  initial="unflipped"
                  animate={isFlipped ? "flipped" : "unflipped"}
                  variants={pageVariants}
               >
                  {/* Content page container with front background */}
                  <div
                     className="content-container w-[420px] h-[440px] flex flex-col justify-center items-center p-6"
                     style={{
                        background: frontPageBackground
                           ? `url("${frontPageBackground}") no-repeat center/cover`
                           : coverImage
                             ? `url("${coverImage}") no-repeat center/cover`
                             : `linear-gradient(135deg, ${coverColor || "#8B4513"} 0%, #4A230C 100%)`,
                     }}
                  >
                     {/* Use individual page layout or fall back to global layout */}
                     {(() => {
                        const currentPageLayout = getLayoutForPage(i);
                        return currentPageLayout === "multiple"
                           ? renderImageGrid(imageData, startFrontIndex)
                           : currentPageLayout === "sidebyside"
                             ? renderSidebySideStyle(imageData, startFrontIndex)
                             : currentPageLayout === "magazine"
                               ? renderMagazineStyle(imageData, startFrontIndex)
                               : currentPageLayout === "palaroid"
                                 ? renderPalaroidStyle(
                                      imageData,
                                      startFrontIndex
                                   )
                                 : currentPageLayout === "Timeline"
                                   ? renderTimeline(imageData, startFrontIndex)
                                   : currentPageLayout === "random"
                                     ? renderAllStyles(
                                          imageData,
                                          startFrontIndex,
                                          i
                                       )
                                     : renderImage(
                                          startFrontIndex < imageData.length
                                             ? imageData[startFrontIndex]
                                             : null,
                                          startFrontIndex
                                       );
                     })()}
                  </div>
               </motion.div>

               {/* Content page - Back side */}
               <motion.div
                  className="back absolute w-full h-full top-1 left-0 z-[0]"
                  style={{
                     transformOrigin: "left",
                  }}
                  initial="unflipped"
                  animate={isFlipped ? "flipped" : "unflipped"}
                  variants={pageVariants}
               >
                  {/* Content page container with back background */}
                  <div
                     className="content-container w-[420px] h-[440px] absolute flex flex-col justify-center items-center p-6"
                     style={{
                        transform: "rotateY(180deg)",
                        background: backPageBackground
                           ? `url("${backPageBackground}") no-repeat center/cover`
                           : coverImage
                             ? `url("${coverImage}") no-repeat center/cover`
                             : `linear-gradient(135deg, ${coverColor || "#8B4513"} 0%, #4A230C 100%)`,
                     }}
                  >
                     {/* Use individual page layout or fall back to global layout for back side */}
                     {(() => {
                        const currentPageLayout = getLayoutForPage(i);
                        return currentPageLayout === "multiple"
                           ? renderImageGrid(imageData, startBackIndex)
                           : currentPageLayout === "sidebyside"
                             ? renderSidebySideStyle(imageData, startBackIndex)
                             : currentPageLayout === "magazine"
                               ? renderMagazineStyle(imageData, startBackIndex)
                               : currentPageLayout === "palaroid"
                                 ? renderPalaroidStyle(
                                      imageData,
                                      startBackIndex
                                   )
                                 : currentPageLayout === "Timeline"
                                   ? renderTimeline(imageData, startBackIndex)
                                   : currentPageLayout === "random"
                                     ? renderAllStyles(
                                          imageData,
                                          startBackIndex,
                                          i
                                       )
                                     : renderImage(
                                          startBackIndex < imageData.length
                                             ? imageData[startBackIndex]
                                             : null,
                                          startBackIndex
                                       );
                     })()}
                  </div>
               </motion.div>
            </div>
         );
      });

      const backCover = (
         <div
            key="back-cover"
            id="back-cover"
            className="paper absolute w-full h-full top-0 left-0"
            style={{
               zIndex: currentLocation > numOfPapers + 0 ? numOfPapers + 1 : 0,
               perspective: "1500px",
            }}
         >
            <motion.div
               className="front absolute w-full h-full top-0 left-0 border-l-[3px] border-[#0b0d0e] z-50"
               style={{
                  transformOrigin: "left",
                  backfaceVisibility: "hidden",
                  background: coverImage
                     ? `url("${coverImage}") no-repeat center/cover`
                     : `linear-gradient(135deg, ${coverColor || "#8B4513"} 0%, #4A230C 100%)`,
               }}
               initial="unflipped"
               animate={
                  currentLocation > numOfPapers + 1 ? "flipped" : "unflipped"
               }
               variants={pageVariants}
            >
               <div className="content-container w-full h-full flex flex-col justify-center items-start">
                  <div className="bg-white w-[420px] h-[440px] aspect-square"></div>
               </div>
            </motion.div>

            <motion.div
               className="back absolute w-full h-full top-0 left-0 bg-blue-700 z-[0] rounded-r-md"
               style={{
                  transformOrigin: "left",
                  boxShadow: "2px 2px 10px rgba(0,0,0,0.2)",
                  background: coverImage
                     ? `url("${coverImage}") no-repeat center/cover`
                     : `linear-gradient(135deg, ${coverColor || "#8B4513"} 0%, #4A230C 100%)`,
               }}
               initial="unflipped"
               animate={
                  currentLocation > numOfPapers + 1 ? "flipped" : "unflipped"
               }
               variants={pageVariants}
            >
               <div
                  className="front-content w-full h-full flex flex-col justify-center items-end"
                  style={{ transform: "rotateY(180deg)" }}
               >
                  {/* Show groove and album name on the actual back of the book */}
                  <>
                     <div
                        className="absolute top-0 right-0 bg-transparent w-[12px] h-full aspect-square blur-[1px] brightness-50"
                        style={{
                           border: "3px groove #cccccc",
                        }}
                     ></div>
                     <span
                        className="absolute text-white text-sm -right-2 top-[50%] z-50"
                        style={{
                           transform: "rotate(-90deg)",
                           transformOrigin: "center",
                           top: "50%",
                        }}
                     >
                        {albumData?.bookName}
                     </span>
                  </>
                  <div
                     className="bg-transparent w-full h-full aspect-square z-50 blur-[3px] brightness-50"
                     style={{
                        border: "4px groove #cccccc",
                     }}
                  ></div>
               </div>
            </motion.div>
         </div>
      );
      return [frontCover, ...contentPages, backCover];
   };

   return (
      <div>
         <div className="flex justify-center items-center">
            <motion.button
               onClick={goPrevPage}
               className="border-none bg-transparent cursor-pointer m-[10px] rounded-full"
               initial="hidden"
               animate={isBookOpen ? "visible" : "hidden"}
               variants={buttonVariants}
               custom={true}
               whileHover={{
                  scale: 1.1,
                  backgroundColor: "rgba(0,0,0,0.05)",
               }}
               whileTap={{ scale: 0.95 }}
               disabled={currentLocation <= 1}
            >
               <ChevronLeft
                  size={48}
                  color={currentLocation <= 1 ? "#aaaaaa" : "#666666"}
                  strokeWidth={1.5}
               />
            </motion.button>

            <div className="box p-10">
               <motion.div
                  id="book"
                  className="book relative w-[425px] h-[450px]"
                  initial="closed"
                  animate={isBookOpen ? "open" : "closed"}
                  variants={bookVariants}
                  custom={isAtBeginning}
               >
                  <AnimatePresence>{renderPapers()}</AnimatePresence>
               </motion.div>
            </div>

            <motion.button
               onClick={goNextPage}
               className="border-none bg-transparent cursor-pointer m-[10px] p-2 rounded-full"
               initial="hidden"
               animate={isBookOpen ? "visible" : "hidden"}
               variants={buttonVariants}
               custom={false}
               whileHover={{
                  scale: 1.1,
                  backgroundColor: "rgba(0,0,0,0.05)",
               }}
               whileTap={{ scale: 0.95 }}
               disabled={currentLocation >= maxLocation}
            >
               <ChevronRight
                  size={48}
                  color={currentLocation >= maxLocation ? "#aaaaaa" : "#666666"}
                  strokeWidth={1.5}
               />
            </motion.button>
         </div>

         <motion.div
            animate={{
               opacity: 1,
               y: 0,
               transition: { duration: 0.5 },
            }}
            initial={{ opacity: 0, y: 20 }}
            className="flex justify-center items-center mt-6"
         >
            {!isBookOpen ? (
               <motion.div className="flex flex-col gap-5 justify-center items-center bg-white text-black py-3 px-6">
                  <div className="flex flex-col justify-center items-center gap-2">
                     <h3>
                        <span className="font-bold">Congratulations!</span> Your
                        masterpiece is ready to become reality.
                     </h3>
                     <p className="text-sm">
                        Click the{" "}
                        <span className="italic underline">
                           accept invitation
                        </span>{" "}
                        button to order your photo album book now.
                     </p>
                  </div>
               </motion.div>
            ) : (
               <div className="flex flex-col items-center gap-2 mb-5">
                  <div>
                     <img
                        src={bookHand.src}
                        className="w-[100px] h-[100px] object-contain"
                     />
                  </div>
                  <div className="flex flex-col max-w-[600px] justify-center text-center items-center gap-2">
                     <h3 className="box font-bold text-lg">
                        This is how your book will be printed{" "}
                     </h3>
                     <p className="text-sm">
                        You have to browse to throught it, check that the images
                        are format or edited exactly as you wanted. You have to
                        go through the texts, make sure there are no spelling
                        errors, that you haven't used emojis (they're cute, but
                        they can't be printed). It's important to remember, we
                        know how to print texts in Herbrew, English, arabic, and
                        Russian.
                     </p>
                  </div>
               </div>
            )}
         </motion.div>
      </div>
   );
};

const AsideNavigation: React.FC<AsideNavigationProps> = ({
   params,
   albumData,
   currentPage,
   onAddPhotos,
   onChangeLayout,
   onChangeDesign,
   onAddCaption,
   generateSingleBackground,
   isGeneratingBackground,
   generateAllPagesBackground,
   onClose,
   isContentPage,
   generateCaptionsForCurrentPage,
   isGeneratingCaptions,
   generatedCaptions,
   saveCaptionToTextAnnotation,
   copiedCaptionId,
   selectedImage,
   selectedImageIndex,
   onImageUpdate,
   onImageSelect,
   activePanel,
   setActivePanel,
}) => {
   // Use external activePanel state or fallback to default
   const currentActivePanel = activePanel || "photos";
   const handleSetActivePanel = setActivePanel || (() => {});
   const [isEditingName, setIsEditingName] = useState<boolean>(false);
   const [localAlbumName, setLocalAlbumName] = useState<string>(
      albumData?.bookName || "My Photo Album"
   );
   const [selectedLayoutId, setSelectedLayoutId] = useState<string>(
      albumData?.layoutPage || "layout-1"
   );
   const [backgroundPrompt, setBackgroundPrompt] = useState<string>("");
   const startPromptIndex = Math.floor((currentPage - 2) / 2);
   const layoutLibrary = [
      {
         id: "random",
         name: "Random Mix",
         description: "Randomly mixed layout styles",
         preview: (
            <div className="w-full h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
               <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-200 rounded transform rotate-12"></div>
                  <div className="w-2 h-4 bg-green-200 rounded"></div>
                  <div className="w-4 h-2 bg-yellow-200 rounded"></div>
                  <div className="w-3 h-3 bg-purple-200 rounded-full"></div>
               </div>
            </div>
         ),
      },
      {
         id: "single",
         name: "Classic Single",
         description: "One photo per page with caption",
         preview: (
            <div className="w-full h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
               <div className="w-8 h-6 bg-blue-200 rounded"></div>
            </div>
         ),
      },
      {
         id: "multiple",
         name: "Collage Grid",
         description: "Multiple photos in grid",
         preview: (
            <div className="w-full h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
               <div className="grid grid-cols-2 gap-1">
                  <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  <div className="w-3 h-3 bg-blue-200 rounded"></div>
               </div>
            </div>
         ),
      },
      {
         id: "sidebyside",
         name: "Side by Side",
         description: "Two photos per page",
         preview: (
            <div className="w-full h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center gap-1">
               <div className="w-4 h-6 bg-blue-200 rounded"></div>
               <div className="w-4 h-6 bg-blue-200 rounded"></div>
            </div>
         ),
      },
      {
         id: "magazine",
         name: "Magazine Style",
         description: "Large photo with small accent",
         preview: (
            <div className="w-full h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-between p-1">
               <div className="w-6 h-8 bg-blue-200 rounded"></div>
               <div className="w-3 h-4 bg-blue-200 rounded"></div>
            </div>
         ),
      },
      {
         id: "palaroid",
         name: "Polaroid Style",
         description: "Photos with white borders",
         preview: (
            <div className="w-full h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
               <div className="w-6 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-200 rounded"></div>
               </div>
            </div>
         ),
      },
      {
         id: "Timeline",
         name: "Timeline",
         description: "Sequential photo timeline",
         preview: (
            <div className="w-full h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
               <div className="flex items-center gap-1">
                  <div className="w-2 h-4 bg-blue-200 rounded"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-4 bg-blue-200 rounded"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-4 bg-blue-200 rounded"></div>
               </div>
            </div>
         ),
      },
   ];

   // Icon buttons configuration
   const toolButtons = [
      {
         id: "editor",
         icon: Edit3,
         label: "Editor",
         color: "text-orange-600",
         bgColor: "bg-orange-50 hover:bg-orange-100",
      },
      {
         id: "photos",
         icon: ImagePlus,
         label: "Photos",
         color: "text-green-600",
         bgColor: "bg-green-50 hover:bg-green-100",
      },
      {
         id: "design",
         icon: PaintBucket,
         label: "Design",
         color: "text-blue-600",
         bgColor: "bg-blue-50 hover:bg-blue-100",
      },
      {
         id: "arrangement",
         icon: Layout,
         label: "Layout",
         color: "text-purple-600",
         bgColor: "bg-purple-50 hover:bg-purple-100",
      },
   ];

   useEffect(() => {
      if (albumData?.bookName) {
         setLocalAlbumName(albumData.bookName);
      }
   }, [albumData?.bookName]);

   const handleLocalNameChange = (
      e: React.ChangeEvent<HTMLInputElement>
   ): void => {
      setLocalAlbumName(e.target.value);
   };

   const togglePanel = (panelId: string): void => {
      handleSetActivePanel(currentActivePanel === panelId ? null : panelId);
   };

   const getCurrentPageImages = () => {
      if (!albumData?.images || !isContentPage) return [];
      const frontPhotoIndex = (currentPage - 2) * 2;
      const indices: number[] = [];

      indices.push(
         ...[
            frontPhotoIndex >= 0 && frontPhotoIndex < albumData.images.length
               ? frontPhotoIndex
               : null,
            frontPhotoIndex + 1 < albumData.images.length
               ? frontPhotoIndex + 1
               : null,
         ].filter(index => index !== null)
      );

      return indices
         .map(index => {
            const image = albumData?.images?.[index] ?? null;
            return image;
         })
         .filter(Boolean);
   };

   const saveAlbumName = async (): Promise<void> => {
      setIsEditingName(false);
      onChangeDesign("albumName", localAlbumName);
   };

   const cancelNameEdit = (): void => {
      setIsEditingName(false);
      setLocalAlbumName(albumData?.bookName || "My Photo Album");
   };

   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
         saveAlbumName();
      } else if (e.key === "Escape") {
         cancelNameEdit();
      }
   };

   const getPageNumbers = (): string => {
      if (!isContentPage || !albumData?.images) return "";
      const startPageNum = (currentPage - 2) * 2;
      const endPageNum = Math.min(startPageNum + 1);
      return startPageNum === -2 ? "" : `Page ${startPageNum}-${endPageNum}`;
   };

   const handleLayoutSelect = (layoutId: string): void => {
      setSelectedLayoutId(layoutId);
      onChangeLayout(layoutId);
   };

   const currentPageImages = getCurrentPageImages();

   const currentPageCaptions = generatedCaptions.filter(caption => {
      const frontPhotoIndex = (currentPage - 2) * 2;
      return (
         caption.imageIndex >= frontPhotoIndex &&
         caption.imageIndex < frontPhotoIndex + 2
      );
   });

   const renderPanelContent = () => {
      switch (activePanel) {
         case "editor":
            return (
               <ImageEditor
                  selectedImage={selectedImage}
                  selectedImageIndex={selectedImageIndex}
                  onImageUpdate={onImageUpdate}
                  onClose={() => onImageSelect(null, -1)}
               />
            );
         case "design":
            return (
               <>
                  <div className="space-y-4 mb-2">
                     <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        Book Design
                     </h3>

                     <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                           Album Name
                        </h4>
                        <div className="flex items-center mb-2">
                           {isEditingName ? (
                              <div className="w-full flex flex-col space-y-2">
                                 <input
                                    type="text"
                                    value={localAlbumName}
                                    onChange={handleLocalNameChange}
                                    onKeyPress={handleKeyPress}
                                    className="flex-1 p-2 text-sm border border-gray-300 rounded"
                                    autoFocus
                                 />
                                 <div className="flex space-x-2">
                                    <button
                                       onClick={saveAlbumName}
                                       className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                                    >
                                       Save
                                    </button>
                                    <button
                                       onClick={cancelNameEdit}
                                       className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                       Cancel
                                    </button>
                                 </div>
                              </div>
                           ) : (
                              <div className="w-full flex items-center justify-between p-2 border border-gray-200 rounded bg-white">
                                 <span className="text-sm text-gray-700 truncate">
                                    {albumData?.bookName || "My Photo Album"}
                                 </span>
                                 <button
                                    onClick={() => setIsEditingName(true)}
                                    className="text-gray-500 flex items-center px-2 py-1 rounded-md border gap-1 hover:bg-blue-100 hover:text-blue-600 ml-2 flex-shrink-0"
                                 >
                                    <Edit3 size={16} />
                                    <span>Edit</span>
                                 </button>
                              </div>
                           )}
                        </div>
                        <p className="text-xs text-gray-600 mb-4">
                           Edit the album name and click Save, or Cancel to
                           revert changes.
                        </p>
                     </div>

                     <Link
                        href={`/design/${params}`}
                        className="w-full p-3 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors text-sm"
                     >
                        <Palette size={16} className="mr-2" />
                        <span>Change Book Design</span>
                     </Link>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        AI Page Design
                     </h3>

                     <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-3">
                           Generate Page Background
                        </h4>
                        <div className="space-y-3">
                           <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                 Background Style Prompt
                              </label>
                              <input
                                 type="text"
                                 value={backgroundPrompt}
                                 onChange={e =>
                                    setBackgroundPrompt(e.target.value)
                                 }
                                 placeholder="e.g., watercolor flowers, vintage paper..."
                                 className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                 Describe the background style you want
                              </p>
                           </div>

                           <div className="grid grid-cols-1 gap-2">
                              <button
                                 onClick={() =>
                                    generateSingleBackground(
                                       backgroundPrompt,
                                       startPromptIndex
                                    )
                                 }
                                 disabled={
                                    !backgroundPrompt.trim() ||
                                    isGeneratingBackground
                                 }
                                 className={`p-3 flex items-center justify-center rounded-full text-sm transition-colors ${
                                    !backgroundPrompt.trim() ||
                                    isGeneratingBackground
                                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                       : "bg-orange-600 text-white hover:bg-orange-700"
                                 }`}
                              >
                                 {isGeneratingBackground ? (
                                    <>
                                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                       <span>Generating...</span>
                                    </>
                                 ) : (
                                    <>
                                       <WandSparkles
                                          size={16}
                                          className="mr-2"
                                       />
                                       <span>Generate Current Page</span>
                                    </>
                                 )}
                              </button>

                              <button
                                 onClick={() =>
                                    generateAllPagesBackground(backgroundPrompt)
                                 }
                                 disabled={
                                    !backgroundPrompt.trim() ||
                                    isGeneratingBackground
                                 }
                                 className={`p-3 flex items-center justify-center rounded-full text-sm transition-colors ${
                                    !backgroundPrompt.trim() ||
                                    isGeneratingBackground
                                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                       : "bg-indigo-600 text-white hover:bg-indigo-700"
                                 }`}
                              >
                                 {isGeneratingBackground ? (
                                    <>
                                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                       <span>Generating...</span>
                                    </>
                                 ) : (
                                    <>
                                       <Grid size={16} className="mr-2" />
                                       <span>Generate All Pages</span>
                                    </>
                                 )}
                              </button>
                           </div>

                           {isContentPage && (
                              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                 <p className="text-xs text-orange-700 font-medium">
                                    Current Paper: {startPromptIndex + 1} (Front
                                    & Back)
                                 </p>
                                 <p className="text-xs text-orange-600 mt-1">
                                    Generate backgrounds for both sides of
                                    current paper
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>
                     {/* <OrderLink /> */}
                  </div>
               </>
            );
         case "photos":
            return (
               <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                     Album Photos
                  </h3>

                  <button
                     className="w-full p-3 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors text-sm"
                     onClick={onAddPhotos}
                  >
                     <Upload size={16} className="mr-2" />
                     <span>Add Photos</span>
                  </button>

                  {/* Show all album images */}
                  {albumData?.images && albumData.images.length > 0 && (
                     <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                           All Album Images ({albumData.images.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                           {albumData.images.map((image, index) => {
                              const isSelected = selectedImageIndex === index;

                              return (
                                 <div
                                    key={`thumb-${index}`}
                                    onClick={() => onImageSelect(image, index)}
                                    className={`flex flex-col p-2 rounded border cursor-pointer transition-all ${
                                       isSelected
                                          ? "border-orange-500 bg-orange-50 shadow-md"
                                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                 >
                                    <div className="aspect-square rounded overflow-hidden mb-2">
                                       <img
                                          src={image?.s3Url}
                                          alt={`Thumbnail ${index + 1}`}
                                          className="h-full w-full object-cover"
                                       />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p
                                          className={`text-xs font-medium text-center ${
                                             isSelected
                                                ? "text-orange-700"
                                                : "text-gray-600"
                                          }`}
                                       >
                                          Image {index + 1}
                                       </p>
                                       {image?.metadata?.caption && (
                                          <p className="text-xs text-gray-500 truncate mt-1 text-center">
                                             {image.metadata.caption}
                                          </p>
                                       )}
                                       {isSelected && (
                                          <p className="text-xs text-orange-600 mt-1 text-center">
                                             Selected
                                          </p>
                                       )}
                                    </div>
                                    {isSelected && (
                                       <div className="w-2 h-2 bg-orange-500 rounded-full mx-auto mt-1"></div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}

                  {/* Show message when no images */}
                  {(!albumData?.images || albumData.images.length === 0) && (
                     <div className="text-center py-8">
                        <ImagePlus
                           size={32}
                           className="mx-auto text-gray-400 mb-2"
                        />
                        <p className="text-sm text-gray-500">
                           No images in your album yet
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                           Click "Add Photos" to get started
                        </p>
                     </div>
                  )}

                  {/* <OrderLink /> */}
               </div>
            );
         case "arrangement":
            return (
               <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                     Photo Layout
                  </h3>

                  <div>
                     <h4 className="font-medium text-sm text-gray-700 mb-3">
                        Choose Layout Style
                     </h4>
                     <div className="grid grid-cols-1 gap-3">
                        {layoutLibrary.map(layout => (
                           <button
                              key={layout.id}
                              onClick={() => handleLayoutSelect(layout.id)}
                              className={`w-full p-3 border-2 rounded-lg transition-all hover:shadow-md ${
                                 selectedLayoutId === layout.id
                                    ? "border-purple-500 bg-purple-50 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                           >
                              <div className="flex items-center space-x-3">
                                 <div className="w-16 flex-shrink-0">
                                    {layout.preview}
                                 </div>
                                 <div className="flex-1 text-left">
                                    <h5
                                       className={`text-sm font-medium ${
                                          selectedLayoutId === layout.id
                                             ? "text-purple-700"
                                             : "text-gray-700"
                                       }`}
                                    >
                                       {layout.name}
                                    </h5>
                                    <p className="text-xs text-gray-500 mt-1">
                                       {layout.description}
                                    </p>
                                 </div>
                                 {selectedLayoutId === layout.id && (
                                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                       <Check
                                          size={12}
                                          className="text-white"
                                       />
                                    </div>
                                 )}
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
                  {/* Order Now Section - Always visible at bottom */}
                  {/* <OrderLink /> */}
               </div>
            );
         default:
            return null;
      }
   };

   return (
      <div className="flex h-full lg:h-full">
         {/* Left Panel - Content Area */}
         <div
            className={`
          transition-all duration-300 ease-in-out bg-white border-r border-gray-200 overflow-y-auto
          ${activePanel ? "w-80 lg:w-[500px] border-l h-full" : "w-80 lg:w-96 h-full"}
        `}
         >
            <div className="p-4 h-full">
               <div className="flex items-center justify-between mb-4">
                  <button
                     onClick={() => setActivePanel && setActivePanel(null)}
                     className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                     <X size={20} />
                  </button>
               </div>
               {renderPanelContent()}
            </div>
         </div>

         {/* Right Side - Icon Buttons */}
         <div className="flex flex-col bg-white border-l border-gray-200 w-16 lg:w-48">
            {/* Mobile Close Button */}
            <div className="lg:hidden flex justify-center items-center p-2 border-b">
               {onClose && (
                  <button
                     onClick={onClose}
                     className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                     <X size={20} />
                  </button>
               )}
            </div>

            {/* Tool Buttons */}
            <div className="flex-1 flex flex-col justify-start py-4 space-y-2">
               {toolButtons.map(tool => {
                  const IconComponent = tool.icon;
                  const isActive = activePanel === tool.id;

                  return (
                     <button
                        key={tool.id}
                        onClick={() => togglePanel(tool.id)}
                        className={`
                    mx-2 p-3 lg:p-4 rounded-xl transition-all duration-200 group relative
                    ${
                       isActive
                          ? `${tool.bgColor} shadow-md scale-105`
                          : "hover:bg-gray-50"
                    }
                  `}
                        title={tool.label}
                     >
                        <IconComponent
                           size={20}
                           className={`
                      mx-auto transition-colors
                      ${isActive ? tool.color : "text-gray-600 group-hover:text-gray-800"}
                    `}
                        />
                        <span className="block text-xs mt-1 text-center font-medium">
                           {tool.label}
                        </span>

                        {isActive && (
                           <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r"></div>
                        )}
                     </button>
                  );
               })}
            </div>
         </div>
      </div>
   );
};

export default BookAlbumPage;
