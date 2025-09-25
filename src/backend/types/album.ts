export type CreateAlbumTypes = {
   albumId: string;
   format: "square" | "rectangular" | "panoramic";
   dimensions: string;
   coverType: "hard" | "soft" | "spiral" | "premium";
   paperQuality: "matte" | "glossy" | "premium";
   pages: number;
   createdAt?: Date;
   updatedAt?: Date;
};

export type CreateImageAttributes = {
   filename: string;
   originalUrl: string;
   thumbnailUrl: string;
   size: number;
   width: number;
   height: number;
   format: string;
   dpi: number;
   albumId?: string;
   libraryId?: string;
   metadata: {
      takenAt?: Date;
      location?: string;
      device?: string;
   };
};
