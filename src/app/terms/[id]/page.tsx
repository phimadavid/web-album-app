'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

import { FallingLines } from 'react-loader-spinner';
import Book3D from '../components/book3d';

interface ImageData {
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
}

export default function Terms({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<ImageData | null>(
    null
  );
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    const fetchRandomImage = async () => {
      try {
        const response = await fetch('/api/random-image');
        if (!response.ok) throw new Error('Failed to fetch image');
        const data = await response.json();
        setBackgroundImage(data);
      } catch (error) {
        console.error('Error fetching background image:', error);
      } finally {
        setIsImageLoading(false);
      }
    };

    fetchRandomImage();
  }, []);

  const handleContinue = async () => {
    if (!accepted) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/album/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termsAccepted: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update terms acceptance');
      }

      router.push(`/upload/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isImageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <FallingLines
          color="#4fa94d"
          width="100"
          visible={true}
          aria-label="falling-circles-loading"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="relative w-full h-full transform-style-3d group-hover:rotate-y-12 transition-transform duration-500">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg shadow-2xl border border-white/30">
              <Image
                src={backgroundImage.imageUrl}
                alt="Background"
                fill
                className="object-cover blur-sm brightness-50"
                priority
              />
            </div>
            <div className="absolute right-0 top-0 w-4 h-full bg-black/20 transform translate-x-full origin-left skew-y-6"></div>
            <div className="absolute bottom-0 left-0 w-full h-4 bg-black/10 transform translate-y-full origin-top skew-x-6"></div>
          </div>
        </div>
      )}

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8 lg:gap-12 min-h-screen">
        <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-start mb-14 sm:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-sm lg:w-96 aspect-square group perspective"
          >
            <div className="relative w-full h-full transform-style-3d group-hover:rotate-y-12 transition-transform duration-500">
              {backgroundImage && (
                <Book3D
                  coverImage={backgroundImage.imageUrl}
                  title="The Great Gatsby"
                  author="F. Scott Fitzgerald"
                  coverColor="#1e40af"
                />
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-1/2 space-y-6 lg:space-y-8"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-end space-x-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5 border-2 border-white/30 rounded focus:ring-2 focus:ring-white/50 bg-white/20"
                disabled={loading}
              />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-white">
                Before continuing, please accept the
              </h1>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100/90 backdrop-blur-sm text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="text-center lg:text-right">
              <label className="text-lg sm:text-xl text-white hover:underline cursor-pointer">
                I accept the Terms and Conditions and Privacy Policy
              </label>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end space-y-4">
            <motion.button
              onClick={handleContinue}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!accepted || loading}
              className={`w-48 px-10 py-4 rounded-full text-white font-medium text-lg shadow-lg transition-all duration-300 ${accepted && !loading
                ? 'bg-blue-600/75 backdrop-blur-sm hover:bg-blue-500/90 hover:shadow-xl border border-blue-400/50'
                : 'bg-gray-600/60 cursor-not-allowed border border-gray-500/30'
                }`}
            >
              {loading ? 'Loading...' : 'Continue'}
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}