import { ZoomPosition } from "@/app/design/types/template";
import { TextAnnotation } from "@/backend/types/image";

export type BookAlbumPageProps = {
  params: {
    id: string;
  };
};

export type PageContent = {
  id: number;
  frontContent: React.ReactNode;
  backContent: React.ReactNode | null;
};

export type AlbumBook3DProps = {
  name: string;
  pages: PageContent[];
  width?: number;
  height?: number;
  photoHeight?: number;
  photoWidth?: number;
  coverColor?: string;
  coverImage?: string | null;
  lastPhotoUrl?: string;
  lastPhoto?: ImageDataProps;
};

export type AlbumDataProps = {
  webSizePx?: string;
  webPhotoSizePx?: string;
  layoutPage?: string;
  bookName?: string;
  images?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    s3Url: string;
    previewUrl: string;
    imageUrl: string;
    height: number;
    width: number;
    metadata?: {
      captureDate?: string;
      eventGroup?: string;
      isCover?: boolean;
      textAnnotation?: TextAnnotation;
      rotation?: number | null;
      zoom?: number | null;
      caption?: string;
      locationName?: string | null;
      event_tags?: string[] | string;
      zoomPosition?: ZoomPosition | null;
    };
  }>;
  bookDesign: string | string[];
};

export interface ImageDataProps {
  id: string;
  filename: string;
  mimeType: string;
  previewUrl: string;
  imageUrl: string;
  height: number;
  width: number;
  metadata?: {
    captureDate?: string;
    eventGroup?: string;
    isCover?: boolean;
    textAnnotation?: TextAnnotation;
    rotation?: number | null;
    zoom?: number | null;
    caption?: string;
    locationName?: string | null;
    event_tags?: string[] | string;
    zoomPosition?: ZoomPosition | null;
  };
}

export type AlbumBook3DdataProps = {
  name: string;
  pages: Array<{
    id: number;
    content: React.ReactNode;
  }>;
  width?: number;
  height?: number;
  coverColor?: string;
  layout: string;
};

export type FlippingBookProps = {
  width?: number;
  height?: number;
  photoHeight?: number;
  photoWidth?: number;
  coverColor?: string;
  coverImage?: string | string[] | undefined;
  lastPhotoUrl?: string; // Keep for backward compatibility
  lastPhoto?: ImageDataProps;
  onPageChange?: (page: number) => void;
  numberOfImages: number | undefined;
  albumData: AlbumDataProps | null;
  isLayoutChanging?: boolean;
  handleTextContentSave?: (
    updatedAnnotation: TextAnnotation,
    imageIndex: number
  ) => Promise<void>;
  pageBackgrounds: string[];
  pageLayouts?: string[];
};

// Type definitions for caption generation
export interface GeneratedCaption {
  id: string;
  shortCaption: string;
  longCaption: string;
  imageIndex: number;
  createdAt: Date;
}

export interface AsideNavigationProps {
  params: string;
  albumData?: AlbumDataProps;
  currentPage: number;
  onAddPhotos: () => void;
  onChangeLayout: (layoutType: string) => void;
  onChangeDesign: (designType: string, value?: string) => void;
  generateSingleBackground: (
    promptWord: string,
    index: number
  ) => Promise<void>;
  onAddCaption: () => void;
  isGeneratingBackground: boolean;
  generateAllPagesBackground: (promptWord: string) => Promise<void>;
  onClose?: () => void;
  isContentPage: boolean;
  generateCaptionsForCurrentPage: () => Promise<void>;
  isGeneratingCaptions: boolean;
  generatedCaptions: GeneratedCaption[];
  // copyToClipboard?: (text: string, captionId: string) => Promise<void>;
  saveCaptionToTextAnnotation: (
    captionText: string,
    imageIndex: number,
    captionId: string
  ) => Promise<void>;
  copiedCaptionId: string | null;
  selectedImage: any | null;
  selectedImageIndex: number;
  onImageUpdate: (index: number, updatedImage: any) => void;
  onImageSelect: (image: any, index: number) => void;
  activePanel?: string | null;
  setActivePanel?: (panel: string | null) => void;
}

export interface AddPhotosModalProps {
  params: {
    id: string;
  };
  onPhotosSaved: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export interface PageSliderProps {
  albumData: AlbumDataProps | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageBackgrounds: string[];
  onSave: () => void;
  isSaving: boolean;
  onPreview: () => void;
}
