// app/api/generate/template/route.ts
import { blobToBase64 } from '@/helper/blobToBase';
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { promptWord } = requestData;

    const replicate = new Replicate();

    const fullPrompt = `${promptWord} abstract design background`;

    const input = {
      prompt: fullPrompt,
    };

    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input,
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const base64Image = await blobToBase64(imageBlob);

    return NextResponse.json({ image: base64Image });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
