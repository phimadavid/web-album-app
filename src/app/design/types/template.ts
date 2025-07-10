import { Position, TextAnnotation } from '@/backend/types/image';

// Define the type for image objects based on your API response
export type ImageDataProps = {
  id: string;
  filename: string;
  mimeType: string;
  previewUrl: string;
  s3Url: string;
  imageUrl: string;
  height: number;
  width: number;
  metadata?: {
    captureDate?: string;
    eventGroup?: string;
    textAnnotation?: TextAnnotation;
    rotation?: number | null;
    zoom?: number | null;
    caption?: string;
    locationName?: string | null;
    event_tags?: string[] | string;
    zoomPosition?: ZoomPosition | null;
  };
};

export type TemplateGenerationProps = {
  params: { id: string };
};

export type TemplateData = {
  id: string;
  name: string;
  image: string;
  theme: string;
  style: string;
  colors: string[];
  isLoading?: boolean;
  imageLoading?: boolean;
  promptWord?: string;
  compositeImage?: string;
};

export interface AutoTemplateGeneratorProps {
  albumId: string;
  Images: Array<{
    id: string;
    filename: string;
    mimeType: string;
    previewUrl: string;
    imageUrl: string;
    s3Url: string;
    metadata?: {
      captureDate?: string;
      eventGroup?: string;
      textAnnotation?: TextAnnotation;
      rotation?: number | null;
      zoom?: number | null;
      caption?: string;
      locationName?: string | null;
      event_tags?: string[] | string;
      zoomPosition?: ZoomPosition | null;
    };
    height: number;
    width: number;
  }>;
}

export interface ZoomPosition {
  x: number;
  y: number;
}
