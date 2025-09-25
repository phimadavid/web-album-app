// Core Types for the Photobook Editor
export interface Position {
   x: number;
   y: number;
}

export interface Size {
   width: number;
   height: number;
}

export interface Bounds extends Position, Size {}

export interface BaseElement extends Position, Size {
   id: string;
   type: ElementType;
   rotation?: number;
   zIndex?: number;
   locked?: boolean;
   visible?: boolean;
}

export interface ImageElement extends BaseElement {
   type: "image";
   src: string;
   alt?: string;
   opacity?: number;
   filter?: string;
   borderRadius?: number;
   // Image Effects
   brightness?: number;
   contrast?: number;
   saturation?: number;
   blur?: number;
   hue?: number;
   // Border Effects
   borderWidth?: number;
   borderColor?: string;
   // Shadow Effects
   shadowBlur?: number;
   shadowX?: number;
   shadowY?: number;
   shadowColor?: string;
   // Masking Properties
   mask?: MaskElement;
}

export interface TextElement extends BaseElement {
   type: "text";
   text: string;
   fontSize?: number;
   color?: string;
   fontFamily?: string;
   fontWeight?: number | string;
   textAlign?: "left" | "center" | "right" | "justify";
   lineHeight?: number;
   letterSpacing?: number;
   textDecoration?: "none" | "underline" | "overline" | "line-through";
   textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface DrawingElement extends BaseElement {
   type: "drawing";
   paths: DrawingPath[];
   strokeColor?: string;
   strokeWidth?: number;
   fill?: string;
   opacity?: number;
}

export interface DrawingPath {
   id: string;
   points: Position[];
   strokeColor: string;
   strokeWidth: number;
   opacity?: number;
}

export interface StickerElement extends BaseElement {
   type: "sticker";
   stickerId: string;
   src: string;
   category?: string;
   opacity?: number;
}

// New Mask Element Types
export interface MaskElement {
   id: string;
   type: MaskType;
   shape: MaskShape;
   x: number;
   y: number;
   width: number;
   height: number;
   rotation?: number;
   feather?: number; // Soft edge blur amount
   invert?: boolean; // Invert the mask
   opacity?: number; // Mask opacity
}

export type MaskType = "shape" | "custom";

export interface MaskShape {
   type: ShapeType;
   properties: ShapeProperties;
}

export type ShapeType = 
   | "rectangle" 
   | "circle" 
   | "ellipse" 
   | "triangle" 
   | "star" 
   | "heart" 
   | "diamond" 
   | "hexagon" 
   | "arrow" 
   | "cloud"
   | "polygon";

export interface ShapeProperties {
   // Common properties
   cornerRadius?: number; // For rectangles
   // Star specific
   points?: number; // Number of star points
   innerRadius?: number; // Inner radius for stars
   // Polygon specific
   sides?: number; // Number of sides for polygon
   // Custom path
   path?: string; // SVG path string for custom shapes
}

export type ElementType = "image" | "text" | "drawing" | "sticker";
export type Element =
   | ImageElement
   | TextElement
   | DrawingElement
   | StickerElement;

export interface Page {
   id: number;
   elements: Element[];
   background: string;
   backgroundImage?: string;
   width: number;
   height: number;
   name?: string;
}

export interface Template {
   id: string;
   name: string;
   description?: string;
   elements: Element[];
   thumbnail?: string;
   category?: string;
}

export interface DragData {
   offsetX: number;
   offsetY: number;
   elementId: string;
}

export type Tool = "select" | "image" | "text" | "draw" | "sticker" | "crop" | "mask";

export interface PhotobookEditorState {
   currentPage: number;
   pages: Page[];
   selectedElement: Element | null;
   draggedElement: Element | null;
   tool: Tool;
   showTemplates: boolean;
   showGrid: boolean;
   snapToGrid: boolean;
   gridSize: number;
   zoom: number;
   history: PhotobookEditorState[];
   historyIndex: number;
}

export interface PhotobookProject {
   id: string;
   name: string;
   createdAt: Date;
   updatedAt: Date;
   pages: Page[];
   settings: ProjectSettings;
   metadata?: ProjectMetadata;
}

export interface ProjectSettings {
   pageWidth: number;
   pageHeight: number;
   defaultBackgroundColor: string;
   gridSize: number;
   snapToGrid: boolean;
   showGrid: boolean;
   quality: "low" | "medium" | "high";
}

export interface ProjectMetadata {
   author?: string;
   description?: string;
   tags?: string[];
   version?: string;
}

// Event Types
export interface ElementUpdateEvent {
   elementId: string;
   updates: Partial<Element>;
   pageIndex: number;
}

export interface PageUpdateEvent {
   pageId: number;
   updates: Partial<Page>;
}

// Validation Types
export interface ValidationError {
   field: string;
   message: string;
   code: string;
}

export interface ValidationResult {
   isValid: boolean;
   errors: ValidationError[];
}

// Export Types
export type ExportFormat = "pdf" | "png" | "jpg" | "json" | "html";

export interface ExportOptions {
   format: ExportFormat;
   quality?: number;
   includeMetadata?: boolean;
   pageRange?: {
      start: number;
      end: number;
   };
}

// Component Props Types
export interface PhotobookEditorProps {
   initialPages?: Page[];
   projectSettings?: ProjectSettings;
   onSave?: (pages: Page[]) => void;
   onExport?: (pages: Page[], options: ExportOptions) => void;
   onError?: (error: Error) => void;
   readonly?: boolean;
}

export interface ToolbarProps {
   tool: Tool;
   onToolChange: (tool: Tool) => void;
   onAddImage: () => void;
   onAddText: () => void;
   disabled?: boolean;
}

export interface PropertiesPanelProps {
   selectedElement: Element | null;
   onUpdateElement: (elementId: string, updates: Partial<Element>) => void;
   onDeleteElement: (elementId: string) => void;
}

export interface CanvasProps {
   page: Page;
   selectedElement: Element | null;
   draggedElement: Element | null;
   zoom: number;
   showGrid: boolean;
   gridSize: number;
   onElementSelect: (element: Element | null) => void;
   onElementUpdate: (elementId: string, updates: Partial<Element>) => void;
   onDragStart: (e: React.DragEvent<HTMLDivElement>, element: Element) => void;
   onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
   onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

// Utility Types
export type DeepPartial<T> = {
   [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
   Partial<Pick<T, K>>;

// Constants
export const ELEMENT_TYPES = ["image", "text"] as const;
export const TOOLS = ["select", "image", "text", "draw", "crop"] as const;
export const EXPORT_FORMATS = ["pdf", "png", "jpg", "json", "html"] as const;

// Default Values
export const DEFAULT_PAGE_SIZE: Size = {
   width: 500,
   height: 400,
};

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
   pageWidth: 500,
   pageHeight: 400,
   defaultBackgroundColor: "#ffffff",
   gridSize: 20,
   snapToGrid: false,
   showGrid: false,
   quality: "medium",
};

export const DEFAULT_ELEMENT_SIZE: Size = {
   width: 200,
   height: 150,
};

// Mask Shape Definitions
export const MASK_SHAPES: Record<ShapeType, { name: string; icon: string; path?: string }> = {
   rectangle: { name: "Rectangle", icon: "⬜" },
   circle: { name: "Circle", icon: "⭕" },
   ellipse: { name: "Ellipse", icon: "⭕" },
   triangle: { name: "Triangle", icon: "🔺" },
   star: { name: "Star", icon: "⭐" },
   heart: { name: "Heart", icon: "❤️" },
   diamond: { name: "Diamond", icon: "💎" },
   hexagon: { name: "Hexagon", icon: "⬡" },
   arrow: { name: "Arrow", icon: "➡️" },
   cloud: { name: "Cloud", icon: "☁️" },
   polygon: { name: "Polygon", icon: "⬟" }
};
