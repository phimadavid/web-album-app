"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { ThreeDots } from "react-loader-spinner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, SquareX, RefreshCw, X } from "lucide-react";
import { withAuth } from "@/backend/withAuth";
import { useAlbumData } from "@/backend/services/actions/getAlbums";
import { generateTemplateImage } from "@/lib/services/hf.generate.template";

// Import types and components from edit folder
import { AlbumDataProps, GeneratedCaption } from "../../edit/data-types/types";
import { NoteFeature } from "../../edit/components/note.features";
import Loading from "../../edit/components/loading.state";
import ErrorMessage from "../../edit/components/error.features";
import OrderModal from "../../components/order/order-modal";
import Cart from "../../components/cart/cart";
import FlippingBook from "../components/flipping.book";
import AddPhotosModal from "../components/add.photos.modal";

interface Album {
   id: string;
   name: string;
   status: "draft" | "in_progress" | "complete";
   termsAccepted: boolean;
   createdAt: string;
   updatedAt: string;
}

const PreviewPage = () => {
   const searchParams = useSearchParams();
   const router = useRouter();
   const albumId = searchParams.get("albumId");
   const [basicAlbumData, setBasicAlbumData] = useState<Album | null>(null);
   const [isBasicLoading, setIsBasicLoading] = useState(true);
   const [basicError, setBasicError] = useState<string | null>(null);

   // Edit page state variables
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

   // View modes
   const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");
   const [isSaving, setIsSaving] = useState(false);
   const [showPreviewModal, setShowPreviewModal] = useState(false);

   // Caption generation
   const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
   const [generatedCaptions, setGeneratedCaptions] = useState<
      GeneratedCaption[]
   >([]);
   const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);

   // Layout management
   const [pageLayouts, setPageLayouts] = useState<string[]>([]);

   // Image editing
   const [selectedImage, setSelectedImage] = useState<any | null>(null);
   const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

   // Ordering system
   const [showOrderModal, setShowOrderModal] = useState(false);
   const [showCart, setShowCart] = useState(false);
   const [cartItemCount, setCartItemCount] = useState(0);

   const {
      isLoading: authLoading,
      isAuthenticated,
      logout,
   } = withAuth({
      role: "user",
      redirectTo: "/signin",
   });

   // Use the album data hook from edit folder
   const {
      albumData,
      error,
      isLoading,
      setAlbumData,
      setCustomPrompts,
      handleSaveAlbumName,
   } = useAlbumData(albumId || "");

   // Fetch basic album data for verification
   useEffect(() => {
      const fetchBasicAlbumData = async () => {
         if (!albumId || !isAuthenticated) {
            setIsBasicLoading(false);
            return;
         }

         try {
            const response = await fetch("/api/me/albums");
            if (response.ok) {
               const data = await response.json();
               const album = data.data.find((a: Album) => a.id === albumId);

               if (album) {
                  setBasicAlbumData(album);
               } else {
                  setBasicError("Album not found");
               }
            } else {
               setBasicError("Failed to fetch album data");
            }
         } catch (err) {
            console.error("Error fetching album data:", err);
            setBasicError("An error occurred while fetching album data");
         } finally {
            setIsBasicLoading(false);
         }
      };

      fetchBasicAlbumData();
   }, [albumId, isAuthenticated]);

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

   const handlePhotosSaved = useCallback(() => {
      setIsRefreshing(true);

      if (setAlbumData && setIsToLoading) {
         setIsToLoading(true);

         axios
            .get(`/api/images/${albumId}`)
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
      albumId,
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

   const handleBackToDashboard = () => {
      router.push("/me/dashboard");
   };

   const handleEditAlbum = () => {
      if (albumId) {
         router.push(`/me/edit/${albumId}`);
      }
   };

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

   // Generate backgrounds and captions (same as edit page)
   const generateSingleBackground = async (
      promptWord: string,
      pageIndex: number
   ) => {
      if (!promptWord.trim()) return;

      try {
         setIsGenerating(true);
         setActivePromptIndex(pageIndex);

         const frontBackgroundImages = await generateTemplateImage(promptWord);
         const backBackgroundImages = await generateTemplateImage(promptWord);

         const frontBackgroundImage = frontBackgroundImages[0];
         const backBackgroundImage = backBackgroundImages[0];

         const frontPageIndex = pageIndex * 2;
         const backPageIndex = pageIndex * 2 + 1;

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
         const totalContentPages = Math.ceil(albumData.images.length / 2);

         for (let pageNum = 0; pageNum < totalContentPages; pageNum++) {
            try {
               const frontBackgroundImages =
                  await generateTemplateImage(promptWord);
               const backBackgroundImages =
                  await generateTemplateImage(promptWord);

               const frontBackgroundImage = frontBackgroundImages[0];
               const backBackgroundImage = backBackgroundImages[0];

               const frontPageIndex = pageNum * 2;
               const backPageIndex = pageNum * 2 + 1;

               setPageBackgrounds(prev => {
                  const updated = [...prev];
                  updated[frontPageIndex] = frontBackgroundImage;
                  updated[backPageIndex] = backBackgroundImage;
                  return updated;
               });

               await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
               console.error(
                  `Failed to generate background for page ${pageNum}:`,
                  error
               );
            }
         }

         toast.success("Backgrounds generated for all pages!", {
            position: "bottom-right",
            autoClose: 3000,
         });
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

   const getAlbumBookDimensions = () => {
      if (!albumData || !albumData.webSizePx)
         return { width: 530, height: 520 };
      const dimensions = albumData.webSizePx.split(/[x×]/);
      const width = Number(dimensions[0]);
      const height = Number(dimensions[1]);
      return { width, height };
   };

   const getImagePixel = () => {
      if (!albumData || !albumData.webPhotoSizePx)
         return { width: 530, height: 520 };
      const dimensions = albumData.webPhotoSizePx.split(/[x×]/);
      const photoWidth = Number(dimensions[0]);
      const photoHeight = Number(dimensions[1]);
      return { photoWidth, photoHeight };
   };

   // Generate captions functions (same as edit page)
   const generateCaptionsForCurrentPage = async () => {
      if (!albumData?.images || !isContentPage) return;

      try {
         setIsGeneratingCaptions(true);
         const frontPhotoIndex = (currentPage - 2) * 2;
         const currentPageImages = [
            frontPhotoIndex >= 0 && frontPhotoIndex < albumData.images.length
               ? albumData.images[frontPhotoIndex]
               : null,
            frontPhotoIndex + 1 < albumData.images.length
               ? albumData.images[frontPhotoIndex + 1]
               : null,
         ].filter(Boolean);

         const newCaptions: GeneratedCaption[] = [];

         for (let i = 0; i < currentPageImages.length; i++) {
            const image = currentPageImages[i];
            if (!image) continue;

            const mockCaptions = await generateMockCaptions(image);

            const captionData: GeneratedCaption = {
               id: `caption-${Date.now()}-${i}`,
               shortCaption: mockCaptions.short,
               longCaption: mockCaptions.long,
               imageIndex: frontPhotoIndex + i,
               createdAt: new Date(),
            };

            newCaptions.push(captionData);
         }

         setGeneratedCaptions(prev => [...prev, ...newCaptions]);

         toast.success(
            `Generated ${newCaptions.length} captions for current page!`,
            {
               position: "bottom-right",
               autoClose: 3000,
            }
         );
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

   const generateMockCaptions = async (
      image: any
   ): Promise<{ short: string; long: string }> => {
      await new Promise(resolve =>
         setTimeout(resolve, 1000 + Math.random() * 2000)
      );

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
      ];

      const randomShort =
         shortCaptions[Math.floor(Math.random() * shortCaptions.length)];
      const randomLong =
         longCaptions[Math.floor(Math.random() * longCaptions.length)];

      return { short: randomShort, long: randomLong };
   };

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
         const textAnnotation = {
            textContent: captionText,
            position: { x: 50, y: 85 },
            style: {
               fontSize: "18px",
               color: "#ffffff",
               fontFamily: "Arial, sans-serif",
               fontWeight: "bold",
            },
         };

         const response = await axios.patch(
            `/api/images/${image.id}/text-annotation`,
            {
               textAnnotation: textAnnotation,
            }
         );

         if (response.status === 200) {
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

      if (index === selectedImageIndex) {
         setSelectedImage(updatedImage);
      }

      toast.success("Image updated successfully!", {
         position: "bottom-right",
         autoClose: 2000,
      });
   };

   const handleImageSelect = (image: any, index: number) => {
      setSelectedImage(image);
      setSelectedImageIndex(index);
   };

   // Order handling functions
   const handleOrderNow = () => {
      setShowOrderModal(true);
   };

   const handleAddToCart = async (orderData: any) => {
      try {
         const response = await fetch("/api/cart", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
         });

         if (response.ok) {
            const data = await response.json();
            setCartItemCount(prev => prev + 1);

            // Emit cart update event for header to listen
            window.dispatchEvent(new CustomEvent("cartUpdated"));

            toast.success(
               "📚 Album Book successfully added to cart! Ready for checkout."
            );
         } else {
            const errorData = await response.json();
            toast.error(errorData.error || "Failed to add item to cart");
         }
      } catch (error) {
         console.error("Error adding to cart:", error);
         toast.error("Error adding item to cart");
      }
   };

   const handleCheckout = () => {
      setShowCart(false);
      router.push("/checkout");
   };

   // Fetch cart count on load
   useEffect(() => {
      const fetchCartCount = async () => {
         try {
            const response = await fetch("/api/cart");
            if (response.ok) {
               const data = await response.json();
               setCartItemCount(data.totalItems || 0);
            }
         } catch (error) {
            console.error("Error fetching cart count:", error);
         }
      };

      if (isAuthenticated) {
         fetchCartCount();
      }
   }, [isAuthenticated]);

   const isContentPage: boolean =
      (currentPage > 0 &&
         currentPage < (albumData?.images?.length || 0) / 1 + 1) ||
      (currentPage === 0 && !!albumData?.images?.length);

   if (!isAuthenticated) {
      return (
         <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
               <div className="text-lg mb-4">
                  Please login to access this page
               </div>
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

   if (!albumId) {
      return (
         <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="p-8 text-center">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  No Album Selected
               </h2>
               <p className="text-gray-600 mb-4">
                  Please select an album to preview from your dashboard.
               </p>
               <Button
                  onClick={handleBackToDashboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
               >
                  Go to Dashboard
               </Button>
            </Card>
         </div>
      );
   }

   if (basicError || error) {
      return (
         <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="p-8 text-center">
               <h2 className="text-xl font-semibold text-red-600 mb-4">
                  Error
               </h2>
               <p className="text-gray-600 mb-4">{basicError || error}</p>
               <Button
                  onClick={handleBackToDashboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
               >
                  Go to Dashboard
               </Button>
            </Card>
         </div>
      );
   }

   const AlbumBookName = albumData?.bookName || basicAlbumData?.name;
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
         {/* Header */}
         <div className="bg-white shadow-sm border-b p-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div>
                     <h1 className="text-xl font-semibold text-gray-900">
                        {AlbumBookName || "Album Preview"}
                     </h1>
                     <p className="text-sm text-gray-500">
                        Preview your album layout and design
                     </p>
                  </div>
               </div>
               <div className="flex items-center space-x-2">
                  <Button
                     variant="outline"
                     onClick={handleEditAlbum}
                     className="flex items-center space-x-2"
                  >
                     <Edit className="h-4 w-4" />
                     <span>Edit Album</span>
                  </Button>
               </div>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row">
            {/* Main Content */}
            <div className="flex-1">
               {isRefreshing && isToLoading && (
                  <div className="flex items-center justify-center text-blue-600 p-4">
                     <RefreshCw size={16} className="animate-spin mr-2" />
                     <span className="text-sm">Refreshing...</span>
                  </div>
               )}

               <motion.div>
                  {isLayoutChanging || isRefreshing || isToLoading ? (
                     <Loading />
                  ) : (
                     <div className="p-6">
                        {/* Preview content - Using FlippingBook component from edit folder */}
                        {albumData && (
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
                              handleTextContentSave={async () => {}}
                              handleOrderNow={handleOrderNow}
                           />
                        )}
                     </div>
                  )}
               </motion.div>
            </div>

            {/* Preview-specific sidebar - simplified */}
            <div
               className={`${showAsideNavigation ? "block" : "hidden"} max-w-96 lg:hidden`}
            >
               <div className="bg-white border-l border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">Preview Tools</h3>
                     <button
                        onClick={() => setShowAsideNavigation(false)}
                        className="p-2 rounded-full hover:bg-gray-100"
                     >
                        <X size={20} />
                     </button>
                  </div>
                  <div className="space-y-4">
                     <Button
                        onClick={handleEditAlbum}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                     >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Album
                     </Button>
                     <Button
                        onClick={handleBackToDashboard}
                        variant="outline"
                        className="w-full flex items-center justify-center"
                     >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         {/* Mobile Overlay */}
         {showAsideNavigation && (
            <div
               className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
               onClick={() => setShowAsideNavigation(false)}
            />
         )}

         {/* Add Photos Modal */}
         <AnimatePresence>
            {showAddPhotosModal && (
               <AddPhotosModal
                  params={{ id: albumId }}
                  isOpen={showAddPhotosModal}
                  onClose={() => setShowAddPhotosModal(false)}
                  onPhotosSaved={handlePhotosSaved}
               />
            )}
         </AnimatePresence>

         {/* Order Modal */}
         <OrderModal
            isOpen={showOrderModal}
            onClose={() => setShowOrderModal(false)}
            albumId={albumId}
            albumName={AlbumBookName || "Album"}
            onAddToCart={handleAddToCart}
         />

         {/* Cart */}
         <Cart
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            onCheckout={handleCheckout}
         />

         {/* Caption Modal */}
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
      </div>
   );
};

export default PreviewPage;
