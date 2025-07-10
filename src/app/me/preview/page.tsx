"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from 'axios';
import { toast } from 'react-toastify';
import { ThreeDots } from 'react-loader-spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Share2,
  Download,
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
  MessageSquare,
  Sparkles,
  Check,
  BookOpen,
  Eye,
  Save,
  ShoppingCart,
} from "lucide-react";
import { FallingLines } from "react-loader-spinner";
import AsideNavigation from "../components/aside.navigation";
import { withAuth } from "@/backend/withAuth";
import bookHand from '../../../../public/images/book-hand.png';
import { useAlbumData } from '@/backend/services/actions/getAlbums';
import { generateTemplateImage } from '@/lib/services/hf.generate.template';

// Import types and components from edit folder
import {
  AlbumDataProps,
  BookAlbumPageProps,
  FlippingBookProps,
  GeneratedCaption,
} from '../../edit/data-types/types';
import PageSlider from '../../edit/components/page-slider';
import ImageEditor from '../../edit/components/image-editor';
import { NoteFeature } from '../../edit/components/note.features';
import AddPhotos from '../../edit/components/addphotos';
import Loading from '../../edit/components/loading.state';
import ErrorMessage from '../../edit/components/error.features';
import OrderModal from '../../components/order/order-modal';
import Cart from '../../components/cart/cart';

interface Album {
  id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'complete';
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

const PreviewPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const albumId = searchParams.get('albumId');
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
  const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);
  const [setError, isSetError] = useState<string>('');
  const [isToLoading, setIsToLoading] = useState(false);
  const [pageBackgrounds, setPageBackgrounds] = useState<string[]>([]);
  const [showAsideNavigation, setShowAsideNavigation] = useState(false);

  // View modes
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Caption generation
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption[]>([]);
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

  const { isLoading: authLoading, isAuthenticated, logout } = withAuth({
    role: 'user',
    redirectTo: '/signin',
  });

  // Use the album data hook from edit folder
  const {
    albumData,
    error,
    isLoading,
    setAlbumData,
    setCustomPrompts,
    handleSaveAlbumName,
  } = useAlbumData(albumId || '');

  // Fetch basic album data for verification
  useEffect(() => {
    const fetchBasicAlbumData = async () => {
      if (!albumId || !isAuthenticated) {
        setIsBasicLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/me/albums');
        if (response.ok) {
          const data = await response.json();
          const album = data.data.find((a: Album) => a.id === albumId);

          if (album) {
            setBasicAlbumData(album);
          } else {
            setBasicError('Album not found');
          }
        } else {
          setBasicError('Failed to fetch album data');
        }
      } catch (err) {
        console.error('Error fetching album data:', err);
        setBasicError('An error occurred while fetching album data');
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
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  const handlePhotosSaved = useCallback(() => {
    setIsRefreshing(true);

    if (setAlbumData && setIsToLoading) {
      setIsToLoading(true);

      axios
        .get(`/api/images/${albumId}`)
        .then((response) => {
          setAlbumData((prevData: AlbumDataProps | null) => {
            if (!prevData) return null;
            return {
              ...prevData,
              images: response.data,
            };
          });

          if (response.data && response.data.length) {
            setPageBackgrounds(Array(response.data.length).fill(''));
            setCustomPrompts(Array(response.data.length).fill(''));
          }
        })
        .catch((error) => {
          console.error('Failed to refresh album data:', error);
          isSetError('Failed to refresh album data after adding photos');
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
    router.push('/me/dashboard');
  };

  const handleEditAlbum = () => {
    if (albumId) {
      router.push(`/me/edit/${albumId}`);
    }
  };

  const handleShareAlbum = () => {
    console.log('Share album:', albumId);
  };

  const handleDownloadAlbum = () => {
    console.log('Download album:', albumId);
  };

  const handleAddPhotos = () => {
    setShowAddPhotosModal(true);
  };

  const handleChangeLayout = async (layout: string): Promise<void> => {
    try {
      setIsLayoutChanging(true);
      const layoutType =
        layout === 'multiple' ? 'multiple'
          : layout === 'sidebyside' ? 'sidebyside'
            : layout === 'magazine' ? 'magazine'
              : layout === 'palaroid' ? 'palaroid'
                : layout === 'Timeline' ? 'Timeline'
                  : layout === 'random' ? 'random'
                    : 'single';

      setAlbumData((prevData: AlbumDataProps | null): AlbumDataProps | null =>
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
        toast.success('Layout updated successfully', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to change layout:', error);
      setAlbumData((prevData: AlbumDataProps | null): AlbumDataProps | null =>
        prevData
          ? {
            ...prevData,
            layoutPage: layout === 'multiple' ? 'single' : 'multiple',
          }
          : null
      );
    } finally {
      setIsLayoutChanging(false);
    }
  };

  const handleChangeDesign = (designType: string, value?: string): void => {
    if (designType === 'albumName' && value) {
      setAlbumData((prevData: AlbumDataProps | null): AlbumDataProps | null => {
        if (!prevData) return null;
        return {
          ...prevData,
          bookName: value,
        };
      });

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
    setViewMode('edit');
    setShowAsideNavigation(true);
  };

  const switchToPreviewMode = () => {
    if (viewMode === 'edit') {
      setShowPreviewModal(true);
    } else {
      setViewMode('preview');
      setShowAsideNavigation(false);
    }
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      toast.success('Changes saved successfully!', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate backgrounds and captions (same as edit page)
  const generateSingleBackground = async (promptWord: string, pageIndex: number) => {
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

      setPageBackgrounds((prev) => {
        const updated = [...prev];
        updated[frontPageIndex] = frontBackgroundImage;
        updated[backPageIndex] = backBackgroundImage;
        return updated;
      });

      toast.success('Backgrounds generated for both front and back!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error(`Error generating background for prompt "${promptWord}":`, error);
      toast.error('Failed to generate backgrounds. Please try again.', {
        position: 'bottom-right',
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
          const frontBackgroundImages = await generateTemplateImage(promptWord);
          const backBackgroundImages = await generateTemplateImage(promptWord);

          const frontBackgroundImage = frontBackgroundImages[0];
          const backBackgroundImage = backBackgroundImages[0];

          const frontPageIndex = pageNum * 2;
          const backPageIndex = pageNum * 2 + 1;

          setPageBackgrounds((prev) => {
            const updated = [...prev];
            updated[frontPageIndex] = frontBackgroundImage;
            updated[backPageIndex] = backBackgroundImage;
            return updated;
          });

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to generate background for page ${pageNum}:`, error);
        }
      }

      toast.success('Backgrounds generated for all pages!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error generating backgrounds for all pages:', error);
      toast.error('Failed to generate backgrounds. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getAlbumBookDimensions = () => {
    if (!albumData || !albumData.webSizePx) return { width: 530, height: 520 };
    const dimensions = albumData.webSizePx.split(/[x×]/);
    const width = Number(dimensions[0]);
    const height = Number(dimensions[1]);
    return { width, height };
  };

  const getImagePixel = () => {
    if (!albumData || !albumData.webPhotoSizePx) return { width: 530, height: 520 };
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
        frontPhotoIndex >= 0 && frontPhotoIndex < albumData.images.length ? albumData.images[frontPhotoIndex] : null,
        frontPhotoIndex + 1 < albumData.images.length ? albumData.images[frontPhotoIndex + 1] : null,
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

      toast.success(`Generated ${newCaptions.length} captions for current page!`, {
        position: 'bottom-right',
        autoClose: 3000,
      });

    } catch (error) {
      console.error('Error generating captions:', error);
      toast.error('Failed to generate captions. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const generateMockCaptions = async (image: any): Promise<{ short: string; long: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const shortCaptions = [
      "Beautiful moment", "Precious memory", "Special day", "Happy times", "Life's joy", "Sweet memories"
    ];

    const longCaptions = [
      "A beautiful moment captured in time, filled with joy and happiness that will be treasured forever.",
      "This precious memory showcases the beauty of life's simple pleasures and meaningful connections.",
      "A special day that reminds us of the importance of celebrating life's wonderful moments together.",
    ];

    const randomShort = shortCaptions[Math.floor(Math.random() * shortCaptions.length)];
    const randomLong = longCaptions[Math.floor(Math.random() * longCaptions.length)];

    return { short: randomShort, long: randomLong };
  };

  const saveCaptionToTextAnnotation = async (captionText: string, imageIndex: number, captionId: string) => {
    try {
      if (!albumData?.images || imageIndex >= albumData.images.length) {
        throw new Error('Invalid image index');
      }

      const image = albumData.images[imageIndex];
      const textAnnotation = {
        textContent: captionText,
        position: { x: 50, y: 85 },
        style: {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold'
        }
      };

      const response = await axios.patch(`/api/images/${image.id}/text-annotation`, {
        textAnnotation: textAnnotation,
      });

      if (response.status === 200) {
        setAlbumData((prevData: AlbumDataProps | null): AlbumDataProps | null => {
          if (!prevData) return null;

          const updatedImages = prevData.images ? [...prevData.images] : [];
          if (updatedImages[imageIndex]) {
            updatedImages[imageIndex] = {
              ...updatedImages[imageIndex],
              metadata: {
                ...updatedImages[imageIndex].metadata,
                textAnnotation: textAnnotation
              }
            };
          }

          return {
            ...prevData,
            images: updatedImages
          };
        });

        setCopiedCaptionId(captionId);
        toast.success('Caption saved to image!', {
          position: 'bottom-right',
          autoClose: 2000,
        });

        setTimeout(() => setCopiedCaptionId(null), 2000);
      }
    } catch (error) {
      console.error('Failed to save caption to text annotation:', error);
      toast.error('Failed to save caption to image', {
        position: 'bottom-right',
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
        images: updatedImages
      };
    });

    if (index === selectedImageIndex) {
      setSelectedImage(updatedImage);
    }

    toast.success('Image updated successfully!', {
      position: 'bottom-right',
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
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const data = await response.json();
        setCartItemCount(prev => prev + 1);

        // Emit cart update event for header to listen
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        toast.success('Item added to cart!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding item to cart');
    }
  };

  const handleCartOpen = () => {
    setShowCart(true);
  };

  const handleCheckout = () => {
    setShowCart(false);
    router.push('/checkout');
  };

  // Fetch cart count on load
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          setCartItemCount(data.totalItems || 0);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
      }
    };

    if (isAuthenticated) {
      fetchCartCount();
    }
  }, [isAuthenticated]);

  const isContentPage: boolean =
    (currentPage > 0 && currentPage < (albumData?.images?.length || 0) / 1 + 1) ||
    (currentPage === 0 && !!albumData?.images?.length);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">Please login to access this page</div>
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
      <>  <AsideNavigation onLogout={logout} />
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
      </>
    );
  }

  if (basicError || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
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
  const lastPhotoIndex = albumData?.images?.length ? albumData?.images?.length - 1 : 0;
  const numberOfImage = albumData?.images?.length;
  const lastPhoto = albumData?.images?.[lastPhotoIndex];
  const lastPhotoUrl = lastPhoto?.previewUrl || '';

  const { width, height } = getAlbumBookDimensions();
  const { photoWidth, photoHeight } = getImagePixel();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AsideNavigation onLogout={logout} />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="flex w-full flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {AlbumBookName || 'Album Preview'}
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
                <Button
                  variant="outline"
                  onClick={handleShareAlbum}
                  className="flex items-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadAlbum}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                {/* Cart Button */}
                <Button
                  variant="outline"
                  onClick={handleCartOpen}
                  className="flex items-center space-x-2 relative"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
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
                        key={albumData?.layoutPage || 'default'}
                        isLayoutChanging={isLayoutChanging}
                        pageBackgrounds={pageBackgrounds}
                        pageLayouts={pageLayouts}
                        handleTextContentSave={async () => { }}
                        handleOrderNow={handleOrderNow}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Preview-specific sidebar - simplified */}
            <div className={`${showAsideNavigation ? 'block' : 'hidden'} max-w-96 lg:hidden`}>
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
            albumName={AlbumBookName || 'Album'}
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
                      Our development team is working on implementing the photo
                      upload functionality. This feature will allow you to add
                      caption in the images to your album.
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
      </div>
    </div>
  );
};

// Add Photos Modal Component
const AddPhotosModal: React.FC<{
  params: { id: string };
  isOpen: boolean;
  onClose: () => void;
  onPhotosSaved: () => void;
}> = ({ isOpen, onClose, params, onPhotosSaved }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
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
        animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.95 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md lg:max-w-5xl mx-4 max-h-[90vh] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
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

// FlippingBook Component - Extended with handleOrderNow prop
interface ExtendedFlippingBookProps extends FlippingBookProps {
  handleOrderNow: () => void;
}

const FlippingBook: React.FC<ExtendedFlippingBookProps> = ({
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
  handleOrderNow,
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
    return pageLayout || 'single';
  };

  // Function to get images per page for a specific layout
  const getImagesPerPageForLayout = (layout: string): number => {
    switch (layout) {
      case 'multiple': return 4;
      case 'sidebyside': return 2;
      case 'magazine': return 4;
      case 'palaroid': return 4;
      case 'Timeline': return 3;
      case 'random': return 2;
      default: return 1;
    }
  };

  const imagesPerPage = getImagesPerPageForLayout(pageLayout || 'single');

  const imagesPerPaper = imagesPerPage * 2;
  const actualNumOfPapers = Math.ceil(imageData.length / 2) || 0;

  const numOfPapers =
    pageLayout === 'multiple'
      ? Math.max(actualNumOfPapers / 2)
      : pageLayout === 'sidebyside' ? Math.max(actualNumOfPapers - 2)
        : pageLayout === 'magazine' ? Math.max(actualNumOfPapers / 2)
          : pageLayout === 'palaroid' ? Math.max(actualNumOfPapers / 2)
            : pageLayout === 'Timeline' ? Math.max(actualNumOfPapers / 2)
              : pageLayout === 'random' ? Math.max(actualNumOfPapers)
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
      x: isAtBeginning ? '0%' : '100%',
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    }),
    open: {
      x: '50%',
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  };

  const buttonVariants = {
    hidden: {
      x: 0,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
    visible: (isLeft: boolean) => ({
      x: isLeft ? -180 : 180,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    }),
  };

  const pageVariants = {
    unflipped: {
      rotateY: 0,
      transition: {
        duration: 0.7,
        ease: [0.4, 0.0, 0.2, 1], // Custom easing for paper flip feel
      },
    },
    flipped: {
      rotateY: -180,
      transition: {
        duration: 0.7,
        ease: [0.4, 0.0, 0.2, 1],
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
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const parseTextAnnotation = (image: any) => {
    if (!image?.metadata?.textAnnotation) return null;

    try {
      // Check if textAnnotation is a string and parse it
      if (typeof image?.metadata?.textAnnotation === 'string') {
        return JSON.parse(image?.metadata?.textAnnotation);
      } else {
        // It's already an object
        return image?.metadata?.textAnnotation;
      }
    } catch (error) {
      console.error('Error parsing textAnnotation:', error);
      return null;
    }
  };

  const getImageStyle = (image: any) => {
    let style: React.CSSProperties = {
      objectFit: 'cover',
      transform: '',
    };

    if (image?.metadata?.rotation) {
      style.transform = `rotate(${image?.metadata.rotation}deg)`;
    }

    if ((image?.metadata?.zoom || 1.0) > 1.0) {
      style = {
        ...style,
        transform: `${style.transform ? style.transform : ''} scale(${image?.metadata?.zoom})`,
        transformOrigin: `${image?.metadata?.zoomPosition?.x || 50}% ${image?.metadata?.zoomPosition?.y || 50}%`,
        objectFit: 'cover',
      };
    }

    return style;
  };

  const getContainerStyle = (image: any) => {
    let style: React.CSSProperties = {
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    };

    if ((image?.metadata?.zoom || 1.0) > 1.0) {
      style.overflow = 'hidden'; // Ensure overflow is hidden to contain the zoomed content
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
          width: pageLayout === 'multiple' ? '50%' : '100%',
          height: pageLayout === 'multiple' ? '50%' : '100%',
          padding: '4px',
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
              position: 'relative',
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
                  transform: 'translate(-50%, -50%)',
                  color: parsedTextAnnotation?.style?.color || '#ffffff',
                  fontSize: parsedTextAnnotation?.style?.fontSize || '24px',
                  fontFamily:
                    parsedTextAnnotation?.style?.fontFamily ||
                    'Arial, sans-serif',
                  fontWeight: parsedTextAnnotation?.style?.fontWeight || 'normal',
                  textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  boxShadow: '0 0 8px rgba(0,0,0,0.5)',
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
    const rightImage = startIndex + 1 < images.length ? images[startIndex + 1] : null;

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
                const parsedTextAnnotation = parseTextAnnotation(leftImage);
                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                      left: `${parsedTextAnnotation.position.x}%`,
                      top: `${parsedTextAnnotation.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: parsedTextAnnotation.style?.color || '#ffffff',
                      fontSize: parsedTextAnnotation.style?.fontSize || '24px',
                      fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                      fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                      textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      maxWidth: '80%',
                      textAlign: 'center',
                      boxShadow: '0 0 8px rgba(0,0,0,0.5)',
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
                const parsedTextAnnotation = parseTextAnnotation(rightImage);
                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                      left: `${parsedTextAnnotation.position.x}%`,
                      top: `${parsedTextAnnotation.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: parsedTextAnnotation.style?.color || '#ffffff',
                      fontSize: parsedTextAnnotation.style?.fontSize || '24px',
                      fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                      fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                      textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      maxWidth: '80%',
                      textAlign: 'center',
                      boxShadow: '0 0 8px rgba(0,0,0,0.5)',
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
                const parsedTextAnnotation = parseTextAnnotation(mainImage);
                return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                      left: `${parsedTextAnnotation.position.x}%`,
                      top: `${parsedTextAnnotation.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: parsedTextAnnotation.style?.color || '#ffffff',
                      fontSize: parsedTextAnnotation.style?.fontSize || '20px',
                      fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                      fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                      textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      maxWidth: '80%',
                      textAlign: 'center',
                      boxShadow: '0 0 8px rgba(0,0,0,0.5)',
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
            <div key={`thumb-${startIndex + 1 + index}`} className="w-full aspect-square relative">
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
                    const parsedTextAnnotation = parseTextAnnotation(image);
                    return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                      <div
                        className="absolute z-30 pointer-events-none"
                        style={{
                          left: `${parsedTextAnnotation.position.x}%`,
                          top: `${parsedTextAnnotation.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                          color: parsedTextAnnotation.style?.color || '#ffffff',
                          fontSize: '12px',
                          fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                          fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                          textShadow: '0px 0px 2px #000000',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          padding: '2px 4px',
                          borderRadius: '2px',
                          whiteSpace: 'nowrap',
                          maxWidth: '90%',
                          textAlign: 'center',
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
          {Array.from({ length: Math.max(0, 3 - thumbnails.length) }).map((_, index) => (
            <div key={`empty-thumb-${index}`} className="w-full aspect-square relative">
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
                width: '45%',
                maxWidth: '180px',
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
                    {image.metadata?.capturedAt ? formatDate(image.metadata.capturedAt) : `Photo ${startIndex + index + 1}`}
                  </div>

                  {/* Text Annotation for polaroid */}
                  {(() => {
                    const parsedTextAnnotation = parseTextAnnotation(image);
                    return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                      <div
                        className="absolute z-30 pointer-events-none"
                        style={{
                          left: `${parsedTextAnnotation.position.x}%`,
                          top: `${parsedTextAnnotation.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                          color: parsedTextAnnotation.style?.color || '#ffffff',
                          fontSize: parsedTextAnnotation.style?.fontSize || '16px',
                          fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                          fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                          textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                          maxWidth: '80%',
                          textAlign: 'center',
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
            <div key={`timeline-${startIndex + index}`} className="flex items-center gap-4">
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
                        const parsedTextAnnotation = parseTextAnnotation(image);
                        return parsedTextAnnotation && parsedTextAnnotation.position && parsedTextAnnotation.textContent ? (
                          <div
                            className="absolute z-30 pointer-events-none"
                            style={{
                              left: `${parsedTextAnnotation.position.x}%`,
                              top: `${parsedTextAnnotation.position.y}%`,
                              transform: 'translate(-50%, -50%)',
                              color: parsedTextAnnotation.style?.color || '#ffffff',
                              fontSize: '12px', // Smaller for timeline
                              fontFamily: parsedTextAnnotation.style?.fontFamily || 'Arial, sans-serif',
                              fontWeight: parsedTextAnnotation.style?.fontWeight || 'normal',
                              textShadow: '0px 0px 2px #000000',
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                              padding: '1px 3px',
                              borderRadius: '2px',
                              whiteSpace: 'nowrap',
                              maxWidth: '90%',
                              textAlign: 'center',
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
                        {image.metadata?.capturedAt ? formatDate(image.metadata.capturedAt) : `Event ${startIndex + index + 1}`}
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
  const renderAllStyles = (images: any[], startIndex: number, pageIndex: number) => {
    // Array of available layout styles
    const layoutStyles = ['single', 'sidebyside', 'magazine', 'palaroid', 'Timeline', 'multiple'];

    // Use page index to determine which style to use (creates consistent randomness)
    const styleIndex = pageIndex % layoutStyles.length;
    const selectedStyle = layoutStyles[styleIndex];

    // Render based on the selected style
    switch (selectedStyle) {
      case 'multiple':
        return renderImageGrid(images, startIndex);
      case 'sidebyside':
        return renderSidebySideStyle(images, startIndex);
      case 'magazine':
        return renderMagazineStyle(images, startIndex);
      case 'palaroid':
        return renderPalaroidStyle(images, startIndex);
      case 'Timeline':
        return renderTimeline(images, startIndex);
      case 'single':
      default:
        return renderImage(startIndex < images.length ? images[startIndex] : null, startIndex);
    }
  };

  const renderPapers = () => {
    const frontCover = (
      <div
        className="paper absolute w-full h-full top-0 left-0"
        style={{
          zIndex: currentLocation > 1 ? 1 : numOfPapers + 2,
          perspective: '1500px',
        }}
      >
        <motion.div
          className="front absolute w-full h-full top-0 left-0 z-[20] rounded-r-md overflow-hidden"
          style={{
            transformOrigin: 'left',
            backfaceVisibility: 'hidden',
            boxShadow: '2px 2px 10px rgba(0,0,0,0.2)',
            background: coverImage
              ? `url("${coverImage}") no-repeat center/cover`
              : `linear-gradient(135deg, ${coverColor || '#8B4513'} 0%, #4A230C 100%)`,
          }}
          initial="unflipped"
          animate={currentLocation > 1 ? 'flipped' : 'unflipped'}
          variants={pageVariants}
        >
          {currentLocation <= 1 && (
            <div
              className="front-content w-full h-full flex flex-col justify-center items-end z-0"
            >
              <div
                className="absolute top-0 left-0 bg-transparent w-[12px] h-full aspect-square blur-[1px] brightness-50"
                style={{
                  border: '3px groove #cccccc',
                }}
              ></div>
              <span
                className="absolute text-white text-sm -left-4 top-[50%] z-50"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                  top: '50%',
                }}
              >
                {albumData?.bookName}
              </span>
              <div
                className="bg-transparent w-full h-full aspect-square z-50 blur-[3px] brightness-50"
                style={{
                  border: '4px groove #cccccc',
                }}
              ></div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="back absolute w-full h-full top-0 left-0"
          style={{
            transformOrigin: 'left',
            background: coverImage
              ? `url("${coverImage}") no-repeat center/cover`
              : `linear-gradient(135deg, ${coverColor || '#8B4513'} 0%, #4A230C 100%)`,
          }}
          initial="unflipped"
          animate={currentLocation > 1 ? 'flipped' : 'unflipped'}
          variants={pageVariants}
        >
          <div
            className="back-content w-full h-full flex flex-col justify-center items-end"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="bg-white w-[420px] h-[440px] aspect-square">
            </div>
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

      const frontPageBackground = pageBackgrounds[frontPageBackgroundIndex] || coverImage;
      const backPageBackground = pageBackgrounds[backPageBackgroundIndex] || coverImage;

      return (
        <div
          key={`paper-${paperIndex}`}
          id={`p${paperIndex}`}
          className="paper absolute flex justify-center items-center w-[400px] h-[400px]"
          style={{
            zIndex: isFlipped ? paperIndex + 1 : numOfPapers - i + 1,
            perspective: '1500px',
          }}
        >
          {/* Content page - Front side */}
          <motion.div
            className="front absolute w-full h-full top-1 left-0 bg-white border-l-[3px] border-[#0b0d0e] z-10"
            style={{
              transformOrigin: 'left',
              backfaceVisibility: 'hidden',
            }}
            initial="unflipped"
            animate={isFlipped ? 'flipped' : 'unflipped'}
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
                    : `linear-gradient(135deg, ${coverColor || '#8B4513'} 0%, #4A230C 100%)`,
              }}
            >
              {/* Use individual page layout or fall back to global layout */}
              {(() => {
                const currentPageLayout = getLayoutForPage(i);
                return currentPageLayout === 'multiple'
                  ? renderImageGrid(imageData, startFrontIndex)
                  : currentPageLayout === 'sidebyside' ? renderSidebySideStyle(imageData, startFrontIndex)
                    : currentPageLayout === 'magazine' ? renderMagazineStyle(imageData, startFrontIndex)
                      : currentPageLayout === 'palaroid' ? renderPalaroidStyle(imageData, startFrontIndex)
                        : currentPageLayout === 'Timeline' ? renderTimeline(imageData, startFrontIndex)
                          : currentPageLayout === 'random' ? renderAllStyles(imageData, startFrontIndex, i)
                            : renderImage(startFrontIndex < imageData.length ? imageData[startFrontIndex] : null, startFrontIndex);
              })()}
            </div>
          </motion.div>

          {/* Content page - Back side */}
          <motion.div
            className="back absolute w-full h-full top-1 left-0 z-[0]"
            style={{
              transformOrigin: 'left',
            }}
            initial="unflipped"
            animate={isFlipped ? 'flipped' : 'unflipped'}
            variants={pageVariants}
          >
            {/* Content page container with back background */}
            <div
              className="content-container w-[420px] h-[440px] absolute flex flex-col justify-center items-center p-6"
              style={{
                transform: 'rotateY(180deg)',
                background: backPageBackground
                  ? `url("${backPageBackground}") no-repeat center/cover`
                  : coverImage
                    ? `url("${coverImage}") no-repeat center/cover`
                    : `linear-gradient(135deg, ${coverColor || '#8B4513'} 0%, #4A230C 100%)`,
              }}
            >
              {/* Use individual page layout or fall back to global layout for back side */}
              {(() => {
                const currentPageLayout = getLayoutForPage(i);
                return currentPageLayout === 'multiple'
                  ? renderImageGrid(imageData, startBackIndex)
                  : currentPageLayout === 'sidebyside' ? renderSidebySideStyle(imageData, startBackIndex)
                    : currentPageLayout === 'magazine' ? renderMagazineStyle(imageData, startBackIndex)
                      : currentPageLayout === 'palaroid' ? renderPalaroidStyle(imageData, startBackIndex)
                        : currentPageLayout === 'Timeline' ? renderTimeline(imageData, startBackIndex)
                          : currentPageLayout === 'random' ? renderAllStyles(imageData, startBackIndex, i)
                            : renderImage(startBackIndex < imageData.length ? imageData[startBackIndex] : null, startBackIndex);
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
          perspective: '1500px',
        }}
      >
        <motion.div
          className="front absolute w-full h-full top-0 left-0 border-l-[3px] border-[#0b0d0e] z-50"
          style={{
            transformOrigin: 'left',
            backfaceVisibility: 'hidden',
            background: coverImage
              ? `url("${coverImage}") no-repeat center/cover`
              : `linear-gradient(135deg, ${coverColor || '#8B4513'} 0%, #4A230C 100%)`,
          }}
          initial="unflipped"
          animate={currentLocation > numOfPapers + 1 ? 'flipped' : 'unflipped'}
          variants={pageVariants}
        >
          <div className="content-container w-full h-full flex flex-col justify-center items-start">
            <div className="bg-white w-[420px] h-[440px] aspect-square"></div>
          </div>
        </motion.div>

        <motion.div
          className="back absolute w-full h-full top-0 left-0 bg-blue-700 z-[0] rounded-r-md"
          style={{
            transformOrigin: 'left',
            boxShadow: '2px 2px 10px rgba(0,0,0,0.2)',
            background: coverImage
              ? `url("${coverImage}") no-repeat center/cover`
              : `linear-gradient(135deg, ${coverColor || '#8B4513'} 0%, #4A230C 100%)`,
          }}
          initial="unflipped"
          animate={currentLocation > numOfPapers + 1 ? 'flipped' : 'unflipped'}
          variants={pageVariants}
        >
          <div
            className="front-content w-full h-full flex flex-col justify-center items-end"
            style={{ transform: 'rotateY(180deg)' }}
          >
            {/* Show groove and album name on the actual back of the book */}
            <>
              <div
                className="absolute top-0 right-0 bg-transparent w-[12px] h-full aspect-square blur-[1px] brightness-50"
                style={{
                  border: '3px groove #cccccc',
                }}
              ></div>
              <span
                className="absolute text-white text-sm -right-2 top-[50%] z-50"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                  top: '50%',
                }}
              >
                {albumData?.bookName}
              </span>
            </>
            <div
              className="bg-transparent w-full h-full aspect-square z-50 blur-[3px] brightness-50"
              style={{
                border: '4px groove #cccccc',
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
          animate={isBookOpen ? 'visible' : 'hidden'}
          variants={buttonVariants}
          custom={true}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
          whileTap={{ scale: 0.95 }}
          disabled={currentLocation <= 1}
        >
          <ChevronLeft
            size={48}
            color={currentLocation <= 1 ? '#aaaaaa' : '#666666'}
            strokeWidth={1.5}
          />
        </motion.button>

        <div className="box p-10">
          <motion.div
            id="book"
            className="book relative w-[425px] h-[450px]"
            initial="closed"
            animate={isBookOpen ? 'open' : 'closed'}
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
          animate={isBookOpen ? 'visible' : 'hidden'}
          variants={buttonVariants}
          custom={false}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.05)' }}
          whileTap={{ scale: 0.95 }}
          disabled={currentLocation >= maxLocation}
        >
          <ChevronRight
            size={48}
            color={currentLocation >= maxLocation ? '#aaaaaa' : '#666666'}
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
                Click the{' '}
                <span className="italic underline">Order Now</span>{' '}
                button to order your photo album book now.
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={handleOrderNow}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Order Now
              </Button>
            </motion.div>
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
                This is how your book will be printed{' '}
              </h3>
              <p className="text-sm">
                You have to browse to throught it, check that the images are
                format or edited exactly as you wanted. You have to go through
                the texts, make sure there are no spelling errors, that you
                haven't used emojis (they're cute, but they can't be printed).
                It's important to remember, we know how to print texts in
                Herbrew, English, arabic, and Russian.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};


export default PreviewPage;
