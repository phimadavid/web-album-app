import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        const { prompt, intensity, dimensions } = body;

        // Input validation
        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: "Prompt is required and must be a string" },
                { status: 400 }
            );
        }

        // Get API key from environment variables
        const apiKey = process.env.REPLICATE_API_KEY;

        if (!apiKey) {
            console.error("No Replicate API key found in environment");
            return NextResponse.json(
                { error: "API key not configured" },
                { status: 500 }
            );
        }

        // Set default dimensions if not provided
        const width = dimensions?.width || 800;
        const height = dimensions?.height || 600;

        // Create enhanced prompt for background generation
        const enhancedPrompt = `${prompt}, high quality background image, suitable for photo album, clean and aesthetic, ${width}x${height} resolution`;

        // Call Replicate API to create prediction for background generation
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                Authorization: `Token ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
                input: {
                    prompt: enhancedPrompt,
                    width: width,
                    height: height,
                    num_outputs: 1,
                    guidance_scale: 7.5,
                    num_inference_steps: 50,
                    scheduler: "K_EULER"
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `Replicate API error: ${response.status} - ${errorText}`
            );
            return NextResponse.json(
                { error: "Failed to generate background" },
                { status: response.status }
            );
        }

        const result = await response.json();

        // Poll for completion if not immediately ready
        let finalResult = result;
        const maxAttempts = 30; // Maximum 30 attempts (about 1 minute)
        let attempts = 0;

        while (
            finalResult.status === "starting" ||
            finalResult.status === "processing"
        ) {
            if (attempts >= maxAttempts) {
                return NextResponse.json(
                    { error: "Request timed out" },
                    { status: 408 }
                );
            }

            // Wait 2 seconds before polling again
            await new Promise(resolve => setTimeout(resolve, 2000));

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
                    { error: "Failed to poll prediction status" },
                    { status: pollResponse.status }
                );
            }

            finalResult = await pollResponse.json();
            attempts++;
        }

        // Check final status and return appropriate response
        if (finalResult.status === "succeeded") {
            // Return the first generated image URL
            const imageUrl = Array.isArray(finalResult.output) 
                ? finalResult.output[0] 
                : finalResult.output;

            return NextResponse.json({
                imageUrl: imageUrl,
                prediction_id: finalResult.id,
                prompt: enhancedPrompt,
                dimensions: { width, height }
            });
        } else if (finalResult.status === "failed") {
            console.error("❌ Background generation failed:", finalResult.error);
            return NextResponse.json(
                {
                    error: "Background generation failed",
                    details: finalResult.error,
                },
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
        console.error("Error generating background:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
