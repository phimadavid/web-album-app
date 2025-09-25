import React from "react";
import { PhotoSizeSelectorProps } from "../types/album.wizard.types";

const PHOTO_SIZE_OPTIONS = [
   {
      id: "small",
      label: "Small Photos",
      description: "Compact size for more photos per page",
      dimensions: "4x6 inches",
   },
   {
      id: "medium",
      label: "Medium Photos",
      description: "Balanced size for good detail and layout",
      dimensions: "5x7 inches",
   },
   {
      id: "large",
      label: "Large Photos",
      description: "Maximum detail and impact",
      dimensions: "8x10 inches",
   },
   {
      id: "mixed",
      label: "Mixed Sizes",
      description: "Variety of sizes for dynamic layouts",
      dimensions: "Various sizes",
   },
];

const PhotoSizeSelector: React.FC<PhotoSizeSelectorProps> = ({
   selected,
   onChange,
}) => {
   return (
      <div className="space-y-6">
         <h2 className="text-xl font-semibold">Select Photo Size</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PHOTO_SIZE_OPTIONS.map(size => (
               <button
                  key={size.id}
                  className={`p-6 border-2 rounded-lg transition-colors text-left
                            ${
                               selected === size.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-blue-200"
                            }`}
                  onClick={() => onChange({ size: size.id })}
               >
                  <div className="text-lg font-medium">{size.label}</div>
                  <div className="text-sm text-gray-600 mt-1">
                     {size.dimensions}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                     {size.description}
                  </div>
               </button>
            ))}
         </div>
      </div>
   );
};

export default PhotoSizeSelector;
