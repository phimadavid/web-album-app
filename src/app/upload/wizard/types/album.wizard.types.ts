// Types matching the CreateAlbum model
export interface AlbumWizardData {
  albumId: string;
  format: "square" | "rectangular" | "panoramic";
  dimensions: string;
  photosize: string;
  coverType: "hard" | "soft" | "spiral" | "premium";
  paperQuality: "matte" | "glossy" | "premium";
}

export interface FormatSelectorProps {
  selected: string;
  dimensions: string;
  onChange: (data: {
    format: "square" | "rectangular" | "panoramic";
    dimensions: string;
  }) => void;
}

export interface CoverSelectorProps {
  selected: string;
  onChange: (data: {
    coverType: "hard" | "soft" | "spiral" | "premium";
  }) => void;
}

export interface PaperSelectorProps {
  selected: string;
  onChange: (data: { paperQuality: "matte" | "glossy" | "premium" }) => void;
}

export interface PhotoSizeSelectorProps {
  selected: string;
  onChange: (data: { photosize: string }) => void;
}

export interface AlbumWizardProps {
  onComplete: (albumData: AlbumWizardData) => void;
  params: { id: string };
}
