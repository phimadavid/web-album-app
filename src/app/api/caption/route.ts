//src/app/api/caption/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.REPLICATE_API_KEY;

    if (!apiKey) {
      console.error('No Replicate API key found in environment');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Call Replicate API to create prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version:
          'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
        input: {
          image: dataUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Replicate API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to generate caption' },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Poll for completion if not immediately ready
    let finalResult = result;
    const maxAttempts = 30; // Maximum 30 attempts (about 1 minute)
    let attempts = 0;

    while (
      finalResult.status === 'starting' ||
      finalResult.status === 'processing'
    ) {
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 408 }
        );
      }

      // Wait 2 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Poll the prediction status
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${finalResult.id}`,
        {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        }
      );

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error(
          `Replicate polling error: ${pollResponse.status} - ${errorText}`
        );
        return NextResponse.json(
          { error: 'Failed to poll prediction status' },
          { status: pollResponse.status }
        );
      }

      finalResult = await pollResponse.json();
      attempts++;
    }

    // Check final status and return appropriate response
    if (finalResult.status === 'succeeded') {
      return NextResponse.json({
        caption: finalResult.output,
        prediction_id: finalResult.id,
      });
    } else if (finalResult.status === 'failed') {
      console.error('❌ Prediction failed:', finalResult.error);
      return NextResponse.json(
        { error: 'Caption generation failed', details: finalResult.error },
        { status: 500 }
      );
    } else {
      // Handle other statuses (canceled, etc.)
      return NextResponse.json(
        { error: `Unexpected status: ${finalResult.status}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing image caption:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
