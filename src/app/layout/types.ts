export interface PhotoAlbumLayoutSelectorProps {
  totalImages: number;
  onLayoutSelect: (layout: string) => void;
  onViewTemplates: (() => void) | undefined;
  sampleImages?: string[];
  defaultLayout?: string | undefined;
  maxImagesPerPage?: number;
  maxSingleLayoutImages?: number;
  showNotifications?: boolean;
  params?: {
    id: string;
  };
}

export type ImageArrangementLayoutProps = {
  params: {
    id: string;
  };
};

export type LayoutType =
  | 'single'
  | 'multiple'
  | 'sidebyside'
  | 'magazine'
  | 'polaroid'
  | 'timeline'
  | 'random';

export interface LayoutOption {
  id: LayoutType;
  title: string;
  description: string;
  maxImages?: number;
  recommended?: boolean;
}
