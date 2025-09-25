import {
   Element,
   ImageElement,
   TextElement,
   DrawingElement,
   StickerElement,
   DrawingPath,
   Page,
   ValidationResult,
   ValidationError,
   Position,
   Size,
   Bounds,
   ElementType,
   MaskElement,
   MaskType,
   ShapeType,
   ShapeProperties,
} from "./types";

// Element validation functions
export const validateElement = (element: Element): ValidationResult => {
   const errors: ValidationError[] = [];

   // Validate common properties
   if (!element.id || element.id.trim() === "") {
      errors.push({
         field: "id",
         message: "Element ID is required",
         code: "ELEMENT_ID_REQUIRED",
      });
   }

   if (element.x < 0 || element.y < 0) {
      errors.push({
         field: "position",
         message: "Element position cannot be negative",
         code: "INVALID_POSITION",
      });
   }

   if (element.width <= 0 || element.height <= 0) {
      errors.push({
         field: "size",
         message: "Element size must be positive",
         code: "INVALID_SIZE",
      });
   }

   // Type-specific validation
   if (element.type === "image") {
      const imageElement = element as ImageElement;
      if (!imageElement.src || imageElement.src.trim() === "") {
         errors.push({
            field: "src",
            message: "Image source is required",
            code: "IMAGE_SRC_REQUIRED",
         });
      }
   } else if (element.type === "text") {
      const textElement = element as TextElement;
      if (!textElement.text || textElement.text.trim() === "") {
         errors.push({
            field: "text",
            message: "Text content is required",
            code: "TEXT_CONTENT_REQUIRED",
         });
      }

      if (
         textElement.fontSize &&
         (textElement.fontSize < 1 || textElement.fontSize > 200)
      ) {
         errors.push({
            field: "fontSize",
            message: "Font size must be between 1 and 200",
            code: "INVALID_FONT_SIZE",
         });
      }
   }

   return {
      isValid: errors.length === 0,
      errors,
   };
};

export const validatePage = (page: Page): ValidationResult => {
   const errors: ValidationError[] = [];

   if (!page.id) {
      errors.push({
         field: "id",
         message: "Page ID is required",
         code: "PAGE_ID_REQUIRED",
      });
   }

   if (page.width <= 0 || page.height <= 0) {
      errors.push({
         field: "dimensions",
         message: "Page dimensions must be positive",
         code: "INVALID_PAGE_DIMENSIONS",
      });
   }

   // Validate all elements on the page
   page.elements.forEach((element, index) => {
      const elementValidation = validateElement(element);
      if (!elementValidation.isValid) {
         elementValidation.errors.forEach(error => {
            errors.push({
               ...error,
               field: `elements[${index}].${error.field}`,
               message: `Element ${index}: ${error.message}`,
            });
         });
      }
   });

   return {
      isValid: errors.length === 0,
      errors,
   };
};

// Utility functions for element manipulation
export const generateElementId = (type: ElementType): string => {
   return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createImageElement = (
   position: Position,
   src: string,
   options?: Partial<ImageElement>
): ImageElement => {
   return {
      id: generateElementId("image"),
      type: "image",
      x: position.x,
      y: position.y,
      width: 200,
      height: 150,
      src,
      rotation: 0,
      ...options,
   };
};

export const createTextElement = (
   position: Position,
   text: string,
   options?: Partial<TextElement>
): TextElement => {
   return {
      id: generateElementId("text"),
      type: "text",
      x: position.x,
      y: position.y,
      width: 200,
      height: 40,
      text,
      fontSize: 16,
      color: "#333333",
      rotation: 0,
      ...options,
   };
};

export const createDrawingElement = (
   position: Position,
   paths: DrawingPath[] = [],
   options?: Partial<DrawingElement>
): DrawingElement => {
   return {
      id: generateElementId("drawing"),
      type: "drawing",
      x: position.x,
      y: position.y,
      width: 200,
      height: 150,
      paths,
      strokeColor: "#000000",
      strokeWidth: 2,
      rotation: 0,
      ...options,
   };
};

export const createStickerElement = (
   position: Position,
   stickerId: string,
   src: string,
   options?: Partial<StickerElement>
): StickerElement => {
   return {
      id: generateElementId("sticker"),
      type: "sticker",
      x: position.x,
      y: position.y,
      width: 100,
      height: 100,
      stickerId,
      src,
      rotation: 0,
      opacity: 1,
      ...options,
   };
};

export const createDrawingPath = (
   points: Position[],
   strokeColor: string = "#000000",
   strokeWidth: number = 2
): DrawingPath => {
   return {
      id: generateElementId("drawing"),
      points,
      strokeColor,
      strokeWidth,
   };
};

export const cloneElement = (element: Element): Element => {
   return {
      ...element,
      id: generateElementId(element.type),
      x: element.x + 10,
      y: element.y + 10,
   };
};

// Position and bounds utilities
export const isPointInBounds = (point: Position, bounds: Bounds): boolean => {
   return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
   );
};

export const getElementBounds = (element: Element): Bounds => {
   return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
   };
};

export const constrainToCanvas = (
   element: Element,
   canvasSize: Size
): Element => {
   return {
      ...element,
      x: Math.max(0, Math.min(element.x, canvasSize.width - element.width)),
      y: Math.max(0, Math.min(element.y, canvasSize.height - element.height)),
   };
};

// Grid snapping utilities
export const snapToGrid = (value: number, gridSize: number): number => {
   return Math.round(value / gridSize) * gridSize;
};

export const snapElementToGrid = (
   element: Element,
   gridSize: number
): Element => {
   return {
      ...element,
      x: snapToGrid(element.x, gridSize),
      y: snapToGrid(element.y, gridSize),
   };
};

// Transform utilities
export const rotateElement = (element: Element, angle: number): Element => {
   return {
      ...element,
      rotation: ((element.rotation || 0) + angle) % 360,
   };
};

export const scaleElement = (
   element: Element,
   scaleX: number,
   scaleY: number = scaleX
): Element => {
   return {
      ...element,
      width: Math.max(1, element.width * scaleX),
      height: Math.max(1, element.height * scaleY),
   };
};

export const moveElement = (
   element: Element,
   deltaX: number,
   deltaY: number
): Element => {
   return {
      ...element,
      x: element.x + deltaX,
      y: element.y + deltaY,
   };
};

// Collection utilities
export const findElementById = (
   elements: Element[],
   id: string
): Element | undefined => {
   return elements.find(element => element.id === id);
};

export const removeElementById = (
   elements: Element[],
   id: string
): Element[] => {
   return elements.filter(element => element.id !== id);
};

export const updateElementById = (
   elements: Element[],
   id: string,
   updates: Partial<Element>
): Element[] => {
   return elements.map(element => {
      if (element.id === id) {
         // Create a properly typed updated element
         if (element.type === "image") {
            return { ...element, ...updates } as ImageElement;
         } else {
            return { ...element, ...updates } as TextElement;
         }
      }
      return element;
   });
};

export const getElementsInArea = (
   elements: Element[],
   area: Bounds
): Element[] => {
   return elements.filter(element => {
      const elementBounds = getElementBounds(element);
      return (
         isPointInBounds({ x: elementBounds.x, y: elementBounds.y }, area) ||
         isPointInBounds(
            {
               x: elementBounds.x + elementBounds.width,
               y: elementBounds.y + elementBounds.height,
            },
            area
         )
      );
   });
};

// Sorting and layering
export const sortElementsByZIndex = (elements: Element[]): Element[] => {
   return [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
};

export const bringElementToFront = (
   elements: Element[],
   elementId: string
): Element[] => {
   const maxZIndex = Math.max(...elements.map(el => el.zIndex || 0));
   return updateElementById(elements, elementId, { zIndex: maxZIndex + 1 });
};

export const sendElementToBack = (
   elements: Element[],
   elementId: string
): Element[] => {
   const minZIndex = Math.min(...elements.map(el => el.zIndex || 0));
   return updateElementById(elements, elementId, { zIndex: minZIndex - 1 });
};

// Export utilities
export const serializeElement = (element: Element): string => {
   return JSON.stringify(element);
};

export const deserializeElement = (data: string): Element => {
   const parsed = JSON.parse(data);
   const validation = validateElement(parsed);

   if (!validation.isValid) {
      throw new Error(
         `Invalid element data: ${validation.errors.map(e => e.message).join(", ")}`
      );
   }

   return parsed;
};

export const exportPageAsJSON = (page: Page): string => {
   const validation = validatePage(page);

   if (!validation.isValid) {
      throw new Error(
         `Invalid page data: ${validation.errors.map(e => e.message).join(", ")}`
      );
   }

   return JSON.stringify(page, null, 2);
};

// Color utilities
export const isValidHexColor = (color: string): boolean => {
   return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

export const hexToRgb = (
   hex: string
): { r: number; g: number; b: number } | null => {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result
      ? {
           r: parseInt(result[1], 16),
           g: parseInt(result[2], 16),
           b: parseInt(result[3], 16),
        }
      : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
   return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Measurement utilities
export const distanceBetweenPoints = (p1: Position, p2: Position): number => {
   return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getElementCenter = (element: Element): Position => {
   return {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2,
   };
};

export const alignElements = (
   elements: Element[],
   alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
): Element[] => {
   if (elements.length < 2) return elements;

   let alignValue: number;

   switch (alignment) {
      case "left":
         alignValue = Math.min(...elements.map(el => el.x));
         return elements.map(el => ({ ...el, x: alignValue }));
      case "right":
         alignValue = Math.max(...elements.map(el => el.x + el.width));
         return elements.map(el => ({ ...el, x: alignValue - el.width }));
      case "center":
         alignValue =
            (Math.min(...elements.map(el => el.x)) +
               Math.max(...elements.map(el => el.x + el.width))) /
            2;
         return elements.map(el => ({ ...el, x: alignValue - el.width / 2 }));
      case "top":
         alignValue = Math.min(...elements.map(el => el.y));
         return elements.map(el => ({ ...el, y: alignValue }));
      case "bottom":
         alignValue = Math.max(...elements.map(el => el.y + el.height));
         return elements.map(el => ({ ...el, y: alignValue - el.height }));
      case "middle":
         alignValue =
            (Math.min(...elements.map(el => el.y)) +
               Math.max(...elements.map(el => el.y + el.height))) /
            2;
         return elements.map(el => ({ ...el, y: alignValue - el.height / 2 }));
      default:
         return elements;
   }
};

// Error handling utilities
export class PhotobookEditorError extends Error {
   constructor(
      message: string,
      public code: string,
      public details?: any
   ) {
      super(message);
      this.name = "PhotobookEditorError";
   }
}

export const handleError = (
   error: unknown,
   context: string
): PhotobookEditorError => {
   if (error instanceof PhotobookEditorError) {
      return error;
   }

   const message =
      error instanceof Error ? error.message : "Unknown error occurred";
   return new PhotobookEditorError(
      `${context}: ${message}`,
      "UNKNOWN_ERROR",
      error
   );
};

// Mask utilities
export const generateMaskId = (): string => {
   return `mask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createMaskElement = (
   shapeType: ShapeType,
   position: Position,
   size: Size,
   options?: Partial<MaskElement>
): MaskElement => {
   const shapeProperties: ShapeProperties = {};
   
   // Set default properties based on shape type
   switch (shapeType) {
      case 'star':
         shapeProperties.points = 5;
         shapeProperties.innerRadius = 0.4;
         break;
      case 'polygon':
         shapeProperties.sides = 6;
         break;
      case 'rectangle':
         shapeProperties.cornerRadius = 0;
         break;
   }

   return {
      id: generateMaskId(),
      type: "shape",
      shape: {
         type: shapeType,
         properties: shapeProperties
      },
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      rotation: 0,
      feather: 0,
      invert: false,
      opacity: 1,
      ...options,
   };
};

export const generateShapePath = (shapeType: ShapeType, width: number, height: number, properties?: ShapeProperties): string => {
   const cx = width / 2;
   const cy = height / 2;
   const rx = width / 2;
   const ry = height / 2;

   switch (shapeType) {
      case 'rectangle':
         const cornerRadius = properties?.cornerRadius || 0;
         if (cornerRadius > 0) {
            return `M ${cornerRadius} 0 L ${width - cornerRadius} 0 Q ${width} 0 ${width} ${cornerRadius} L ${width} ${height - cornerRadius} Q ${width} ${height} ${width - cornerRadius} ${height} L ${cornerRadius} ${height} Q 0 ${height} 0 ${height - cornerRadius} L 0 ${cornerRadius} Q 0 0 ${cornerRadius} 0 Z`;
         }
         return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;

      case 'circle':
         return `M ${cx} 0 A ${rx} ${ry} 0 1 1 ${cx} ${height} A ${rx} ${ry} 0 1 1 ${cx} 0 Z`;

      case 'ellipse':
         return `M ${cx} 0 A ${rx} ${ry} 0 1 1 ${cx} ${height} A ${rx} ${ry} 0 1 1 ${cx} 0 Z`;

      case 'triangle':
         return `M ${cx} 0 L ${width} ${height} L 0 ${height} Z`;

      case 'star':
         const points = properties?.points || 5;
         const innerRadius = properties?.innerRadius || 0.4;
         const outerRadius = Math.min(rx, ry);
         const innerR = outerRadius * innerRadius;
         let path = '';
         
         for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerR;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
         }
         return path + ' Z';

      case 'heart':
         const heartWidth = width * 0.8;
         const heartHeight = height * 0.8;
         const heartX = (width - heartWidth) / 2;
         const heartY = (height - heartHeight) / 2 + heartHeight * 0.1;
         return `M ${heartX + heartWidth/2} ${heartY + heartHeight * 0.3} C ${heartX + heartWidth/2} ${heartY + heartHeight * 0.1} ${heartX + heartWidth * 0.1} ${heartY} ${heartX + heartWidth * 0.1} ${heartY + heartHeight * 0.25} C ${heartX + heartWidth * 0.1} ${heartY + heartHeight * 0.4} ${heartX + heartWidth/2} ${heartY + heartHeight * 0.6} ${heartX + heartWidth/2} ${heartY + heartHeight} C ${heartX + heartWidth/2} ${heartY + heartHeight * 0.6} ${heartX + heartWidth * 0.9} ${heartY + heartHeight * 0.4} ${heartX + heartWidth * 0.9} ${heartY + heartHeight * 0.25} C ${heartX + heartWidth * 0.9} ${heartY} ${heartX + heartWidth/2} ${heartY + heartHeight * 0.1} ${heartX + heartWidth/2} ${heartY + heartHeight * 0.3} Z`;

      case 'diamond':
         return `M ${cx} 0 L ${width} ${cy} L ${cx} ${height} L 0 ${cy} Z`;

      case 'hexagon':
         const hexRadius = Math.min(rx, ry);
         let hexPath = '';
         for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = cx + Math.cos(angle) * hexRadius;
            const y = cy + Math.sin(angle) * hexRadius;
            hexPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
         }
         return hexPath + ' Z';

      case 'arrow':
         const arrowWidth = width * 0.8;
         const arrowHeight = height * 0.6;
         const arrowX = (width - arrowWidth) / 2;
         const arrowY = (height - arrowHeight) / 2;
         return `M ${arrowX} ${arrowY + arrowHeight/3} L ${arrowX + arrowWidth * 0.6} ${arrowY + arrowHeight/3} L ${arrowX + arrowWidth * 0.6} ${arrowY} L ${arrowX + arrowWidth} ${arrowY + arrowHeight/2} L ${arrowX + arrowWidth * 0.6} ${arrowY + arrowHeight} L ${arrowX + arrowWidth * 0.6} ${arrowY + arrowHeight * 2/3} L ${arrowX} ${arrowY + arrowHeight * 2/3} Z`;

      case 'cloud':
         const cloudWidth = width * 0.9;
         const cloudHeight = height * 0.7;
         const cloudX = (width - cloudWidth) / 2;
         const cloudY = (height - cloudHeight) / 2 + cloudHeight * 0.2;
         return `M ${cloudX + cloudWidth * 0.2} ${cloudY + cloudHeight * 0.6} C ${cloudX + cloudWidth * 0.1} ${cloudY + cloudHeight * 0.6} ${cloudX} ${cloudY + cloudHeight * 0.4} ${cloudX + cloudWidth * 0.1} ${cloudY + cloudHeight * 0.3} C ${cloudX + cloudWidth * 0.1} ${cloudY + cloudHeight * 0.1} ${cloudX + cloudWidth * 0.3} ${cloudY} ${cloudX + cloudWidth * 0.4} ${cloudY + cloudHeight * 0.1} C ${cloudX + cloudWidth * 0.5} ${cloudY} ${cloudX + cloudWidth * 0.7} ${cloudY + cloudHeight * 0.05} ${cloudX + cloudWidth * 0.8} ${cloudY + cloudHeight * 0.2} C ${cloudX + cloudWidth * 0.95} ${cloudY + cloudHeight * 0.15} ${cloudX + cloudWidth} ${cloudY + cloudHeight * 0.35} ${cloudX + cloudWidth * 0.9} ${cloudY + cloudHeight * 0.5} C ${cloudX + cloudWidth * 0.95} ${cloudY + cloudHeight * 0.6} ${cloudX + cloudWidth * 0.8} ${cloudY + cloudHeight * 0.7} ${cloudX + cloudWidth * 0.7} ${cloudY + cloudHeight * 0.6} Z`;

      case 'polygon':
         const sides = properties?.sides || 6;
         const polyRadius = Math.min(rx, ry);
         let polyPath = '';
         for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const x = cx + Math.cos(angle) * polyRadius;
            const y = cy + Math.sin(angle) * polyRadius;
            polyPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
         }
         return polyPath + ' Z';

      default:
         return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
   }
};

export const applyMaskToImage = (imageElement: ImageElement, mask: MaskElement): ImageElement => {
   return {
      ...imageElement,
      mask: mask
   };
};

export const removeMaskFromImage = (imageElement: ImageElement): ImageElement => {
   const { mask, ...elementWithoutMask } = imageElement;
   return elementWithoutMask;
};

export const updateMask = (imageElement: ImageElement, maskUpdates: Partial<MaskElement>): ImageElement => {
   if (!imageElement.mask) return imageElement;
   
   return {
      ...imageElement,
      mask: {
         ...imageElement.mask,
         ...maskUpdates
      }
   };
};
