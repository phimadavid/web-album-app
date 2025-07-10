import { NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET() {
  try {
    const response = await fetch(
      'https://api.pexels.com/v1/search?query=beach&per_page=1&page=' + Math.floor(Math.random() * 100),
      {
        headers: {
          'Authorization': PEXELS_API_KEY as string
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const data = await response.json();
    
    // Check if photos array exists and has at least one item
    if (!data.photos || data.photos.length === 0) {
      throw new Error('No images found');
    }

    // Pexels provides multiple image sizes, we'll use the large size
    return NextResponse.json({ 
      imageUrl: data.photos[0].src.large,
      photographer: data.photos[0].photographer,
      photographerUrl: data.photos[0].photographer_url,
      pexelsUrl: data.photos[0].url
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch image' 
    }, { 
      status: 500 
    });
  }
}

// Local image API
// import { NextResponse } from 'next/server';

// const SAMPLE_IMAGES = [
//   '/images/mountain.jpg',
//   '/images/paris.jpg',
//   '/images/beach.jpg',
//   // Add more sample images
// ];

// export async function GET() {
//   const randomImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
//   return NextResponse.json({ imageUrl: randomImage });
// }