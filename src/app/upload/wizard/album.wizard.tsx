"use client";
import React, { useState } from "react";
import { AlbumWizardData, AlbumWizardProps } from "./types/album.wizard.types";

export const ALBUM_OPTIONS = {
   formats: [
      { id: "square", label: "Square", dimensions: ["20x20", "30x30"] },
      {
         id: "rectangular",
         label: "Rectangular",
         dimensions: ["20x30", "25x35"],
      },
      {
         id: "panoramic",
         label: "Panoramic",
         dimensions: ["20x40", "30x60"],
      },
   ],
   coverTypes: [
      { id: "hard", label: "Hard Cover" },
      { id: "soft", label: "Soft Cover" },
      { id: "premium", label: "Premium Cover" },
   ],
   paperQualities: [
      { id: "matte", label: "Matte Finish" },
      { id: "glossy", label: "Glossy Finish" },
      { id: "premium", label: "Premium Quality" },
   ],
};

// Layout icon components
const SquareIcon = ({ isSelected }: { isSelected: boolean }) => (
   <div className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center mb-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
      <div className={`w-10 h-10 border-2 ${isSelected ? 'border-blue-500' : 'border-gray-400'
         }`}></div>
   </div>
);

const RectangleIcon = ({ isSelected }: { isSelected: boolean }) => (
   <div className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center mb-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
      <div className={`w-12 h-8 border-2 ${isSelected ? 'border-blue-500' : 'border-gray-400'
         }`}></div>
   </div>
);

const PanoramicIcon = ({ isSelected }: { isSelected: boolean }) => (
   <div className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center mb-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}>
      <div className={`w-14 h-6 border-2 ${isSelected ? 'border-blue-500' : 'border-gray-400'
         }`}></div>
   </div>
);

const getFormatIcon = (formatId: string, isSelected: boolean) => {
   switch (formatId) {
      case 'square':
         return <SquareIcon isSelected={isSelected} />;
      case 'rectangular':
         return <RectangleIcon isSelected={isSelected} />;
      case 'panoramic':
         return <PanoramicIcon isSelected={isSelected} />;
      default:
         return <SquareIcon isSelected={isSelected} />;
   }
};

const getCoverDescription = (coverId: string): string => {
   const descriptions: Record<string, string> = {
      hard: "Durable hardcover with premium finish",
      soft: "Flexible softcover with matte lamination",
      spiral: "Lay-flat spiral binding for easy viewing",
      premium: "Luxury leather-like material with debossing",
   };
   return descriptions[coverId] || "";
};

const getPaperDescription = (paperId: string): string => {
   const descriptions: Record<string, string> = {
      matte: "Non-reflective matte finish",
      glossy: "High-gloss reflective finish",
      premium: "Premium archival quality paper",
   };
   return descriptions[paperId] || "";
};

// Price calculation function
const calculatePrice = (
   pages: number,
   format: string,
   coverType: string,
   paperQuality: string
): string => {
   let basePrice = 29.99; // Base price for 24 pages
   
   // Additional pages cost (every 4 pages above 24)
   const additionalPages = Math.max(0, pages - 24);
   const additionalPagesCost = Math.ceil(additionalPages / 4) * 1.50;
   
   // Format pricing
   const formatPricing: Record<string, number> = {
      square: 0,
      rectangular: 2.00,
      panoramic: 5.00,
   };
   
   // Cover type pricing
   const coverPricing: Record<string, number> = {
      hard: 0,
      soft: -3.00,
      premium: 15.00,
   };
   
   // Paper quality pricing
   const paperPricing: Record<string, number> = {
      matte: 0,
      glossy: 3.00,
      premium: 8.00,
   };
   
   const totalPrice = basePrice + 
                     additionalPagesCost + 
                     (formatPricing[format] || 0) + 
                     (coverPricing[coverType] || 0) + 
                     (paperPricing[paperQuality] || 0);
   
   return totalPrice.toFixed(2);
};

const AlbumWizard: React.FC<AlbumWizardProps> = ({ onComplete, params }) => {
   const [albumData, setAlbumData] = useState<AlbumWizardData>({
      format: "square",
      dimensions: "20x20",
      coverType: "hard",
      paperQuality: "matte",
      albumId: params.id,
      pages: 24,
   });

   const updateAlbumData = (data: Partial<typeof albumData>) => {
      setAlbumData({ ...albumData, ...data });
   };

   const handleComplete = () => {
      onComplete(albumData);
   };

   return (
      <div className="p-6 space-y-8">
         <div  className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Album Format Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
               <h2 className="text-xl font-semibold mb-4 text-gray-800">Album Format</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {ALBUM_OPTIONS.formats.map(format => (
                     <div key={format.id} className="space-y-4">
                        <button
                           className={`w-full p-4 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${albumData.format === format.id
                              ? "border-blue-500 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-blue-200"
                              }`}
                           onClick={() =>
                              updateAlbumData({
                                 format: format.id as "square" | "rectangular" | "panoramic",
                                 dimensions: format.dimensions[0],
                              })
                           }
                        >
                           <div className="flex flex-col items-center">
                              {getFormatIcon(format.id, albumData.format === format.id)}
                              <div className="text-lg font-medium">{format.label}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                 Available sizes: {format.dimensions.join(", ")} cm
                              </div>
                           </div>
                        </button>

                        {albumData.format === format.id && (
                           <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                 Select Size
                              </label>
                              <select
                                 className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                 value={albumData.dimensions}
                                 onChange={e =>
                                    updateAlbumData({
                                       dimensions: e.target.value,
                                    })
                                 }
                              >
                                 {format.dimensions.map(dim => (
                                    <option key={dim} value={dim}>
                                       {dim} cm
                                    </option>
                                 ))}
                              </select>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            {/* Cover Type Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
               <h2 className="text-xl font-semibold mb-4 text-gray-800">Cover Type</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALBUM_OPTIONS.coverTypes.map(cover => (
                     <button
                        key={cover.id}
                        className={`p-4 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${albumData.coverType === cover.id
                           ? "border-blue-500 bg-blue-50 shadow-md"
                           : "border-gray-200 hover:border-blue-200"
                           }`}
                        onClick={() =>
                           updateAlbumData({
                              coverType: cover.id as "hard" | "soft" | "premium",
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

            {/* Paper Quality Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
               <h2 className="text-xl font-semibold mb-4 text-gray-800">Paper Quality</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ALBUM_OPTIONS.paperQualities.map(paper => (
                     <button
                        key={paper.id}
                        className={`p-4 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${albumData.paperQuality === paper.id
                           ? "border-blue-500 bg-blue-50 shadow-md"
                           : "border-gray-200 hover:border-blue-200"
                           }`}
                        onClick={() =>
                           updateAlbumData({
                              paperQuality: paper.id as "matte" | "glossy" | "premium",
                           })
                        }
                     >
                        <div className="text-lg font-medium">{paper.label}</div>
                        <div className="mt-2 text-sm text-gray-500">
                           {getPaperDescription(paper.id)}
                        </div>
                     </button>
                  ))}
               </div>
            </div>


            {/* Pages Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
               <h2 className="text-xl font-semibold mb-4 text-gray-800">Number of Pages</h2>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                     <div className="flex items-center space-x-4">
                        <button
                           onClick={() => updateAlbumData({ pages: Math.max(12, albumData.pages - 4) })}
                           className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                           disabled={albumData.pages <= 12}
                        >
                           <span className="text-xl font-bold">-</span>
                        </button>
                        <div className="text-center">
                           <div className="text-2xl font-bold text-gray-800">{albumData.pages}</div>
                           <div className="text-sm text-gray-500">pages</div>
                        </div>
                        <button
                           onClick={() => updateAlbumData({ pages: Math.min(100, albumData.pages + 4) })}
                           className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                           disabled={albumData.pages >= 100}
                        >
                           <span className="text-xl font-bold">+</span>
                        </button>
                     </div>
                     <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                           ${calculatePrice(albumData.pages, albumData.format, albumData.coverType, albumData.paperQuality)}
                        </div>
                        <div className="text-sm text-gray-500">Total Price</div>
                     </div>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                     <p><strong>Base price:</strong> $29.99 (24 pages)</p>
                     <p><strong>Additional pages:</strong> $1.50 per 4 pages</p>
                     <p><strong>Premium options:</strong> +$5-15 depending on selection</p>
                  </div>
               </div>
            </div>
            
         </div>
         {/* Complete Button */}
         <div className="flex justify-center pt-6">
            <button
               onClick={handleComplete}
               className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
               Create Album
            </button>
         </div>

      </div>
   );
};

export default AlbumWizard;
