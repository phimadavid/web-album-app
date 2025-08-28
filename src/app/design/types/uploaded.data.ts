interface Position {
   x: number;
   y: number;
}

export interface TextAnnotation {
   textContent: string;
   position: Position;
   style: {
      fontSize: string;
      color: string;
      fontFamily: string;
      fontWeight: string;
   };
}

export type UploadedImagesGalleryProps = {
   images: ImageUploadedDataProps[];
   onSetCoverImage: (imageId: string) => void;
};

export type ImageUploadedDataProps = {
   id: string;
   filename: string;
   previewUrl: string;
   s3Url: string;
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
      zoomPosition?: Position | null;
   };
   height: number;
   width: number;
};
