"use client";
import React, { useState, useEffect } from "react";
import { Copy, Eye, ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Types and Interfaces
interface Page {
   id: number;
   content: PageContent;
}

interface PageContent {
   elements?: DesignElement[];
   background?: string;
   settings?: PageSettings;
}

interface DesignElement {
   id: string;
   type: "image" | "text" | "shape";
   properties: Record<string, unknown>;
}

interface PageSettings {
   layout: string;
   margin: number;
   background: string;
}

const AlbumOrganizer: React.FC = () => {
   // Use useEffect for initial state to avoid hydration issues
   const [isClient, setIsClient] = useState(false);
   const [pages, setPages] = useState<Page[]>([]);
   const [selectedPage, setSelectedPage] = useState<number | null>(null);
   const [previewMode, setPreviewMode] = useState<boolean>(false);
   const [draggedPage, setDraggedPage] = useState<number | null>(null);

   useEffect(() => {
      setIsClient(true);
   }, []);

   const toastOptions: ToastOptions = {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
   };

   const notify = {
      success: (msg: string) => toast.success(msg, toastOptions),
      error: (msg: string) => toast.error(msg, toastOptions),
      info: (msg: string) => toast.info(msg, toastOptions),
   };

   const handlePageReorder = (
      sourceIndex: number,
      targetIndex: number
   ): void => {
      if (sourceIndex !== targetIndex) {
         const newPages = [...pages];
         const [movedPage] = newPages.splice(sourceIndex, 1);
         newPages.splice(targetIndex, 0, movedPage);
         setPages(newPages);
         notify.success("Page order updated");
      }
   };

   const handlePageCopy = (index: number): void => {
      const newPages = [...pages];
      const pageCopy: Page = {
         ...pages[index],
         id: Date.now(),
         content: JSON.parse(JSON.stringify(pages[index].content)),
      };
      newPages.splice(index + 1, 0, pageCopy);
      setPages(newPages);
      notify.success("Page copied");
   };

   const handlePageDelete = (index: number): void => {
      const newPages = pages.filter((_, i) => i !== index);
      setPages(newPages);
      notify.info("Page deleted");
   };

   const handlePageAdd = (): void => {
      const newPage: Page = {
         id: Date.now(),
         content: {
            elements: [],
            background: "#ffffff",
            settings: {
               layout: "default",
               margin: 20,
               background: "#ffffff",
            },
         },
      };
      setPages([...pages, newPage]);
      notify.success("New page added");
   };

   // Only render page content on client side
   if (!isClient) {
      return (
         <div className="flex items-center justify-center h-screen">
            <div className="animate-pulse">Loading...</div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-screen bg-gray-50">
         {/* Top Toolbar */}
         <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center space-x-4 mb-6">
               <button
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() =>
                     setSelectedPage(
                        selectedPage !== null
                           ? Math.max(0, selectedPage - 1)
                           : 0
                     )
                  }
                  disabled={!selectedPage}
               >
                  <ArrowLeft className="w-5 h-5" />
               </button>

               <span className="text-sm">
                  Page {(selectedPage ?? 0) + 1} of {pages.length || 1}
               </span>

               <button
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() =>
                     setSelectedPage(
                        selectedPage !== null
                           ? Math.min(pages.length - 1, selectedPage + 1)
                           : 0
                     )
                  }
                  disabled={selectedPage === pages.length - 1}
               >
                  <ArrowRight className="w-5 h-5" />
               </button>
            </div>

            <button
               className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
               onClick={() => setPreviewMode(true)}
            >
               <Eye className="w-4 h-4 mr-2" />
               Preview Album
            </button>
         </div>

         {/* Page Thumbnails */}
         <div className="flex-none h-64 border-b bg-white overflow-hidden">
            <div className="flex-1 overflow-x-auto">
               <div className="flex space-x-4 p-4 min-w-min">
                  {pages.map((page, index) => (
                     <div
                        key={page.id}
                        className={`relative w-32 h-44 bg-white border rounded-lg cursor-pointer 
                  ${
                     selectedPage === index
                        ? "border-blue-500 shadow-lg"
                        : "border-gray-200"
                  }
                  ${draggedPage === index ? "opacity-50" : "opacity-100"}`}
                        draggable
                        onDragStart={e => {
                           setDraggedPage(index);
                           e.dataTransfer.setData(
                              "text/plain",
                              index.toString()
                           );
                        }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                           e.preventDefault();
                           const sourceIndex = parseInt(
                              e.dataTransfer.getData("text/plain")
                           );
                           handlePageReorder(sourceIndex, index);
                           setDraggedPage(null);
                        }}
                        onClick={() => setSelectedPage(index)}
                     >
                        <div className="absolute top-2 right-2 flex space-x-1">
                           <button
                              className="p-1 bg-white rounded hover:bg-gray-100"
                              onClick={e => {
                                 e.stopPropagation();
                                 handlePageCopy(index);
                              }}
                           >
                              <Copy className="w-4 h-4" />
                           </button>
                           <button
                              className="p-1 bg-white rounded hover:bg-gray-100"
                              onClick={e => {
                                 e.stopPropagation();
                                 handlePageDelete(index);
                              }}
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>

                        <div className="absolute bottom-2 left-2 text-sm text-gray-500">
                           Page {index + 1}
                        </div>
                     </div>
                  ))}

                  <button
                     className="w-32 h-44 border-2 border-dashed border-gray-300 rounded-lg 
                flex items-center justify-center hover:border-blue-500 hover:bg-blue-50"
                     onClick={handlePageAdd}
                  >
                     <Plus className="w-6 h-6 text-gray-400" />
                  </button>
               </div>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 p-6">
            {selectedPage !== null && (
               <div className="bg-white rounded-lg shadow-lg h-full">
                  {/* Page content editor would go here */}
               </div>
            )}
         </div>

         {/* Preview Modal */}
         {previewMode && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
               <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-semibold">Album Preview</h3>
                     <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setPreviewMode(false)}
                     >
                        ×
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8 h-[calc(100%-4rem)] overflow-y-auto p-4">
                     {pages.map((page, index) => (
                        <div
                           key={page.id}
                           className="aspect-[3/4] bg-white border rounded-lg shadow-lg p-4"
                        >
                           <div className="text-sm text-gray-500 mb-2">
                              Page {index + 1}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AlbumOrganizer;
