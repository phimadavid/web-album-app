import { motion } from "framer-motion";
import { SquareX } from "lucide-react";
import { useEffect, useState } from "react";
import AddPhotos from "../edit/components/addphotos";

// Add Photos Modal Component
const AddPhotosModal: React.FC<{
  params: { id: string };
  isOpen: boolean;
  onClose: () => void;
  onPhotosSaved: () => void;
}> = ({ isOpen, onClose, params, onPhotosSaved }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.95 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md lg:max-w-5xl mx-4 max-h-[90vh] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Photos</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <SquareX size={25} className="mr-2 text-red-600" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(90vh-120px)] sm:h-[calc(80vh-100px)]">
          <AddPhotos
            params={params}
            onClose={() => {
              if (onPhotosSaved) {
                onPhotosSaved();
              }
              handleClose();
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default AddPhotosModal;