//src/app/api/caption/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define types for theme configuration
type ThemeConfig = {
   prompt: string;
   keywords: string[];
};

type ThemeKey = 'family-gathering' | 'birthday' | 'wedding' | 'graduation' | 'vacation' | 'holiday' | 'baby' | 'pets' | 'sports' | 'nature';

// Theme-specific prompt templates for better contextual captions
const THEME_PROMPTS: Record<ThemeKey, ThemeConfig> = {
   'family-gathering': {
      prompt: "Describe this family gathering photo with warmth and emotion, focusing on the connections between people, the setting, and the joyful atmosphere. Mention family bonds, togetherness, and special moments.",
      keywords: ['family', 'gathering', 'together', 'celebration', 'reunion', 'relatives', 'generations', 'bonding']
   },
   'birthday': {
      prompt: "Describe this birthday celebration photo with excitement and joy, focusing on the birthday person, decorations, cake, candles, gifts, and the festive atmosphere. Capture the special milestone being celebrated.",
      keywords: ['birthday', 'celebration', 'cake', 'candles', 'party', 'gifts', 'milestone', 'special day']
   },
   'wedding': {
      prompt: "Describe this wedding photo with romance and elegance, focusing on the couple, their love, the ceremony details, guests, and the magical atmosphere of their special day.",
      keywords: ['wedding', 'bride', 'groom', 'ceremony', 'love', 'marriage', 'celebration', 'romance']
   },
   'graduation': {
      prompt: "Describe this graduation photo with pride and achievement, focusing on the graduate's accomplishment, the ceremony, family pride, and this important life milestone.",
      keywords: ['graduation', 'achievement', 'diploma', 'cap and gown', 'proud', 'milestone', 'education']
   },
   'vacation': {
      prompt: "Describe this vacation photo with adventure and relaxation, focusing on the destination, activities, experiences, and the joy of travel and exploration.",
      keywords: ['vacation', 'travel', 'adventure', 'destination', 'holiday', 'exploration', 'memories']
   },
   'holiday': {
      prompt: "Describe this holiday photo with festive spirit and tradition, focusing on decorations, traditions, family time, and the special atmosphere of the celebration.",
      keywords: ['holiday', 'christmas', 'thanksgiving', 'easter', 'tradition', 'festive', 'celebration']
   },
   'baby': {
      prompt: "Describe this baby photo with tenderness and love, focusing on the precious moments, innocence, family joy, and the special bond between baby and family.",
      keywords: ['baby', 'newborn', 'precious', 'innocent', 'tender', 'family', 'love', 'milestone']
   },
   'pets': {
      prompt: "Describe this pet photo with affection and playfulness, focusing on the pet's personality, the bond with their family, and the joy pets bring to our lives.",
      keywords: ['pet', 'dog', 'cat', 'animal', 'companion', 'playful', 'loyal', 'family member']
   },
   'sports': {
      prompt: "Describe this sports photo with energy and excitement, focusing on the action, achievement, teamwork, competition, and the thrill of the game.",
      keywords: ['sports', 'game', 'team', 'competition', 'victory', 'athletic', 'achievement']
   },
   'nature': {
      prompt: "Describe this nature photo with beauty and serenity, focusing on the natural elements, peaceful atmosphere, and the wonder of the outdoors.",
      keywords: ['nature', 'landscape', 'outdoors', 'peaceful', 'beautiful', 'scenic', 'natural']
   }
};

// Function to detect theme from image analysis
function detectThemeFromCaption(caption: string): ThemeKey | null {
   const lowerCaption = caption.toLowerCase();
   
   // Score each theme based on keyword matches
   const themeScores: Record<ThemeKey, number> = {} as Record<ThemeKey, number>;
   
   for (const [theme, config] of Object.entries(THEME_PROMPTS) as [ThemeKey, ThemeConfig][]) {
      themeScores[theme] = 0;
      for (const keyword of config.keywords) {
         if (lowerCaption.includes(keyword.toLowerCase())) {
            themeScores[theme] += 1;
         }
      }
   }
   
   // Find the theme with the highest score
   const bestTheme = Object.entries(themeScores).reduce((a, b) => 
      themeScores[a[0] as ThemeKey] > themeScores[b[0] as ThemeKey] ? a : b
   );
   
   // Return theme only if it has a meaningful score
   return bestTheme[1] > 0 ? (bestTheme[0] as ThemeKey) : null;
}

// Function to enhance caption with theme-specific context
function enhanceCaption(originalCaption: string, theme: ThemeKey | null): string {
   if (!theme || !(theme in THEME_PROMPTS)) {
      return originalCaption;
   }
   
   // Create enhanced caption based on theme - generate clean, natural captions
   const enhancements = {
      'family-gathering': (caption: string) => {
         // Extract key elements from original caption
         const cleanCaption = caption.toLowerCase().replace(/^(a |an |the )/i, '');
         
         if (cleanCaption.includes('sitting') || cleanCaption.includes('gathered')) {
            return `A heartwarming family gathering with loved ones sharing precious moments together`;
         }
         if (cleanCaption.includes('children') || cleanCaption.includes('kids')) {
            return `A joyful family moment with children and parents creating lasting memories`;
         }
         if (cleanCaption.includes('outdoor') || cleanCaption.includes('outside')) {
            return `A beautiful family gathering outdoors, enjoying quality time together`;
         }
         return `A heartwarming family gathering filled with love and togetherness`;
      },
      'birthday': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('cake')) {
            return `A joyful birthday celebration with a delicious cake and festive atmosphere`;
         }
         if (cleanCaption.includes('candle')) {
            return `A special birthday moment with candles glowing and wishes being made`;
         }
         if (cleanCaption.includes('party')) {
            return `An exciting birthday party filled with joy, laughter, and celebration`;
         }
         return `A memorable birthday celebration marking another year of happiness`;
      },
      'wedding': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('dress') || cleanCaption.includes('bride')) {
            return `A beautiful wedding moment showcasing the radiant bride on her special day`;
         }
         if (cleanCaption.includes('ceremony')) {
            return `An elegant wedding ceremony celebrating the union of two hearts`;
         }
         if (cleanCaption.includes('couple')) {
            return `A romantic wedding portrait of the happy couple beginning their journey together`;
         }
         return `A magical wedding celebration filled with love, joy, and new beginnings`;
      },
      'graduation': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('cap') || cleanCaption.includes('gown')) {
            return `A proud graduation moment with cap and gown marking this important achievement`;
         }
         if (cleanCaption.includes('diploma')) {
            return `A triumphant graduation celebration with diploma in hand and dreams ahead`;
         }
         return `A milestone graduation achievement representing years of hard work and dedication`;
      },
      'vacation': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('beach') || cleanCaption.includes('ocean')) {
            return `A relaxing beach vacation with sun, sand, and unforgettable memories`;
         }
         if (cleanCaption.includes('mountain') || cleanCaption.includes('hiking')) {
            return `An adventurous mountain vacation exploring nature's breathtaking beauty`;
         }
         if (cleanCaption.includes('city') || cleanCaption.includes('travel')) {
            return `An exciting city vacation discovering new places and creating lasting memories`;
         }
         return `A wonderful vacation getaway filled with adventure, relaxation, and joy`;
      },
      'holiday': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('christmas') || cleanCaption.includes('tree')) {
            return `A festive Christmas celebration with family traditions and holiday magic`;
         }
         if (cleanCaption.includes('thanksgiving')) {
            return `A warm Thanksgiving gathering celebrating gratitude and family bonds`;
         }
         return `A joyful holiday celebration bringing family together with love and tradition`;
      },
      'baby': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('sleeping') || cleanCaption.includes('peaceful')) {
            return `A tender moment with baby sleeping peacefully, pure innocence and love`;
         }
         if (cleanCaption.includes('smiling') || cleanCaption.includes('happy')) {
            return `A precious baby moment filled with adorable smiles and pure joy`;
         }
         return `A beautiful baby portrait capturing innocence, wonder, and unconditional love`;
      },
      'pets': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('dog') || cleanCaption.includes('puppy')) {
            return `An adorable dog moment showcasing loyalty, playfulness, and unconditional love`;
         }
         if (cleanCaption.includes('cat') || cleanCaption.includes('kitten')) {
            return `A charming cat portrait displaying grace, curiosity, and feline elegance`;
         }
         return `A heartwarming pet moment celebrating the special bond with our furry family`;
      },
      'sports': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('running') || cleanCaption.includes('race')) {
            return `An energetic sports moment capturing speed, determination, and athletic excellence`;
         }
         if (cleanCaption.includes('team') || cleanCaption.includes('game')) {
            return `An exciting team sports moment showcasing teamwork, skill, and competitive spirit`;
         }
         return `A dynamic sports achievement celebrating athleticism, dedication, and victory`;
      },
      'nature': (caption: string) => {
         const cleanCaption = caption.toLowerCase();
         
         if (cleanCaption.includes('sunset') || cleanCaption.includes('sunrise')) {
            return `A breathtaking natural moment with golden light painting the sky in beauty`;
         }
         if (cleanCaption.includes('forest') || cleanCaption.includes('trees')) {
            return `A serene forest scene showcasing nature's tranquil beauty and peaceful harmony`;
         }
         if (cleanCaption.includes('mountain') || cleanCaption.includes('landscape')) {
            return `A majestic landscape view revealing nature's grandeur and timeless beauty`;
         }
         return `A stunning natural scene displaying the wonder and beauty of our world`;
      }
   };
   
   const enhancer = enhancements[theme as keyof typeof enhancements];
   return enhancer ? enhancer(originalCaption) : originalCaption;
}

export async function POST(request: NextRequest) {
   try {
      // Get the uploaded file and optional theme from FormData
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const requestedTheme = formData.get("theme") as string | null;
      const style = formData.get("style") as string || "descriptive"; // descriptive, creative, emotional
      const tone = formData.get("tone") as string || "warm"; // warm, casual, formal, playful

      if (!file) {
         return NextResponse.json(
            { error: "No file provided" },
            { status: 400 }
         );
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
         return NextResponse.json(
            { error: "File must be an image" },
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

      // Convert file to base64 data URL
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      // First, get a basic caption to analyze for theme detection
      const basicResponse = await fetch("https://api.replicate.com/v1/predictions", {
         method: "POST",
         headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            version: "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
            input: {
               image: dataUrl,
            },
         }),
      });

      if (!basicResponse.ok) {
         const errorText = await basicResponse.text();
         console.error(`Replicate API error: ${basicResponse.status} - ${errorText}`);
         return NextResponse.json(
            { error: "Failed to generate caption" },
            { status: basicResponse.status }
         );
      }

      const basicResult = await basicResponse.json();

      // Poll for basic caption completion
      let finalBasicResult = basicResult;
      const maxAttempts = 30;
      let attempts = 0;

      while (
         finalBasicResult.status === "starting" ||
         finalBasicResult.status === "processing"
      ) {
         if (attempts >= maxAttempts) {
            return NextResponse.json(
               { error: "Request timed out" },
               { status: 408 }
            );
         }

         await new Promise(resolve => setTimeout(resolve, 2000));

         const pollResponse = await fetch(
            `https://api.replicate.com/v1/predictions/${finalBasicResult.id}`,
            {
               headers: {
                  Authorization: `Token ${apiKey}`,
               },
            }
         );

         if (!pollResponse.ok) {
            const errorText = await pollResponse.text();
            console.error(`Replicate polling error: ${pollResponse.status} - ${errorText}`);
            return NextResponse.json(
               { error: "Failed to poll prediction status" },
               { status: pollResponse.status }
            );
         }

         finalBasicResult = await pollResponse.json();
         attempts++;
      }

      if (finalBasicResult.status !== "succeeded") {
         console.error("❌ Basic prediction failed:", finalBasicResult.error);
         return NextResponse.json(
            {
               error: "Caption generation failed",
               details: finalBasicResult.error,
            },
            { status: 500 }
         );
      }

      const basicCaption = finalBasicResult.output;
      
      // Detect theme from basic caption or use requested theme
      const validRequestedTheme = requestedTheme && Object.keys(THEME_PROMPTS).includes(requestedTheme) 
         ? requestedTheme as ThemeKey 
         : null;
      const detectedTheme = validRequestedTheme || detectThemeFromCaption(basicCaption);
      
      // If we have a theme, generate an enhanced caption
      let enhancedCaption = basicCaption;
      
      if (detectedTheme && detectedTheme in THEME_PROMPTS) {
         // Use GPT-style prompting with the detected theme
         const themeConfig = THEME_PROMPTS[detectedTheme];
         
         // Create a more sophisticated prompt for better captions
         const enhancedPrompt = `${themeConfig.prompt} Style: ${style}. Tone: ${tone}. Based on this image: ${basicCaption}`;
         
         // For now, enhance the basic caption with theme context
         enhancedCaption = enhanceCaption(basicCaption, detectedTheme);
      }

      // Return enhanced response with theme information
      return NextResponse.json({
         caption: enhancedCaption,
         originalCaption: basicCaption,
         detectedTheme: detectedTheme,
         availableThemes: Object.keys(THEME_PROMPTS),
         style: style,
         tone: tone,
         prediction_id: finalBasicResult.id,
      });

   } catch (error) {
      console.error("Error processing image caption:", error);
      return NextResponse.json(
         { error: "Internal server error" },
         { status: 500 }
      );
   }
}
