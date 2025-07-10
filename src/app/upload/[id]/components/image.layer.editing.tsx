import 'react-image-crop/dist/ReactCrop.css';
import React, { useState, useRef, useEffect } from "react";

import { EnhancedFile, Position } from '@/backend/types/image';
import { Edit, ZoomIn, ZoomOut, RotateCw, RotateCcw, Check, X } from "lucide-react";

interface EditableImageProps {
    file: EnhancedFile;
    index: number;
    handleRemoveImage: (index: number) => void;
    updateImageInState: (index: number, updatedFile: EnhancedFile) => void;
    disabled?: boolean;
}

interface TextStyle {
    fontSize: string;
    color: string;
    fontFamily: string;
    fontWeight: string;
}

const EditableImage: React.FC<EditableImageProps> = ({
    file,
    index,
    handleRemoveImage,
    updateImageInState,
    disabled = false
}) => {

    const [editMode, setEditMode] = useState<'text' | null>(null);
    const [textContent, setTextContent] = useState<string>(file.metadata?.textAnnotation?.textContent || "");
    const [textPosition, setTextPosition] = useState<Position>({
        x: file.metadata?.textAnnotation?.position?.x || 50,
        y: file.metadata?.textAnnotation?.position?.y || 50
    });
    const [textStyle, setTextStyle] = useState<TextStyle>(file.metadata?.textAnnotation?.style || {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal'
    });
    const [rotationAngle, setRotationAngle] = useState<number>(file.metadata?.rotation || 0);
    const [zoomLevel, setZoomLevel] = useState<number>(file.metadata?.zoom || 1.0);
    const [zoomPosition, setZoomPosition] = useState<Position>({
        x: file.metadata?.zoomPosition?.x || 50,
        y: file.metadata?.zoomPosition?.y || 50
    });
    const [showZoomSaveButton, setShowZoomSaveButton] = useState<boolean>(false);
    const [textPositionPx, setTextPositionPx] = useState<Position>({
        x: 0,
        y: 0
    });
    const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
    const [imageStartDragPoint, setImageStartDragPoint] = useState<Position>({ x: 0, y: 0 });
    const [isTextDragging, setIsTextDragging] = useState<boolean>(false);

    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const draggableTextRef = useRef<HTMLDivElement>(null);
    const imageWrapperRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

    // Default zoom increment value
    const ZOOM_INCREMENT = 0.2;
    // Min and max zoom levels
    const MIN_ZOOM = 1.0;
    const MAX_ZOOM = 3.0;

    useEffect(() => {
        if (!editMode) {
            // When exiting edit mode, reset to metadata values
            setTextPosition({
                x: file.metadata?.textAnnotation?.position?.x || 50,
                y: file.metadata?.textAnnotation?.position?.y || 50
            });
            setTextContent(file.metadata?.textAnnotation?.textContent || "");
            // Reset dragging states
            setIsTextDragging(false);
            setIsDragging(false);
        } else if (editMode === 'text') {
            // When entering text edit mode, initialize the pixel position
            if (imageContainerRef.current && draggableTextRef.current && file.metadata?.textAnnotation?.position) {
                const containerRect = imageContainerRef.current.getBoundingClientRect();
                const textRect = draggableTextRef.current.getBoundingClientRect();

                // Calculate position from center percentage to top-left pixel coordinates
                const centerX = (file.metadata.textAnnotation.position.x / 100) * containerRect.width;
                const centerY = (file.metadata.textAnnotation.position.y / 100) * containerRect.height;

                // Convert center position to top-left position
                setTextPositionPx({
                    x: centerX - (textRect.width / 2),
                    y: centerY - (textRect.height / 2)
                });
            } else if (imageContainerRef.current) {
                // If no metadata position, default to center
                const containerRect = imageContainerRef.current.getBoundingClientRect();
                setTextPositionPx({
                    x: containerRect.width / 2,
                    y: containerRect.height / 2
                });
            }

            // Set text content from metadata
            setTextContent(file.metadata?.textAnnotation?.textContent || "");
        }
    }, [editMode, file.metadata]);

    const handleDragStart = (e: React.MouseEvent): void => {
        if (!draggableTextRef.current) return;
        e.preventDefault();
        setIsDragging(true);
        setIsTextDragging(true); // Set this to true when starting drag

        const rect = draggableTextRef.current.getBoundingClientRect();

        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleDrag = (e: MouseEvent): void => {
        if (!isDragging || !draggableTextRef.current || !imageContainerRef.current) return;

        const containerRect = imageContainerRef.current.getBoundingClientRect();
        const textRect = draggableTextRef.current.getBoundingClientRect();

        // Calculate new position
        const newX = e.clientX - containerRect.left - dragOffset.x;
        const newY = e.clientY - containerRect.top - dragOffset.y;

        // Calculate bounds to keep text within container
        const maxX = containerRect.width - textRect.width;
        const maxY = containerRect.height - textRect.height;

        // Set with boundary constraints
        setTextPositionPx({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
        });
    };

    const handleDragEnd = (): void => {
        setIsDragging(false);
        setIsTextDragging(false); // Reset when drag ends
    };

    // Zoom image drag handlers
    const handleImageDragStart = (e: React.MouseEvent): void => {
        if (zoomLevel <= 1.0) return;
        e.preventDefault();
        setIsDraggingImage(true);
        setImageStartDragPoint({ x: e.clientX, y: e.clientY });
    };

    const handleImageDrag = (e: MouseEvent): void => {
        if (!isDraggingImage || !imageWrapperRef.current) return;

        // Calculate the movement delta
        const deltaX = e.clientX - imageStartDragPoint.x;
        const deltaY = e.clientY - imageStartDragPoint.y;

        // Convert delta to percentage of container
        const containerRect = imageContainerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const deltaPercentX = (deltaX / containerRect.width) * 100;
        const deltaPercentY = (deltaY / containerRect.height) * 100;

        // Update the position, accounting for the zoom level (higher zoom = more movement)
        // The divisor here controls how sensitive the dragging is
        const sensitivity = 2; // Higher number = less sensitive

        setZoomPosition({
            x: Math.max(0, Math.min(100, zoomPosition.x - deltaPercentX / sensitivity)),
            y: Math.max(0, Math.min(100, zoomPosition.y - deltaPercentY / sensitivity))
        });

        // Reset start point for next calculation
        setImageStartDragPoint({ x: e.clientX, y: e.clientY });
    };

    const handleImageDragEnd = (): void => {
        setIsDraggingImage(false);
        // Show save button after dragging ends instead of auto-saving
        setShowZoomSaveButton(true);
    };

    // Setup and cleanup drag event listeners
    useEffect(() => {
        if (editMode === 'text') {
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);

            return () => {
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', handleDragEnd);
            };
        } else if (isDraggingImage) {
            document.addEventListener('mousemove', handleImageDrag);
            document.addEventListener('mouseup', handleImageDragEnd);

            return () => {
                document.removeEventListener('mousemove', handleImageDrag);
                document.removeEventListener('mouseup', handleImageDragEnd);
            };
        }
    }, [isDragging, isDraggingImage, editMode]);

    // Updated saveTextChanges function
    const saveTextChanges = (): void => {
        if (!imageContainerRef.current || !draggableTextRef.current) return;

        const containerRect = imageContainerRef.current.getBoundingClientRect();
        const textRect = draggableTextRef.current.getBoundingClientRect();

        // Calculate the center point of the text element
        const textCenterX = textPositionPx.x + (textRect.width / 2);
        const textCenterY = textPositionPx.y + (textRect.height / 2);

        // Convert the center position to percentages of container dimensions
        const positionPercentage = {
            x: (textCenterX / containerRect.width) * 100,
            y: (textCenterY / containerRect.height) * 100
        };

        // Create updated file with new text annotation
        const updatedFile = {
            ...file,
            metadata: {
                ...file.metadata,
                textAnnotation: {
                    textContent,
                    position: positionPercentage,
                    style: textStyle
                }
            }
        };

        // Update in parent component
        updateImageInState(index, updatedFile);
        setEditMode(null);
    };

    const saveZoomedImage = (): void => {
        // Save zoom level and position to metadata
        const updatedFile = {
            ...file,
            metadata: {
                ...file.metadata,
                zoom: zoomLevel,
                zoomPosition: zoomPosition
            }
        };

        // Update in parent component
        updateImageInState(index, updatedFile);

        // Hide the save button after saving
        setShowZoomSaveButton(false);
    };

    // Function to handle zoom in
    const handleZoomIn = (): void => {
        // Increment zoom level by ZOOM_INCREMENT
        const newZoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_INCREMENT);

        // If we're going from no zoom to zoom, set position to center
        if (zoomLevel === MIN_ZOOM && newZoomLevel > MIN_ZOOM) {
            setZoomPosition({ x: 50, y: 50 });
        }

        setZoomLevel(newZoomLevel);
        // Show save button when changing zoom level
        setShowZoomSaveButton(true);
    };

    // Function to handle zoom out
    const handleZoomOut = (): void => {
        // Decrement zoom level by ZOOM_INCREMENT
        const newZoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_INCREMENT);

        setZoomLevel(newZoomLevel);

        // If we're resetting to min zoom, hide save button and save immediately
        if (newZoomLevel === MIN_ZOOM) {
            setShowZoomSaveButton(false);
            // Save zoom reset immediately
            setTimeout(() => {
                const updatedFile = {
                    ...file,
                    metadata: {
                        ...file.metadata,
                        zoom: MIN_ZOOM,
                        zoomPosition: { x: 50, y: 50 }
                    }
                };
                updateImageInState(index, updatedFile);
            }, 0);
        } else {
            // Show save button when changing zoom level
            setShowZoomSaveButton(true);
        }
    };

    // Function to handle clockwise rotation
    const handleRotateClockwise = (): void => {
        // Increment rotation by 90 degrees
        const newRotation = (rotationAngle + 90) % 360;
        setRotationAngle(newRotation);

        // Immediately save the rotation
        const updatedFile = {
            ...file,
            metadata: {
                ...file.metadata,
                rotation: newRotation
            }
        };

        // Update in parent component
        updateImageInState(index, updatedFile);
    };

    // Function to handle counter-clockwise rotation
    const handleRotateCounterClockwise = (): void => {
        // Decrement rotation by 90 degrees (add 270 to ensure positive value)
        const newRotation = (rotationAngle + 270) % 360;
        setRotationAngle(newRotation);

        // Immediately save the rotation
        const updatedFile = {
            ...file,
            metadata: {
                ...file.metadata,
                rotation: newRotation
            }
        };

        // Update in parent component
        updateImageInState(index, updatedFile);
    };

    // Calculate image style based on zoom level and position
    const getImageStyle = () => {
        let style: React.CSSProperties = {};

        // Apply rotation if defined in metadata
        if (rotationAngle) {
            style.transform = `rotate(${rotationAngle}deg)`;
        }

        // Apply zoom if zoom level > 1.0
        if (zoomLevel > 1.0) {
            // Apply transform to scale and position the image
            style = {
                ...style,
                transform: `${style.transform ? style.transform : ''} scale(${zoomLevel})`,
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            };
            style.objectFit = 'cover';
        }

        return style;
    };


    return (
        <div className="flex flex-col">
            {/* Main container with image and controls */}
            <div className="flex flex-row justify-end space-x-4">
                {/* Image Container - Left side */}
                <div className="relative aspect-square w-2/3" ref={imageContainerRef}>
                    {/* Main image display */}
                    <div
                        ref={imageWrapperRef}
                        className="absolute inset-0 overflow-hidden"
                        onMouseDown={handleImageDragStart}
                        style={{ cursor: zoomLevel > 1.0 ? 'move' : 'default' }}
                    >
                        <img
                            ref={imgRef}
                            src={file.preview}
                            alt={`Uploaded ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-contain rounded"
                            style={getImageStyle()}
                        />
                    </div>

                    {/* Text overlay when in text edit mode or when text exists */}
                    {((editMode === 'text' && textContent) ||
                        (file.metadata?.textAnnotation?.textContent && !editMode)) && (
                            <div
                                ref={draggableTextRef}
                                onMouseDown={editMode === 'text' ? handleDragStart : undefined}
                                className={`absolute ${isTextDragging ? 'ring-2 ring-blue-500' : ''} cursor-${editMode === 'text' ? 'move' : 'default'} p-2 inline-block z-20`}
                                style={{
                                    left: editMode === 'text'
                                        ? `${textPositionPx.x}px`
                                        : `${textPosition.x}%`,
                                    top: editMode === 'text'
                                        ? `${textPositionPx.y}px`
                                        : `${textPosition.y}%`,
                                    transform: editMode === 'text' ? 'none' : 'translate(-50%, -50%)',
                                    maxWidth: '80%',
                                    color: textStyle.color,
                                    fontFamily: textStyle.fontFamily,
                                    fontSize: textStyle.fontSize,
                                    fontWeight: textStyle.fontWeight,
                                    textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0px 0px 3px rgba(0,0,0,0.7)`,
                                    backgroundColor: isTextDragging ? 'rgba(0, 123, 255, 0.6)' : 'transparent',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                }}
                            >
                                {editMode === 'text' ? textContent : file.metadata?.textAnnotation?.textContent}
                            </div>
                        )}


                    {/* Remove button - minimal and unobtrusive */}
                    {!editMode && !disabled && (
                        <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-opacity hover:bg-red-600"
                            aria-label="Remove image"
                        >
                            <X size={12} />
                        </button>
                    )}

                    {/* Save zoom button in the bottom right corner - only visible when needed */}
                    {zoomLevel > 1.0 && showZoomSaveButton && (
                        <button
                            onClick={saveZoomedImage}
                            className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-md px-2 py-1 text-xs transition-opacity hover:bg-blue-600 shadow-md flex items-center"
                            aria-label="Save zoom settings"
                            title="Save zoom settings"
                        >
                            <Check size={12} className="mr-1" />
                            <span>Save Zoom</span>
                        </button>
                    )}
                </div>

                {/* Editor Controls - Right side */}
                <div className="w-[60px] bg-white">
                    {/* Editing tools */}
                    <div className="p-2">
                        <div className="flex flex-col gap-2 place-items-center">
                            {/* Text editing */}
                            <button
                                onClick={() => setEditMode(editMode === 'text' ? null : 'text')}
                                className={`p-2 rounded transition-colors flex items-center ${editMode === 'text' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100 border'}`}
                                title="Add Text"
                                aria-label="Add text"
                            >
                                <Edit size={16} className="mr-1" />
                            </button>

                            {/* Zoom In */}
                            <button
                                onClick={handleZoomIn}
                                className={`p-2 rounded transition-colors flex items-center ${zoomLevel > 1.0 ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100 border'}`}
                                title="Zoom In"
                                aria-label="Zoom In"
                                disabled={zoomLevel >= MAX_ZOOM}
                            >
                                <ZoomIn size={16} className="mr-1" />
                            </button>

                            {/* Zoom Out - only enabled when zoomed in */}
                            <button
                                onClick={handleZoomOut}
                                className={`p-2 rounded transition-colors flex items-center ${zoomLevel > 1.0 ? 'bg-blue-500 text-white' : 'text-gray-400 border cursor-not-allowed'}`}
                                title="Zoom Out"
                                aria-label="Zoom Out"
                                disabled={zoomLevel <= MIN_ZOOM}
                            >
                                <ZoomOut size={16} className="mr-1" />
                            </button>

                            {/* Rotate Clockwise */}
                            <button
                                onClick={handleRotateClockwise}
                                className="p-2 rounded transition-colors flex items-center text-gray-700 hover:bg-gray-100 border"
                                title="Rotate 90° clockwise"
                                aria-label="Rotate clockwise"
                            >
                                <RotateCw size={16} className="mr-1" />
                            </button>

                            {/* Rotate Counter-clockwise */}
                            <button
                                onClick={handleRotateCounterClockwise}
                                className="p-2 rounded transition-colors flex items-center text-gray-700 hover:bg-gray-100 border"
                                title="Rotate 90° counter-clockwise"
                                aria-label="Rotate counter-clockwise"
                            >
                                <RotateCcw size={16} className="mr-1" />
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {/* Text editing controls panel at the bottom - only visible in text edit mode */}
            {editMode === 'text' && (
                <div className="mt-2 w-[67%] bg-white bg-opacity-90 p-3 border shadow-md rounded-md">
                    <input
                        type="text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="w-full mb-3 px-2 py-1.5 text-sm border rounded"
                        placeholder="Enter text..."
                    />

                    <div className='flex flex-wrap'>
                        <div><label className="text-xs text-gray-600">Size:</label></div>
                        <div><label className="text-xs text-gray-600">Weight:</label></div>
                        <div><label className="text-xs text-gray-600">Color:</label></div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                            <select
                                value={textStyle.fontSize}
                                onChange={(e) => setTextStyle({ ...textStyle, fontSize: e.target.value })}
                                className="text-xs px-2 py-1 rounded border"
                                aria-label="Font size"
                            >
                                <option value="16px">S</option>
                                <option value="24px">M</option>
                                <option value="32px">L</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <select
                                value={textStyle.fontWeight}
                                onChange={(e) => setTextStyle({ ...textStyle, fontWeight: e.target.value })}
                                className="text-xs px-2 py-1 rounded border"
                                aria-label="Font weight"
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <input
                                type="color"
                                value={textStyle.color}
                                onChange={(e) => setTextStyle({ ...textStyle, color: e.target.value })}
                                className="w-8 h-6 rounded border"
                                aria-label="Text color"
                            />
                        </div>
                    </div>

                    {/* Save button for text edits */}
                    <div className="mt-4 flex space-x-2">
                        <button
                            onClick={saveTextChanges}
                            className="flex-1 p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center justify-center"
                            aria-label="Save changes"
                            title="Save changes"
                        >
                            <Check size={16} className="mr-1" />
                            <span>Save</span>
                        </button>
                        <button
                            onClick={() => setEditMode(null)}
                            className="flex-1 p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center justify-center"
                            aria-label="Cancel"
                            title="Cancel"
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

export default EditableImage;
