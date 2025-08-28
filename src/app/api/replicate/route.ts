// File: src/app/api/replicate/route.ts
import { getThemePrompts } from "@/lib/services/theme-prompts";
import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// Define interfaces
interface ThemePrompt {
   basePrompt: string;
}

// Define the POST method handler - this is the App Router way
export async function POST(request: NextRequest) {
   try {
      // Parse the request body
      const body = await request.json();
      const { colors, theme, imageCount, coverImage } = body;

      // Input validation
      if (!colors || !Array.isArray(colors) || !theme || !imageCount) {
         return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
         );
      }

      // Get theme-specific prompts
      const { basePrompt }: ThemePrompt = getThemePrompts(theme);

      // Determine layout type based on image count
      const layoutType: string = imageCount <= 20 ? "spacious" : "compact";

      // Convert hex colors to descriptive color names
      const colorDescriptions: string = colors.map(hexToColorName).join(", ");

      // Create the full prompt
      const fullPrompt: string = `${basePrompt} The album design uses a color palette with ${colorDescriptions} colors. The layout is ${layoutType} and modern, designed for a photo album with ${imageCount} images.`;

      // Initialize Replicate with API key
      const replicate = new Replicate({
         auth: process.env.REPLICATE_API_KEY!,
      });

      // Call the Stable Diffusion model
      const output = await replicate.run("anthropic/claude-3.7-sonnet", {
         input: {
            prompt: fullPrompt,
            image: coverImage,
            width: 1024,
            height: 768,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50,
         },
      });

      // Return the generated images
      return NextResponse.json({ images: output });
   } catch (error) {
      console.error("Error generating template:", error);

      return NextResponse.json(
         {
            error: "Failed to generate template",
            details: error instanceof Error ? error.message : "Unknown error",
         },
         { status: 500 }
      );
   }
}

// Helper function for color conversion
function hexToColorName(hexColor: string): string {
   // This is a simplified version
   const colorMap: Record<string, string> = {
      "#FF0000": "red",
      "#00FF00": "green",
      "#0000FF": "blue",
      "#FFFF00": "yellow",
      "#FF00FF": "magenta",
      "#00FFFF": "cyan",
      "#000000": "black",
      "#FFFFFF": "white",
      "#FFA500": "orange",
      "#800080": "purple",
      "#A52A2A": "brown",
      "#808080": "gray",
   };

   // Normalize hex color
   const normalizedHex: string = hexColor.toUpperCase();
   return colorMap[normalizedHex] || normalizedHex;
}
