"use client";

import "react-image-crop/dist/ReactCrop.css";
import React, { useState, useRef, useEffect } from "react";
import { EnhancedFile, Position } from "@/backend/types/image";
import {
   Edit,
   ZoomIn,
   ZoomOut,
   RotateCw,
   RotateCcw,
   Check,
   X,
   Save,
   Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import styles from "./image-editor.module.css";

interface ImageEditorProps {
   selectedImage: any | null;
   selectedImageIndex: number;
   onImageUpdate: (index: number, updatedImage: any) => void;
   onClose: () => void;
}

interface TextStyle {
   fontSize: string;
   color: string;
   fontFamily: string;
   fontWeight: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
   selectedImage,
   selectedImageIndex,
   onImageUpdate,
   onClose,
}) => {
   const [editMode, setEditMode] = useState<"text" | null>(null);
   const [textContent, setTextContent] = useState<string>("");
   const [textPosition, setTextPosition] = useState<Position>({
      x: 50,
      y: 50,
   });
   const [textStyle, setTextStyle] = useState<TextStyle>({
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontWeight: "normal",
   });
   const [autoResize, setAutoResize] = useState<boolean>(true);
   const [containerSize, setContainerSize] = useState<{
      width: number;
      height: number;
   }>({ width: 200, height: 80 });
   const [rotationAngle, setRotationAngle] = useState<number>(0);
   const [zoomLevel, setZoomLevel] = useState<number>(1.0);
   const [zoomPosition, setZoomPosition] = useState<Position>({
      x: 50,
      y: 50,
   });
   const [showZoomSaveButton, setShowZoomSaveButton] = useState<boolean>(false);
   const [textPositionPx, setTextPositionPx] = useState<Position>({
      x: 0,
      y: 0,
   });
   const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
   const [imageStartDragPoint, setImageStartDragPoint] = useState<Position>({
      x: 0,
      y: 0,
   });
   const [isTextDragging, setIsTextDragging] = useState<boolean>(false);
   const [isDragging, setIsDragging] = useState<boolean>(false);
   const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
   const [isGeneratingCaption, setIsGeneratingCaption] =
      useState<boolean>(false);
   const [generatedCaptions, setGeneratedCaptions] = useState<{
      short: string;
      long: string;
   } | null>(null);

   const imageContainerRef = useRef<HTMLDivElement>(null);
   const imgRef = useRef<HTMLImageElement>(null);
   const draggableTextRef = useRef<HTMLDivElement>(null);
   const imageWrapperRef = useRef<HTMLDivElement>(null);
   const textContentRef = useRef<HTMLDivElement>(null);

   // Constants
   const ZOOM_INCREMENT = 0.2;
   const MIN_ZOOM = 1.0;
   const MAX_ZOOM = 3.0;

   // Initialize state when selectedImage changes
   useEffect(() => {
      if (selectedImage) {
         // Parse text annotation
         let parsedTextAnnotation = null;
         if (selectedImage.metadata?.textAnnotation) {
            try {
               parsedTextAnnotation =
                  typeof selectedImage.metadata.textAnnotation === "string"
                     ? JSON.parse(selectedImage.metadata.textAnnotation)
                     : selectedImage.metadata.textAnnotation;
            } catch (error) {
               console.error("Error parsing textAnnotation:", error);
            }
         }

         setTextContent(parsedTextAnnotation?.textContent || "");
         setTextPosition(parsedTextAnnotation?.position || { x: 50, y: 50 });
         setTextStyle(
            parsedTextAnnotation?.style || {
               fontSize: "24px",
               color: "#ffffff",
               fontFamily: "Arial, sans-serif",
               fontWeight: "normal",
            }
         );
         setRotationAngle(selectedImage.metadata?.rotation || 0);
         setZoomLevel(selectedImage.metadata?.zoom || 1.0);
         setZoomPosition(
            selectedImage.metadata?.zoomPosition || { x: 50, y: 50 }
         );
         setShowZoomSaveButton(false);
      }
   }, [selectedImage]);

   // Text editing effects
   useEffect(() => {
      if (!editMode) {
         setIsTextDragging(false);
         setIsDragging(false);
      } else if (editMode === "text") {
         if (imageContainerRef.current && draggableTextRef.current) {
            const containerRect =
               imageContainerRef.current.getBoundingClientRect();
            const textRect = draggableTextRef.current.getBoundingClientRect();

            const centerX = (textPosition.x / 100) * containerRect.width;
            const centerY = (textPosition.y / 100) * containerRect.height;

            setTextPositionPx({
               x: centerX - textRect.width / 2,
               y: centerY - textRect.height / 2,
            });
         } else if (imageContainerRef.current) {
            const containerRect =
               imageContainerRef.current.getBoundingClientRect();
            setTextPositionPx({
               x: containerRect.width / 2,
               y: containerRect.height / 2,
            });
         }
      }
   }, [editMode, textPosition]);

   // Drag handlers for text
   const handleDragStart = (e: React.MouseEvent): void => {
      if (!draggableTextRef.current) return;
      e.preventDefault();
      setIsDragging(true);
      setIsTextDragging(true);

      const rect = draggableTextRef.current.getBoundingClientRect();
      setDragOffset({
         x: e.clientX - rect.left,
         y: e.clientY - rect.top,
      });
   };

   const handleDrag = (e: MouseEvent): void => {
      if (
         !isDragging ||
         !draggableTextRef.current ||
         !imageContainerRef.current
      )
         return;

      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const textRect = draggableTextRef.current.getBoundingClientRect();

      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      const maxX = containerRect.width - textRect.width;
      const maxY = containerRect.height - textRect.height;

      setTextPositionPx({
         x: Math.max(0, Math.min(newX, maxX)),
         y: Math.max(0, Math.min(newY, maxY)),
      });
   };

   const handleDragEnd = (): void => {
      setIsDragging(false);
      setIsTextDragging(false);
   };

   // Image drag handlers for zoom
   const handleImageDragStart = (e: React.MouseEvent): void => {
      if (zoomLevel <= 1.0) return;
      e.preventDefault();
      setIsDraggingImage(true);
      setImageStartDragPoint({ x: e.clientX, y: e.clientY });
   };

   const handleImageDrag = (e: MouseEvent): void => {
      if (!isDraggingImage || !imageWrapperRef.current) return;

      const deltaX = e.clientX - imageStartDragPoint.x;
      const deltaY = e.clientY - imageStartDragPoint.y;

      const containerRect = imageContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const deltaPercentX = (deltaX / containerRect.width) * 100;
      const deltaPercentY = (deltaY / containerRect.height) * 100;

      const sensitivity = 2;

      setZoomPosition({
         x: Math.max(
            0,
            Math.min(100, zoomPosition.x - deltaPercentX / sensitivity)
         ),
         y: Math.max(
            0,
            Math.min(100, zoomPosition.y - deltaPercentY / sensitivity)
         ),
      });

      setImageStartDragPoint({ x: e.clientX, y: e.clientY });
   };

   const handleImageDragEnd = (): void => {
      setIsDraggingImage(false);
      setShowZoomSaveButton(true);
   };

   // Event listeners setup
   useEffect(() => {
      if (editMode === "text") {
         document.addEventListener("mousemove", handleDrag);
         document.addEventListener("mouseup", handleDragEnd);

         return () => {
            document.removeEventListener("mousemove", handleDrag);
            document.removeEventListener("mouseup", handleDragEnd);
         };
      } else if (isDraggingImage) {
         document.addEventListener("mousemove", handleImageDrag);
         document.addEventListener("mouseup", handleImageDragEnd);

         return () => {
            document.removeEventListener("mousemove", handleImageDrag);
            document.removeEventListener("mouseup", handleImageDragEnd);
         };
      }
   }, [isDragging, isDraggingImage, editMode]);

   // Save functions
   const saveTextChanges = (): void => {
      if (!imageContainerRef.current || !draggableTextRef.current) return;

      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const textRect = draggableTextRef.current.getBoundingClientRect();

      const textCenterX = textPositionPx.x + textRect.width / 2;
      const textCenterY = textPositionPx.y + textRect.height / 2;

      const positionPercentage = {
         x: (textCenterX / containerRect.width) * 100,
         y: (textCenterY / containerRect.height) * 100,
      };

      const updatedImage = {
         ...selectedImage,
         metadata: {
            ...selectedImage.metadata,
            textAnnotation: {
               textContent,
               position: positionPercentage,
               style: textStyle,
            },
         },
      };

      onImageUpdate(selectedImageIndex, updatedImage);
      setEditMode(null);
   };

   const saveZoomedImage = (): void => {
      const updatedImage = {
         ...selectedImage,
         metadata: {
            ...selectedImage.metadata,
            zoom: zoomLevel,
            zoomPosition: zoomPosition,
         },
      };

      onImageUpdate(selectedImageIndex, updatedImage);
      setShowZoomSaveButton(false);
   };

   const handleZoomIn = (): void => {
      const newZoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_INCREMENT);

      if (zoomLevel === MIN_ZOOM && newZoomLevel > MIN_ZOOM) {
         setZoomPosition({ x: 50, y: 50 });
      }

      setZoomLevel(newZoomLevel);
      setShowZoomSaveButton(true);
   };

   const handleZoomOut = (): void => {
      const newZoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_INCREMENT);
      setZoomLevel(newZoomLevel);

      if (newZoomLevel === MIN_ZOOM) {
         setShowZoomSaveButton(false);
         setTimeout(() => {
            const updatedImage = {
               ...selectedImage,
               metadata: {
                  ...selectedImage.metadata,
                  zoom: MIN_ZOOM,
                  zoomPosition: { x: 50, y: 50 },
               },
            };
            onImageUpdate(selectedImageIndex, updatedImage);
         }, 0);
      } else {
         setShowZoomSaveButton(true);
      }
   };

   const handleRotateClockwise = (): void => {
      const newRotation = (rotationAngle + 90) % 360;
      setRotationAngle(newRotation);

      const updatedImage = {
         ...selectedImage,
         metadata: {
            ...selectedImage.metadata,
            rotation: newRotation,
         },
      };

      onImageUpdate(selectedImageIndex, updatedImage);
   };

   const handleRotateCounterClockwise = (): void => {
      const newRotation = (rotationAngle + 270) % 360;
      setRotationAngle(newRotation);

      const updatedImage = {
         ...selectedImage,
         metadata: {
            ...selectedImage.metadata,
            rotation: newRotation,
         },
      };

      onImageUpdate(selectedImageIndex, updatedImage);
   };

   const getImageStyle = () => {
      let style: React.CSSProperties = {};

      if (rotationAngle) {
         style.transform = `rotate(${rotationAngle}deg)`;
      }

      if (zoomLevel > 1.0) {
         style = {
            ...style,
            transform: `${style.transform ? style.transform : ""} scale(${zoomLevel})`,
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
         };
         style.objectFit = "cover";
      }

      return style;
   };

   // Mock function to simulate AI caption generation
   const generateMockCaptions = async (): Promise<{
      short: string;
      long: string;
   }> => {
      // Simulate API delay
      await new Promise(resolve =>
         setTimeout(resolve, 2000 + Math.random() * 3000)
      );

      // Mock captions
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
         "Happy times shared with loved ones, creating memories that warm our hearts for years to come.",
         "Life's joyful moments like these remind us to appreciate the beauty in everyday experiences.",
         "Sweet memories that capture the essence of love, laughter, and the bonds that matter most.",
      ];

      const randomShort =
         shortCaptions[Math.floor(Math.random() * shortCaptions.length)];
      const randomLong =
         longCaptions[Math.floor(Math.random() * longCaptions.length)];

      return {
         short: randomShort,
         long: randomLong,
      };
   };

   // Function to generate AI captions for the current image
   const generateCaption = async () => {
      if (!selectedImage) return;

      try {
         setIsGeneratingCaption(true);
         const captions = await generateMockCaptions();
         setGeneratedCaptions(captions);

         toast.success("Caption generated successfully!", {
            position: "bottom-right",
            autoClose: 2000,
         });
      } catch (error) {
         console.error("Error generating caption:", error);
         toast.error("Failed to generate caption. Please try again.", {
            position: "bottom-right",
            autoClose: 3000,
         });
      } finally {
         setIsGeneratingCaption(false);
      }
   };

   // Function to calculate optimal font size based on container size and text content
   const calculateOptimalFontSize = (
      text: string,
      containerWidth: number,
      containerHeight: number
   ): string => {
      if (!text || !containerWidth || !containerHeight) return "24px";

      // Create a temporary element to measure text
      const tempElement = document.createElement("div");
      tempElement.style.position = "absolute";
      tempElement.style.visibility = "hidden";
      tempElement.style.whiteSpace = "pre-wrap";
      tempElement.style.fontFamily = textStyle.fontFamily;
      tempElement.style.fontWeight = textStyle.fontWeight;
      tempElement.style.lineHeight = "1.4";
      tempElement.style.padding = "16px 24px"; // Account for padding
      tempElement.textContent = text;
      document.body.appendChild(tempElement);

      let fontSize = 8;
      let maxFontSize = 72;
      let optimalSize = fontSize;

      // Binary search for optimal font size
      while (fontSize <= maxFontSize) {
         tempElement.style.fontSize = `${fontSize}px`;
         tempElement.style.width = `${containerWidth - 24}px`; // Account for padding

         const textHeight = tempElement.scrollHeight;
         const textWidth = tempElement.scrollWidth;

         if (
            textHeight <= containerHeight - 24 &&
            textWidth <= containerWidth - 24
         ) {
            optimalSize = fontSize;
            fontSize += 2;
         } else {
            break;
         }
      }

      document.body.removeChild(tempElement);
      return `${Math.max(8, optimalSize)}px`;
   };

   // Auto-resize effect when container size or text content changes
   useEffect(() => {
      if (
         autoResize &&
         editMode === "text" &&
         textContent &&
         draggableTextRef.current
      ) {
         const container = draggableTextRef.current;
         const rect = container.getBoundingClientRect();

         if (rect.width > 0 && rect.height > 0) {
            const newFontSize = calculateOptimalFontSize(
               textContent,
               rect.width,
               rect.height
            );
            setTextStyle(prev => ({ ...prev, fontSize: newFontSize }));
         }
      }
   }, [textContent, containerSize, autoResize, editMode]);

   // ResizeObserver to track container size changes
   useEffect(() => {
      if (!draggableTextRef.current || editMode !== "text") return;

      const resizeObserver = new ResizeObserver(entries => {
         for (const entry of entries) {
            const { width, height } = entry.contentRect;
            setContainerSize({ width, height });

            if (autoResize && textContent) {
               const newFontSize = calculateOptimalFontSize(
                  textContent,
                  width,
                  height
               );
               setTextStyle(prev => ({
                  ...prev,
                  fontSize: newFontSize,
               }));
            }
         }
      });

      resizeObserver.observe(draggableTextRef.current);

      return () => {
         resizeObserver.disconnect();
      };
   }, [editMode, autoResize, textContent]);

   // Function to use generated caption as text content
   const useCaptionAsText = (captionText: string) => {
      setTextContent(captionText);
      setEditMode("text");
      toast.success("Caption added to text editor!", {
         position: "bottom-right",
         autoClose: 2000,
      });
   };

   if (!selectedImage) {
      return (
         <div className="p-4 text-center">
            <div className="text-gray-500 mb-4">
               <Edit size={48} className="mx-auto mb-2 opacity-50" />
               <p>Select an image from the slider to start editing</p>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full">
         {/* Header */}
         <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-800">Image Editor</h3>
            <button
               onClick={onClose}
               className="p-1 rounded-full hover:bg-gray-100"
            >
               <X size={16} />
            </button>
         </div>

         {/* Image Preview */}
         <div className="p-4">
            <div
               className="relative aspect-square w-full max-w-xs mx-auto"
               ref={imageContainerRef}
            >
               <div
                  ref={imageWrapperRef}
                  className="absolute inset-0 overflow-hidden rounded-lg"
                  onMouseDown={handleImageDragStart}
                  style={{
                     cursor: zoomLevel > 1.0 ? "move" : "default",
                  }}
               >
                  <img
                     ref={imgRef}
                     src={selectedImage.s3Url || selectedImage.preview}
                     alt={`Image ${selectedImageIndex + 1}`}
                     className="absolute inset-0 w-full h-full object-contain"
                     style={getImageStyle()}
                  />
               </div>

               {/* Text overlay */}
               {((editMode === "text" && textContent) ||
                  (selectedImage.metadata?.textAnnotation?.textContent &&
                     !editMode)) && (
                  <div
                     ref={draggableTextRef}
                     className={`absolute z-20 ${styles.resizableTextContainer} ${isTextDragging ? styles.dragging : ""}`}
                     style={{
                        left:
                           editMode === "text"
                              ? `${textPositionPx.x}px`
                              : `${textPosition.x}%`,
                        top:
                           editMode === "text"
                              ? `${textPositionPx.y}px`
                              : `${textPosition.y}%`,
                        transform:
                           editMode === "text"
                              ? "none"
                              : "translate(-50%, -50%)",
                        width: editMode === "text" ? "200px" : "auto",
                        height: editMode === "text" ? "80px" : "auto",
                        color: textStyle.color,
                        fontFamily: textStyle.fontFamily,
                        fontSize: textStyle.fontSize,
                        fontWeight: textStyle.fontWeight,
                        textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0px 0px 3px rgba(0,0,0,0.7)`,
                        backgroundColor: isTextDragging
                           ? "rgba(0, 123, 255, 0.6)"
                           : "rgba(0, 0, 0, 0.3)",
                        padding:
                           editMode === "text"
                              ? "20px 12px 8px 12px"
                              : "8px 12px",
                        borderRadius: "8px",
                        cursor: "default",
                     }}
                  >
                     {/* Drag handle - only visible in edit mode */}
                     {editMode === "text" && (
                        <div
                           onMouseDown={handleDragStart}
                           className="absolute top-0 left-0 right-0 h-4 bg-blue-500 bg-opacity-20 hover:bg-opacity-40 cursor-move rounded-t-lg flex items-center justify-center"
                           style={{ marginTop: "-2px" }}
                           title="Drag to move text"
                        >
                           <div className="text-xs text-white opacity-70">
                              ⋮⋮
                           </div>
                        </div>
                     )}

                     <div
                        className={`${styles.customScrollbar} ${styles.textOverlay}`}
                        style={{
                           height:
                              editMode === "text"
                                 ? "calc(100% - 12px)"
                                 : "100%",
                           overflow: "auto",
                           outline: "none",
                           cursor: editMode === "text" ? "text" : "default",
                        }}
                        contentEditable={editMode === "text"}
                        suppressContentEditableWarning={true}
                        onInput={e => {
                           if (editMode === "text") {
                              setTextContent(e.currentTarget.textContent || "");
                           }
                        }}
                        onBlur={e => {
                           if (editMode === "text") {
                              setTextContent(e.currentTarget.textContent || "");
                           }
                        }}
                        dangerouslySetInnerHTML={{
                           __html:
                              editMode === "text"
                                 ? textContent
                                 : selectedImage.metadata?.textAnnotation
                                      ?.textContent || "",
                        }}
                     />
                  </div>
               )}

               {/* Save zoom button */}
               {zoomLevel > 1.0 && showZoomSaveButton && (
                  <button
                     onClick={saveZoomedImage}
                     className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-md px-2 py-1 text-xs hover:bg-blue-600 shadow-md flex items-center"
                  >
                     <Check size={12} className="mr-1" />
                     <span>Save Zoom</span>
                  </button>
               )}
            </div>
         </div>

         {/* Editing Tools */}
         <div className="p-4 border-t">
            <div className="grid grid-cols-2 gap-2 mb-4">
               {/* Text editing */}
               <button
                  onClick={() =>
                     setEditMode(editMode === "text" ? null : "text")
                  }
                  className={`p-3 rounded-lg transition-colors flex flex-col items-center ${editMode === "text" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100 border"}`}
                  title="Add Text"
               >
                  <Edit size={20} className="mb-1" />
                  <span className="text-xs">Text</span>
               </button>

               {/* Zoom In */}
               <button
                  onClick={handleZoomIn}
                  className={`p-3 rounded-lg transition-colors flex flex-col items-center ${zoomLevel > 1.0 ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100 border"}`}
                  title="Zoom In"
                  disabled={zoomLevel >= MAX_ZOOM}
               >
                  <ZoomIn size={20} className="mb-1" />
                  <span className="text-xs">Zoom+</span>
               </button>

               {/* Zoom Out */}
               <button
                  onClick={handleZoomOut}
                  className={`p-3 rounded-lg transition-colors flex flex-col items-center ${zoomLevel > 1.0 ? "bg-blue-500 text-white" : "text-gray-400 border cursor-not-allowed"}`}
                  title="Zoom Out"
                  disabled={zoomLevel <= MIN_ZOOM}
               >
                  <ZoomOut size={20} className="mb-1" />
                  <span className="text-xs">Zoom-</span>
               </button>

               {/* Rotate Clockwise */}
               <button
                  onClick={handleRotateClockwise}
                  className="p-3 rounded-lg transition-colors flex flex-col items-center text-gray-700 hover:bg-gray-100 border"
                  title="Rotate 90° clockwise"
               >
                  <RotateCw size={20} className="mb-1" />
                  <span className="text-xs">Rotate</span>
               </button>
            </div>

            {/* Additional rotation button */}
            <button
               onClick={handleRotateCounterClockwise}
               className="w-full p-2 rounded-lg transition-colors flex items-center justify-center text-gray-700 hover:bg-gray-100 border mb-4"
               title="Rotate 90° counter-clockwise"
            >
               <RotateCcw size={16} className="mr-2" />
               <span className="text-sm">Rotate Counter-clockwise</span>
            </button>

            {/* AI Caption Generator */}
            <div className="border-t pt-4">
               <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <Sparkles size={16} className="mr-2 text-indigo-600" />
                  AI Caption Generator
               </h4>

               <button
                  onClick={generateCaption}
                  disabled={isGeneratingCaption}
                  className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center mb-3 ${
                     isGeneratingCaption
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
               >
                  {isGeneratingCaption ? (
                     <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-sm">Generating...</span>
                     </>
                  ) : (
                     <>
                        <Sparkles size={16} className="mr-2" />
                        <span className="text-sm">Generate Caption</span>
                     </>
                  )}
               </button>

               {/* Generated Captions Display */}
               {generatedCaptions && (
                  <div className="space-y-3">
                     <div
                        className={`bg-white border border-gray-200 rounded-lg p-3 ${styles.resizableCaption}`}
                     >
                        <div className="mb-2">
                           <div className="text-xs text-blue-600 font-medium mb-1 flex items-center">
                              Short Caption
                              <span className="ml-2 text-gray-400 text-xs">
                                 (Resizable)
                              </span>
                           </div>
                           <p className="text-sm text-gray-800 mb-2 break-words">
                              {generatedCaptions.short}
                           </p>
                           <button
                              onClick={() =>
                                 useCaptionAsText(generatedCaptions.short)
                              }
                              className="w-full px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                           >
                              Use as Text
                           </button>
                        </div>
                     </div>

                     <div
                        className={`bg-white border border-gray-200 rounded-lg p-3 ${styles.resizableCaption}`}
                     >
                        <div>
                           <div className="text-xs text-purple-600 font-medium mb-1 flex items-center">
                              Long Caption
                              <span className="ml-2 text-gray-400 text-xs">
                                 (Resizable)
                              </span>
                           </div>
                           <p className="text-sm text-gray-800 mb-2 leading-relaxed break-words">
                              {generatedCaptions.long}
                           </p>
                           <button
                              onClick={() =>
                                 useCaptionAsText(generatedCaptions.long)
                              }
                              className="w-full px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                           >
                              Use as Text
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* Text editing controls */}
         {editMode === "text" && (
            <div className="p-4 border-t bg-gray-50">
               <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">
                     Caption Text:
                  </label>
                  <textarea
                     value={textContent}
                     onChange={e => setTextContent(e.target.value)}
                     className="w-full px-3 py-2 text-sm border rounded-lg resize-y min-h-[60px] max-h-[120px]"
                     placeholder="Enter your caption text here..."
                     rows={3}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                     Characters: {textContent.length} | Words:{" "}
                     {
                        textContent
                           .trim()
                           .split(/\s+/)
                           .filter(word => word.length > 0).length
                     }
                  </div>
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                     💡 Tip: Drag the blue handle (⋮⋮) to move text, drag the ↘
                     corner to resize it, click text to edit
                  </div>
               </div>

               <div className="mb-3">
                  <label className="flex items-center text-xs text-gray-600">
                     <input
                        type="checkbox"
                        checked={autoResize}
                        onChange={e => setAutoResize(e.target.checked)}
                        className="mr-2"
                     />
                     Auto-resize text to fit container (like Canva)
                  </label>
                  <div className="text-xs text-gray-500 mt-1">
                     {autoResize
                        ? "Text size will automatically adjust when you resize the container"
                        : "Manual font size control enabled"}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                     <label className="block text-xs text-gray-600 mb-1">
                        Font Size:
                     </label>
                     <select
                        value={textStyle.fontSize}
                        onChange={e =>
                           setTextStyle({
                              ...textStyle,
                              fontSize: e.target.value,
                           })
                        }
                        className={`w-full text-xs px-2 py-1 rounded border ${autoResize ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        disabled={autoResize}
                     >
                        <option value="12px">Extra Small</option>
                        <option value="16px">Small</option>
                        <option value="20px">Medium</option>
                        <option value="24px">Large</option>
                        <option value="28px">Extra Large</option>
                     </select>
                     {autoResize && (
                        <div className="text-xs text-gray-400 mt-1">
                           Auto-calculated: {textStyle.fontSize}
                        </div>
                     )}
                  </div>
                  <div>
                     <label className="block text-xs text-gray-600 mb-1">
                        Font Weight:
                     </label>
                     <select
                        value={textStyle.fontWeight}
                        onChange={e =>
                           setTextStyle({
                              ...textStyle,
                              fontWeight: e.target.value,
                           })
                        }
                        className="w-full text-xs px-2 py-1 rounded border"
                     >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                     <label className="block text-xs text-gray-600 mb-1">
                        Font Family:
                     </label>
                     <select
                        value={textStyle.fontFamily}
                        onChange={e =>
                           setTextStyle({
                              ...textStyle,
                              fontFamily: e.target.value,
                           })
                        }
                        className="w-full text-xs px-2 py-1 rounded border"
                     >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Times New Roman', serif">
                           Times New Roman
                        </option>
                        <option value="'Courier New', monospace">
                           Courier New
                        </option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs text-gray-600 mb-1">
                        Text Color:
                     </label>
                     <input
                        type="color"
                        value={textStyle.color}
                        onChange={e =>
                           setTextStyle({
                              ...textStyle,
                              color: e.target.value,
                           })
                        }
                        className="w-full h-8 rounded border"
                     />
                  </div>
               </div>

               <div className="flex space-x-2">
                  <button
                     onClick={saveTextChanges}
                     className="flex-1 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                  >
                     <Check size={16} className="mr-1" />
                     <span>Save</span>
                  </button>
                  <button
                     onClick={() => setEditMode(null)}
                     className="flex-1 p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center justify-center"
                  >
                     <X size={16} className="mr-1" />
                     <span>Cancel</span>
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};

export default ImageEditor;
