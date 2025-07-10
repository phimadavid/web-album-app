"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Crop, RotateCw, Trash, Book } from "lucide-react";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface AlbumImage {
  id: string;
  filename: string;
  mimeType: string;
}

interface Album {
  AlbumImages: AlbumImage[];
}

export default function SuccessPage({ params }: { params: { id: string } }) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<any>(null);
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textStyle, setTextStyle] = useState({
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal'
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const draggableTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textModalOpen && draggableTextRef.current) {
      // Wait for the image to load completely
      const timer = setTimeout(() => {
        const containerRect = draggableTextRef.current?.parentElement?.getBoundingClientRect();
        if (!containerRect) return;

        // Convert percentage to pixels based on container size
        setTextPosition({
          x: (textPosition.x / 100) * containerRect.width,
          y: (textPosition.y / 100) * containerRect.height
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [textModalOpen, draggableTextRef.current]);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(`/api/album/${params.id}/images`);
        if (!response.ok) {
          throw new Error("Failed to fetch album details");
        }
        const data = await response.json();
        const imagesArray = Array.isArray(data) ? data : Object.values(data);
        setAlbum({ AlbumImages: imagesArray });
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [params.id]);

  // Text editing function
  const handleEditText = async (imageId: string) => {
    try {
      // Find current image
      const image = album?.AlbumImages.find(img => img.id === imageId);
      if (!image) return;

      // Fetch any existing text annotations
      const response = await fetch(`/api/images/${imageId}/annotations`);
      if (response.ok) {
        const data = await response.json();

        // Set text content
        setTextContent(data.textContent || "");

        // Set position if available, otherwise use default
        if (data.position) {
          // We'll need to convert percentage back to pixels when the modal loads
          // This will be handled in a useEffect that runs when the modal opens
          setTextPosition({
            x: data.position.x || 50,
            y: data.position.y || 50
          });
        } else {
          setTextPosition({ x: 50, y: 50 });
        }

        // Set style if available, otherwise use default
        if (data.style) {
          setTextStyle({
            fontSize: data.style.fontSize || '24px',
            color: data.style.color || '#ffffff',
            fontFamily: data.style.fontFamily || 'Arial, sans-serif',
            fontWeight: data.style.fontWeight || 'normal'
          });
        } else {
          setTextStyle({
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal'
          });
        }
      } else {
        // Reset to defaults for new text
        setTextContent("");
        setTextPosition({ x: 50, y: 50 });
        setTextStyle({
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal'
        });
      }

      // Set current image and open modal
      setCurrentImage(imageId);
      setTextModalOpen(true);
    } catch (error) {
      console.error("Error fetching text annotations:", error);
    }
  };

  // Save text annotations
  const saveTextAnnotation = async () => {
    if (!currentImage) return;

    setIsProcessing(true);
    try {
      // Get the container dimensions for calculating percentage positions
      const containerRect = draggableTextRef.current?.parentElement?.getBoundingClientRect();
      if (!containerRect) throw new Error("Container not found");

      // Calculate position as percentages instead of pixels for responsiveness
      const positionPercentage = {
        x: (textPosition.x / containerRect.width) * 100,
        y: (textPosition.y / containerRect.height) * 100
      };

      const response = await fetch(`/api/images/${currentImage}/annotations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          textContent,
          albumId: params.id,
          position: positionPercentage, // Store position as percentage
          style: textStyle
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save text annotations");
      }

      // Close modal and reset state
      setTextModalOpen(false);
      setCurrentImage(null);
      setTextContent("");
      setTextPosition({ x: 50, y: 50 });
      setTextStyle({
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal'
      });
    } catch (error) {
      console.error("Error saving text annotations:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Image editing function (crop)
  const handleImageEdit = (imageId: string, editType: string) => {
    const image = album?.AlbumImages.find(img => img.id === imageId);
    if (!image) return;

    setCurrentImage(imageId);

    if (editType === 'crop') {
      setCurrentImageSrc(`/api/image/${encodeURIComponent(image.filename)}`);
      setCropperOpen(true);
    } else if (editType === 'rotate') {
      setRotateDialogOpen(true);
    }
  };

  // Handle image load for cropper
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;

    const { width, height } = e.currentTarget;

    // Set initial crop to center 80% of the image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // Set to desired aspect ratio (1 for square)
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
  };

  // Get cropped image as canvas
  const generateCroppedImage = () => {
    if (!imgRef.current || !completedCrop || !previewCanvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    // Set canvas dimensions to match the cropped area
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    // Draw the cropped image onto the canvas
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return canvas.toDataURL('image/jpeg');
  };

  // Save cropped image
  const saveCroppedImage = async () => {
    if (!currentImage) return;

    setIsProcessing(true);
    try {
      // Generate the cropped image data URL
      const croppedImageData = generateCroppedImage();

      if (!croppedImageData) {
        throw new Error("Failed to generate cropped image");
      }

      // Convert base64 to blob for upload
      const response = await fetch(croppedImageData);
      const blob = await response.blob();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", blob, "cropped-image.jpg");
      formData.append("originalImageId", currentImage);
      formData.append("albumId", params.id);
      formData.append("editType", "crop");

      const saveResponse = await fetch("/api/images/edit", {
        method: "POST",
        body: formData,
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save cropped image");
      }

      // Update album with new image data
      const updatedImageData = await saveResponse.json();

      // Update local state with new image
      if (album) {
        const updatedImages = album.AlbumImages.map(img =>
          img.id === currentImage ? { ...img, filename: updatedImageData.filename } : img
        );
        setAlbum({ AlbumImages: updatedImages });
      }

      // Close cropper
      setCropperOpen(false);
      setCurrentImage(null);
      setCurrentImageSrc("");
    } catch (error) {
      console.error("Error saving cropped image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save rotated image
  const saveRotatedImage = async () => {
    if (!currentImage) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/images/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: currentImage,
          albumId: params.id,
          editType: "rotate",
          rotationAngle
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rotated image");
      }

      // Update album with new image data
      const updatedImageData = await response.json();

      // Update local state with new image
      if (album) {
        const updatedImages = album.AlbumImages.map(img =>
          img.id === currentImage ? { ...img, filename: updatedImageData.filename } : img
        );
        setAlbum({ AlbumImages: updatedImages });
      }

      // Close rotation dialog
      setRotateDialogOpen(false);
      setCurrentImage(null);
      setRotationAngle(0);
    } catch (error) {
      console.error("Error saving rotated image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete image function
  const handleDeleteImage = (imageId: string) => {
    setCurrentImage(imageId);
    setDeleteConfirmOpen(true);
  };

  // Confirm and process image deletion
  const confirmDeleteImage = async () => {
    if (!currentImage) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/images/${currentImage}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          albumId: params.id
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Update local state by removing the deleted image
      if (album) {
        const updatedImages = album.AlbumImages.filter(img => img.id !== currentImage);
        setAlbum({ AlbumImages: updatedImages });
      }

      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      setCurrentImage(null);
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Binding/cover function
  const handleBindingCover = async (imageId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/albums/${params.id}/cover`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set cover image");
      }

      // Show success message or update UI
      alert("Cover image set successfully!");
    } catch (error) {
      console.error("Error setting cover image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add these functions for drag and drop functionality
  const handleDragStart = (e: React.MouseEvent) => {
    if (!draggableTextRef.current) return;

    setIsDragging(true);

    const rect = draggableTextRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    // Add event listeners for drag and drop
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;

    const containerRect = draggableTextRef.current?.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate new position within container bounds
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;

    // Update position
    setTextPosition({
      x: Math.max(0, Math.min(newX, containerRect.width - (draggableTextRef.current?.offsetWidth || 0))),
      y: Math.max(0, Math.min(newY, containerRect.height - (draggableTextRef.current?.offsetHeight || 0)))
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);

    // Remove event listeners
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-xl font-medium mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-medium mb-2">Album not found</h2>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="container mx-auto mb-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-medium mb-6 text-end">
            Your Album Images
          </h1>

          <div className="bg-blue-50 rounded-lg border border-blue-200 mb-6 overflow-hidden">
            <div className="bg-blue-500 text-white py-2 px-4 text-end">
              <span className="font-medium">Editing Instructions</span>
            </div>

            <div className="p-4 text-end">
              <div className="flex place-content-end items-end space-x-3 mb-3">
                <div>
                  <p className="font-medium text-blue-800">Hover over any image to reveal editing tools</p>
                  <p className="text-sm text-blue-600 mt-1">Move your cursor over an image to access text, crop, rotate, delete and binding options</p>
                </div>
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
              </div>


              <div className="text-sm text-gray-600 mt-3 ml-10">
                <p>Click on any tool icon to start editing your image</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {album.AlbumImages.map((image) => (
            <div
              key={image.id}
              className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group"
            >
              <Image
                src={`/api/image/${encodeURIComponent(image.filename)}`}
                alt={image.filename}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
                priority={false}
              />

              {/* Inline editing toolbar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex justify-center items-center">
                <div className="flex space-x-3">
                  {/* Text editing */}
                  <button
                    onClick={() => handleEditText(image.id)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Text"
                    disabled={isProcessing}
                  >
                    <Edit size={18} className="text-gray-700" />
                  </button>

                  {/* Crop/Edit */}
                  <button
                    onClick={() => handleImageEdit(image.id, 'crop')}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Edit"
                    disabled={isProcessing}
                  >
                    <Crop size={18} className="text-gray-700" />
                  </button>

                  {/* Rotate */}
                  <button
                    onClick={() => handleImageEdit(image.id, 'rotate')}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Rotate"
                    disabled={isProcessing}
                  >
                    <RotateCw size={18} className="text-gray-700" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Delete"
                    disabled={isProcessing}
                  >
                    <Trash size={18} className="text-red-600" />
                  </button>

                  {/* Binding/Cover */}
                  <button
                    onClick={() => handleBindingCover(image.id)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Binding/Cover"
                    disabled={isProcessing}
                  >
                    <Book size={18} className="text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-8 max-w-3xl mx-auto">
        <Link
          href={`/album-design-system/${params.id}`}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <button >
            Setup Album
          </button>

        </Link>

      </div>

      {/* Text Editing Modal */}
      {textModalOpen && currentImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4">
            <h3 className="text-lg font-medium mb-4">Add Text to Image</h3>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Text Input Panel */}
              <div className="w-full md:w-1/3">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-3 h-24"
                    placeholder="Enter text to add to your image..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={textStyle.fontSize}
                      onChange={(e) => setTextStyle({ ...textStyle, fontSize: e.target.value })}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="16px">Small</option>
                      <option value="24px">Medium</option>
                      <option value="32px">Large</option>
                      <option value="48px">X-Large</option>
                    </select>

                    <input
                      type="color"
                      value={textStyle.color}
                      onChange={(e) => setTextStyle({ ...textStyle, color: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-1 h-10"
                    />

                    <select
                      value={textStyle.fontFamily}
                      onChange={(e) => setTextStyle({ ...textStyle, fontFamily: e.target.value })}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="Arial, sans-serif">Sans-serif</option>
                      <option value="Times New Roman, serif">Serif</option>
                      <option value="Courier New, monospace">Monospace</option>
                      <option value="Comic Sans MS, cursive">Cursive</option>
                    </select>

                    <select
                      value={textStyle.fontWeight}
                      onChange={(e) => setTextStyle({ ...textStyle, fontWeight: e.target.value })}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p>Drag the text to position it on the image.</p>
                  <p>Use the controls above to customize the text appearance.</p>
                </div>
              </div>

              {/* Image Preview with Draggable Text */}
              <div className="w-full md:w-2/3 relative bg-gray-200 border border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {/* The image */}
                {currentImage && album?.AlbumImages.find(img => img.id === currentImage) && (
                  <div className="relative w-full h-full">
                    <img
                      src={`/api/image/${encodeURIComponent(album.AlbumImages.find(img => img.id === currentImage)?.filename || '')}`}
                      alt="Image preview"
                      className="w-full h-full object-contain"
                    />

                    {/* Draggable text overlay */}
                    {textContent && (
                      <div
                        ref={draggableTextRef}
                        className="absolute cursor-move p-2 inline-block"
                        style={{
                          left: `${textPosition.x}px`,
                          top: `${textPosition.y}px`,
                          color: textStyle.color,
                          fontFamily: textStyle.fontFamily,
                          fontSize: textStyle.fontSize,
                          fontWeight: textStyle.fontWeight,
                          textShadow: '0px 0px 2px rgba(0,0,0,0.5)'
                        }}
                        onMouseDown={handleDragStart}
                      >
                        {textContent}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setTextModalOpen(false);
                  setCurrentImage(null);
                  setTextContent("");
                  setTextPosition({ x: 50, y: 50 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={saveTextAnnotation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isProcessing || !textContent.trim()}
              >
                {isProcessing ? "Saving..." : "Save Text"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropping Modal */}
      {cropperOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4">
            <h3 className="text-lg font-medium mb-4">Crop Image</h3>
            <div className="mb-4 bg-gray-100 flex flex-col items-center justify-center">
              <div className="relative max-h-96 max-w-full overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1} // Set to desired aspect ratio (1 for square)
                >
                  {currentImageSrc && (
                    <img
                      ref={imgRef}
                      src={currentImageSrc}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      className="max-w-full"
                      crossOrigin="anonymous"
                    />
                  )}
                </ReactCrop>
              </div>

              {/* Hidden canvas for crop preview */}
              <div className="hidden">
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    display: 'none',
                    width: Math.round(completedCrop?.width ?? 0),
                    height: Math.round(completedCrop?.height ?? 0)
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCropperOpen(false);
                  setCurrentImage(null);
                  setCurrentImageSrc("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={saveCroppedImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isProcessing || !completedCrop?.width || !completedCrop?.height}
              >
                {isProcessing ? "Processing..." : "Save Cropped Image"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotation Dialog with Image Preview */}
      {rotateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl mx-4">
            <h3 className="text-lg font-medium mb-4">Rotate Image</h3>

            {/* Image preview and rotation controls */}
            <div className="flex flex-col items-center mb-6">
              {/* Image preview with rotation */}
              <div className="relative w-full h-64 bg-gray-100 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {currentImage && album?.AlbumImages.find(img => img.id === currentImage) && (
                  <img
                    src={`/api/image/${encodeURIComponent(album.AlbumImages.find(img => img.id === currentImage)?.filename || '')}`}
                    alt="Rotation preview"
                    className="max-h-full max-w-full object-contain transition-transform duration-300"
                    style={{ transform: `rotate(${rotationAngle}deg)` }}
                  />
                )}
              </div>

              {/* Rotation controls */}
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={() => setRotationAngle((prev) => prev - 90)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center space-x-1"
                >
                  <RotateCw size={18} className="transform -scale-x-100" />
                  <span>-90°</span>
                </button>

                <div className="text-center px-4">
                  <span className="text-lg font-medium">{rotationAngle}°</span>
                </div>

                <button
                  onClick={() => setRotationAngle((prev) => prev + 90)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center space-x-1"
                >
                  <RotateCw size={18} />
                  <span>+90°</span>
                </button>
              </div>
            </div>

            {/* Fine-tune rotation slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fine-tune rotation</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setRotationAngle((prev) => prev - 1)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  -1°
                </button>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                  className="flex-1 h-4"
                />
                <button
                  onClick={() => setRotationAngle((prev) => prev + 1)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  +1°
                </button>
              </div>
            </div>

            {/* Reset button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setRotationAngle(0)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Reset to 0°
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRotateDialogOpen(false);
                  setCurrentImage(null);
                  setRotationAngle(0);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={saveRotatedImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Save Rotation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this image? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setCurrentImage(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteImage}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isProcessing}
              >
                {isProcessing ? "Deleting..." : "Delete Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
