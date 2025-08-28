"use client";
import "react-image-crop/dist/ReactCrop.css";
import React from "react";

import { EnhancedFile } from "@/backend/types/image";
import { X } from "lucide-react";

interface EditableImageProps {
   file: EnhancedFile;
   index: number;
   handleRemoveImage: (index: number) => void;
   updateImageInState: (index: number, updatedFile: EnhancedFile) => void;
   disabled?: boolean;
}

const EditableImage: React.FC<EditableImageProps> = ({
   file,
   index,
   handleRemoveImage,
   disabled = false,
}) => {
   return (
      <div className="flex flex-col">
         <div className="flex flex-row justify-end space-x-4">
            <div className="relative aspect-square w-2/3">
               <div className="absolute inset-0 overflow-hidden">
                  <img
                     src={file.preview}
                     alt={`Uploaded ${index + 1}`}
                     className="absolute inset-0 w-full h-full object-contain rounded"
                  />
               </div>

               {!disabled && (
                  <button
                     onClick={() => handleRemoveImage(index)}
                     className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-opacity hover:bg-red-600"
                     aria-label="Remove image"
                  >
                     <X size={12} />
                  </button>
               )}
            </div>
         </div>
      </div>
   );
};

export default EditableImage;
