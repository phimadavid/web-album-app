// src/components/album/CoverSelector.tsx
import React from "react";
import { ALBUM_OPTIONS } from "../album.wizard";
import { CoverSelectorProps } from "../types/album.wizard.types";

const CoverSelector: React.FC<CoverSelectorProps> = ({
   selected,
   onChange,
}) => {
   return (
      <div className="space-y-6">
         <h2 className="text-xl font-semibold">Choose Cover Type</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALBUM_OPTIONS.coverTypes.map(cover => (
               <button
                  key={cover.id}
                  className={`p-6 border-2 rounded-lg transition-colors
              ${
                 selected === cover.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
              }`}
                  onClick={() =>
                     onChange({
                        coverType: cover.id as
                           | "hard"
                           | "soft"
                           | "spiral"
                           | "premium",
                     })
                  }
               >
                  <div className="text-lg font-medium">{cover.label}</div>
                  <div className="mt-2 text-sm text-gray-500">
                     {getCoverDescription(cover.id)}
                  </div>
               </button>
            ))}
         </div>
      </div>
   );
};

// Helper function to get cover descriptions
function getCoverDescription(coverId: string): string {
   const descriptions: Record<string, string> = {
      hard: "Durable hardcover with premium finish",
      soft: "Flexible softcover with matte lamination",
      spiral: "Lay-flat spiral binding for easy viewing",
      premium: "Luxury leather-like material with debossing",
   };
   return descriptions[coverId] || "";
}

export default CoverSelector;
