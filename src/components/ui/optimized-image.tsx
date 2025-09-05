"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
   src: string | undefined | null;
   alt: string;
   width?: number;
   height?: number;
   fill?: boolean;
   className?: string;
   style?: React.CSSProperties;
   sizes?: string;
   priority?: boolean;
   placeholder?: "blur" | "empty";
   blurDataURL?: string;
   onLoad?: () => void;
   onError?: () => void;
   objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
   src,
   alt,
   width,
   height,
   fill = false,
   className,
   style,
   sizes,
   priority = false,
   placeholder = "empty",
   blurDataURL,
   onLoad,
   onError,
   objectFit = "contain",
   ...props
}) => {
   const [imageError, setImageError] = useState(false);
   const [isLoading, setIsLoading] = useState(true);

   const handleLoad = () => {
      setIsLoading(false);
      onLoad?.();
   };

   const handleError = () => {
      setImageError(true);
      setIsLoading(false);
      onError?.();
   };

   // Use placeholder if src is empty or if there's an error
   const placeholderDataURL =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiPgogICAgSW1hZ2UgTG9hZGluZy4uLgogIDwvdGV4dD4KPC9zdmc+";
   const imageSrc = !src || imageError ? placeholderDataURL : src;

   const imageClassName = cn(
      objectFit === "contain" && "object-contain",
      objectFit === "cover" && "object-cover",
      objectFit === "fill" && "object-fill",
      objectFit === "none" && "object-none",
      objectFit === "scale-down" && "object-scale-down",
      className
   );

   return (
      <div className="relative">
         {isLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
               <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
         )}
         <Image
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            fill={fill}
            className={imageClassName}
            style={style}
            sizes={sizes}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
         />
      </div>
   );
};

export default OptimizedImage;
