import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Book3DProps {
  title?: string;
  author?: string;
  coverColor?: string;
  spineColor?: string;
  pageColor?: string;
  coverImage?: string;
}

const Book3D: React.FC<Book3DProps> = ({
  title = "Sample Book",
  author = "Author Name",
  coverColor = "#2563eb",
  spineColor = "#1d4ed8",
  pageColor = "#f8fafc",
  coverImage = null,
}) => {
  const rotation: number = 25;

  return (
    <div className="perspective-1000 w-70 h-96">
      <motion.div
        className="relative w-full h-full"
        initial={{ rotateY: rotation }}
        animate={{
          rotateY: rotation,
          rotateX: 10,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front Cover */}
        <motion.div
          className="absolute inset-0 rounded shadow-lg overflow-hidden"
          style={{
            backgroundColor: coverColor,
            transform: "translateZ(12px)",
          }}
        >
          {coverImage ? (
            <div className="relative w-full h-full">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 256px) 100vw, 256px"
                priority
              />
              {/* Overlay for text readability */}
              <div className="absolute inset-0 bg-black/30 p-6 flex flex-col justify-between">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-white/80">{author}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col justify-between h-full">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-white/80">{author}</p>
            </div>
          )}
        </motion.div>

        {/* Back Cover */}
        <div
          className="absolute inset-0 rounded"
          style={{
            backgroundColor: coverColor,
            transform: "translateZ(-30px) rotateY(180deg)",
          }}
        />

        {/* Spine */}
        <div
          className="absolute h-full w-6 rounded-l"
          style={{
            backgroundColor: spineColor,
            transform: "rotateY(-85deg)",
            transformOrigin: "right",
            left: -25,
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            <span className="text-white text-sm">{title}</span>
          </div>
        </div>

        {/* Pages */}
        <div
          className="absolute inset-0 rounded-r"
          style={{
            backgroundColor: pageColor,
            transform: "translateX(2px)",
          }}
        />
      </motion.div>
    </div>
  );
};

export default Book3D;
