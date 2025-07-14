'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FallingLines } from 'react-loader-spinner';
import { Button } from '@/components/ui/button';
import Book3D from '../terms/components/book3d';

interface ImageData {
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
}

export default function CreateAlbum() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [backgroundImage, setBackgroundImage] = useState<ImageData | null>(
    null
  );
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      }
    };

    fetchRandomImage();
  }, []);

  // Redirect authenticated users to user-specific creation flow
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/me/create-album');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          backgroundImage: backgroundImage?.imageUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to create album');

      const album = await response.json();
      router.push(`/terms/${album.id}`);
    } catch (error) {
      console.error('Error creating album:', error);
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen sm:min-h-[650px] relative">
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Image
            src={backgroundImage.imageUrl}
            alt="Background"
            fill
            className="object-cover blur-sm brightness-50"
            priority
          />
        </div>
      )}

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8 lg:gap-12 min-h-screen sm:min-h-[650px]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative w-full max-w-sm mx-auto lg:mx-0 lg:w-96 aspect-square flex-shrink-0"
        >
          {/* 3D Album Container */}
          <div className="relative w-full h-full transform-style-3d group-hover:rotate-y-12 transition-transform duration-500">
            {/* Front face with glass effect */}
            {backgroundImage && (
              <Book3D
                coverImage={backgroundImage.imageUrl}
                title="This is My Album"
                author="F. Scott Fitzgerald"
                coverColor="#1e40af"
              />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-1/2 space-y-5 flex flex-col justify-center"
        >
          <div className="text-center lg:text-left">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The name of your album"
              className="w-full text-xl sm:text-2xl lg:text-3xl font-light border-b border-white/50 pb-2 focus:outline-none focus:border-blue-500 placeholder:text-center lg:placeholder:text-right bg-transparent text-white placeholder:text-white/70"
              style={{ textAlign: window?.innerWidth >= 1024 ? "right" : "center" }}
            />
            <div className="mt-2 text-center lg:text-right text-sm text-white/80">
              Create A New Album
            </div>
            <div className="w-full flex justify-center lg:justify-end mt-4">
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-40 px-6 py-3 bg-blue-700 backdrop-blur-sm text-white rounded-full hover:bg-blue-600/80 transition-colors"
              >
                Continue
              </motion.button>
            </div>
          </div>
          {/* {status === 'unauthenticated' ? (
            <div className="text-center lg:text-left space-y-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-white">
                Create Beautiful Albums
              </h2>
              <p className="text-white/80 text-sm lg:text-base">
                Sign in to create and manage your personalized photo albums
              </p>
              <div className="w-full flex justify-center lg:justify-end space-x-4">
                <Button
                  onClick={() => router.push('/signin')}
                  className="px-6 py-3 bg-blue-700 backdrop-blur-sm text-white rounded-full hover:bg-blue-600/80 transition-colors"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  variant="outline"
                  className="px-6 py-3 border-white/50 backdrop-blur-sm text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center lg:text-left">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The name of your album"
                className="w-full text-xl sm:text-2xl lg:text-3xl font-light border-b border-white/50 pb-2 focus:outline-none focus:border-blue-500 placeholder:text-center lg:placeholder:text-right bg-transparent text-white placeholder:text-white/70"
                style={{ textAlign: window?.innerWidth >= 1024 ? "right" : "center" }}
              />
              <div className="mt-2 text-center lg:text-right text-sm text-white/80">
                Create A New Album
              </div>
              <div className="w-full flex justify-center lg:justify-end mt-4">
                <motion.button
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-40 px-6 py-3 bg-blue-700 backdrop-blur-sm text-white rounded-full hover:bg-blue-600/80 transition-colors"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          )} */}
        </motion.div>
      </main>
    </div>
  );
}
