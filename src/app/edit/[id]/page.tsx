"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ThreeDots } from "react-loader-spinner";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Save, Eye, BookOpen, X } from "lucide-react";

// Import the new PhotobookEditor
import PhotobookEditor from "@/app/editor-book/page";
import { Page, Element, ImageElement, ExportOptions } from "@/app/editor-book/types";
import { createImageElement, validateElement } from "@/app/editor-book/utils";

import { useAlbumData } from "@/backend/services/actions/getAlbums";
import {
   AlbumDataProps,
   BookAlbumPageProps,
} from "../data-types/types";

const BookAlbumPage = ({ params }: BookAlbumPageProps) => {
   const paramsId = params.id;

   const [isInitialized, setIsInitialized] = useState(false);
   const [editorPages, setEditorPages] = useState<Page[]>([]);
   const [isSaving, setIsSaving] = useState(false);
   const [showPreviewModal, setShowPreviewModal] = useState(false);
   const [isConverting, setIsConverting] = useState(false);

   const {
      albumData,
      error,
      isLoading,
      setAlbumData,
      handleSaveAlbumName,
   } = useAlbumData(params.id);

   // Convert album images to editor pages
   const convertAlbumToEditorPages = useCallback((albumData: AlbumDataProps): Page[] => {
      if (!albumData?.images || albumData.images.length === 0) {
         // Return default empty pages if no images
         return [
            { id: 1, elements: [], background: '#ffffff', width: 500, height: 400 },
            { id: 2, elements: [], background: '#ffffff', width: 500, height: 400 },
         ];
      }

      const pages: Page[] = [];
      const imagesPerPage = 2; // Adjust based on your layout preference
      
      // Create pages with images
      for (let i = 0; i < albumData.images.length; i += imagesPerPage) {
         const pageImages = albumData.images.slice(i, i + imagesPerPage);
         const elements: Element[] = [];

         pageImages.forEach((image, index) => {
            if (image?.s3Url) {
               try {
                  // Position images side by side or in a grid
                  const x = index === 0 ? 50 : 270;
                  const y = 50;
                  
                  const imageElement = createImageElement(
                     { x, y },
                     image.s3Url,
                     { 
                        width: 200, 
                        height: 150, 
                        rotation: image.metadata?.rotation || 0,
                        alt: `Image ${i + index + 1}`
                     }
                  );

                  const validation = validateElement(imageElement);
                  if (validation.isValid) {
                     elements.push(imageElement);
                  }
               } catch (error) {
                  console.error('Error creating image element:', error);
               }
            }
         });

         pages.push({
            id: Math.floor(i / imagesPerPage) + 1,
            elements,
            background: '#ffffff',
            width: 500,
            height: 400,
            name: `Page ${Math.floor(i / imagesPerPage) + 1}`
         });
      }

      // Ensure we have at least 2 pages
      if (pages.length === 0) {
         pages.push(
            { id: 1, elements: [], background: '#ffffff', width: 500, height: 400 },
            { id: 2, elements: [], background: '#ffffff', width: 500, height: 400 }
         );
      } else if (pages.length === 1) {
         pages.push({ id: 2, elements: [], background: '#ffffff', width: 500, height: 400 });
      }

      return pages;
   }, []);

   // Initialize editor pages when album data is loaded
   useEffect(() => {
      if (albumData && !isInitialized && !isLoading) {
         setIsConverting(true);
         try {
            const pages = convertAlbumToEditorPages(albumData);
            setEditorPages(pages);
            setIsInitialized(true);
         } catch (error) {
            console.error('Error converting album to editor pages:', error);
            toast.error('Failed to initialize editor');
         } finally {
            setIsConverting(false);
         }
      }
   }, [albumData, isInitialized, isLoading, convertAlbumToEditorPages]);

   // Handle save from editor
   const handleEditorSave = useCallback(async (pages: Page[]) => {
      setIsSaving(true);
      try {
         // Here you could save the editor pages to your backend
         // For now, we'll just save to localStorage and show success
         localStorage.setItem(`photobook-${paramsId}`, JSON.stringify(pages));
         
         setEditorPages(pages);
         
         toast.success("Photobook saved successfully!", {
            position: "bottom-right",
            autoClose: 2000,
         });
      } catch (error) {
         console.error("Error saving photobook:", error);
         toast.error("Failed to save photobook", {
            position: "bottom-right",
            autoClose: 2000,
         });
      } finally {
         setIsSaving(false);
      }
   }, [paramsId]);

   // Handle export from editor
   const handleEditorExport = useCallback(async (pages: Page[], options: ExportOptions) => {
      try {
         if (options.format === 'json') {
            const dataStr = JSON.stringify(pages, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `${albumData?.bookName || 'photobook'}-${Date.now()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            toast.success("Photobook exported successfully!", {
               position: "bottom-right",
               autoClose: 2000,
            });
         } else {
            toast.info(`Export format ${options.format} is not yet implemented`, {
               position: "bottom-right",
               autoClose: 3000,
            });
         }
      } catch (error) {
         console.error("Error exporting photobook:", error);
         toast.error("Failed to export photobook", {
            position: "bottom-right",
            autoClose: 2000,
         });
      }
   }, [albumData?.bookName]);

   // Loading state
   if (isLoading || isConverting) {
      return (
         <div className="flex flex-col h-screen items-center mt-32 justify-start w-full px-4">
            <div className="bg-white p-8 text-center place-items-center max-w-md mx-auto">
               <div>
                  <ThreeDots
                     color="#0000FF"
                     width="80"
                     visible={true}
                     aria-label="loading-indicator"
                  />
               </div>
               <h3 className="text-lg font-semibold text-gray-800 mt-4">
                  {isLoading ? "Loading album..." : "Initializing editor..."}
               </h3>
               <p className="text-sm text-gray-600 mt-2">
                  Please wait while we prepare your editing workspace...
               </p>
            </div>
         </div>
      );
   }

   // Error state
   if (error) {
      return (
         <div className="flex flex-col h-screen items-center mt-32 justify-start w-full px-4">
            <div className="bg-red-50 border border-red-200 p-8 text-center place-items-center max-w-md mx-auto rounded-lg">
               <h3 className="text-lg font-semibold text-red-800 mt-4">
                  Error Loading Album
               </h3>
               <p className="text-sm text-red-600 mt-2">
                  {error}
               </p>
               <Link 
                  href="/me/dashboard"
                  className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
               >
                  Back to Dashboard
               </Link>
            </div>
         </div>
      );
   }

   return (
      <div className="h-screen bg-gray-50 flex flex-col">
         {/* Header */}
         <div className="bg-white shadow-sm border-b flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
               <Link 
                  href="/me/dashboard"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
               >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
               </Link>
               <div className="border-l pl-4">
                  <h1 className="text-xl font-semibold text-gray-800">
                     {albumData?.bookName || "Photo Album"} - Editor
                  </h1>
                  <p className="text-sm text-gray-600">
                     {albumData?.images?.length || 0} images • {editorPages.length} pages
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
               >
                  <Eye className="w-4 h-4" />
                  Preview
               </button>
               
               <button
                  onClick={() => handleEditorSave(editorPages)}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                     isSaving
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
               >
                  {isSaving ? (
                     <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                     </>
                  ) : (
                     <>
                        <Save className="w-4 h-4" />
                        Save
                     </>
                  )}
               </button>
            </div>
         </div>

         {/* Editor */}
         <div className="flex-1 overflow-hidden">
            {isInitialized && editorPages.length > 0 ? (
               <PhotobookEditor
                  initialPages={editorPages}
                  onSave={handleEditorSave}
                  onExport={handleEditorExport}
               />
            ) : (
               <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                     <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No content to edit
                     </h3>
                     <p className="text-gray-500 mb-4">
                        Add some images to your album to start editing
                     </p>
                     <Link
                        href={`/upload/${paramsId}`}
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                        Add Images
                     </Link>
                  </div>
               </div>
            )}
         </div>

         {/* Preview Modal */}
         <AnimatePresence>
            {showPreviewModal && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
               >
                  <div
                     className="absolute inset-0 bg-black bg-opacity-50"
                     onClick={() => setShowPreviewModal(false)}
                  ></div>
                  <motion.div
                     className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden z-60"
                     initial={{ scale: 0.9, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.9, y: 20 }}
                     transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                     }}
                  >
                     {/* Modal Header */}
                     <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                           <BookOpen size={24} className="text-blue-600" />
                           <div>
                              <h3 className="text-lg font-semibold text-gray-800">
                                 Photobook Preview
                              </h3>
                              <p className="text-sm text-gray-600">
                                 {albumData?.bookName || "Photo Album"}
                              </p>
                           </div>
                        </div>
                        <button
                           onClick={() => setShowPreviewModal(false)}
                           className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                           aria-label="Close Preview"
                        >
                           <X size={24} className="text-gray-600" />
                        </button>
                     </div>

                     {/* Modal Content */}
                     <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {editorPages.map((page, index) => (
                              <div
                                 key={page.id}
                                 className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                              >
                                 <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                                    Page {index + 1}
                                 </div>
                                 <div
                                    className="relative"
                                    style={{
                                       width: '100%',
                                       height: '300px',
                                       backgroundColor: page.background
                                    }}
                                 >
                                    {page.elements.map((element) => (
                                       <div
                                          key={element.id}
                                          className="absolute"
                                          style={{
                                             left: `${(element.x / 500) * 100}%`,
                                             top: `${(element.y / 400) * 100}%`,
                                             width: `${(element.width / 500) * 100}%`,
                                             height: `${(element.height / 400) * 100}%`,
                                             transform: `rotate(${element.rotation || 0}deg)`
                                          }}
                                       >
                                          {element.type === 'image' ? (
                                             <img
                                                src={(element as ImageElement).src}
                                                alt={(element as ImageElement).alt || ""}
                                                className="w-full h-full object-cover border border-gray-300 rounded"
                                             />
                                          ) : (
                                             <div
                                                className="w-full h-full flex items-center justify-center text-center bg-transparent"
                                                style={{
                                                   fontSize: `${((element as any).fontSize || 16) * 0.8}px`,
                                                   color: (element as any).color || '#333333'
                                                }}
                                             >
                                                {(element as any).text}
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Modal Footer */}
                     <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                           {editorPages.length} pages in your photobook
                        </div>
                        <button
                           onClick={() => setShowPreviewModal(false)}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                           <Eye size={16} />
                           Close Preview
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default BookAlbumPage;
