// lib/theme-prompts.js

/**
 * Repository of prompts for different themes to be used with Stable Diffusion
 * Each theme contains a base prompt and negative prompt to guide the AI generation
 */
const themePrompts = {
    // Nature/Outdoor themes
    nature: {
        basePrompt: "Create a beautiful photo album template with natural elements like leaves, flowers, and organic textures. The design should feel fresh and organic with earthy tones.",
        negativePrompt: "urban, city, industrial, digital, futuristic, synthetic, artificial"
    },

    travel: {
        basePrompt: "Design a travel photo album template with subtle map elements, compass motifs, and a sense of adventure. The layout should feel like a travel journal.",
        negativePrompt: "static, domestic, office, corporate, bland"
    },

    beach: {
        basePrompt: "Create a coastal-themed photo album template with subtle wave patterns, shells, and seaside elements. The design should evoke a relaxed, beachy atmosphere.",
        negativePrompt: "urban, winter, cold, formal, corporate, dark"
    },

    mountains: {
        basePrompt: "Design a mountain-themed photo album template with pine trees, mountain silhouettes, and rugged textures. The layout should feel adventurous and majestic.",
        negativePrompt: "beach, ocean, tropical, urban, flat"
    },

    // Event themes
    wedding: {
        basePrompt: "Create an elegant wedding photo album template with romantic elements, subtle floral designs, and sophisticated typography. The layout should feel timeless and refined.",
        negativePrompt: "casual, childish, loud, bright, cartoon, playful"
    },

    birthday: {
        basePrompt: "Design a celebratory birthday photo album template with festive elements, balanced playfulness, and space for memories. The layout should feel joyful but not childish.",
        negativePrompt: "somber, formal, corporate, minimal, plain"
    },

    graduation: {
        basePrompt: "Create a graduation-themed photo album template with subtle academic elements, achievement motifs, and a sense of accomplishment. The design should feel proud and forward-looking.",
        negativePrompt: "childish, casual, unprofessional, cluttered"
    },

    // Seasonal themes
    summer: {
        basePrompt: "Design a summer photo album template with bright, sunny elements, light textures, and a sense of warmth. The layout should feel vibrant and refreshing.",
        negativePrompt: "winter, cold, dark, moody, formal"
    },

    autumn: {
        basePrompt: "Create an autumn-themed photo album template with falling leaves, warm colors, and cozy elements. The design should evoke the feeling of fall.",
        negativePrompt: "spring, summer, bright, tropical, cold"
    },

    winter: {
        basePrompt: "Design a winter photo album template with subtle snowflakes, cool tones, and cozy elements. The layout should balance crispness with warmth.",
        negativePrompt: "tropical, summer, bright, beach"
    },

    spring: {
        basePrompt: "Create a spring-themed photo album template with delicate florals, fresh colors, and a sense of renewal. The design should feel light and hopeful.",
        negativePrompt: "autumn, winter, dark, heavy, gloomy"
    },

    // Style-based themes
    minimalist: {
        basePrompt: "Design a minimalist photo album template with clean lines, ample white space, and subtle design elements. The layout should prioritize the photos with elegant simplicity.",
        negativePrompt: "busy, cluttered, ornate, complex, chaotic, loud"
    },

    vintage: {
        basePrompt: "Create a vintage-style photo album template with retro textures, classic typography, and a nostalgic feel. The design should evoke timeless memories.",
        negativePrompt: "modern, digital, futuristic, sleek, minimalist"
    },

    modern: {
        basePrompt: "Design a modern photo album template with clean geometry, contemporary typography, and sophisticated layouts. The design should feel current and fresh.",
        negativePrompt: "vintage, retro, old-fashioned, cluttered"
    },

    rustic: {
        basePrompt: "Create a rustic photo album template with wood textures, natural elements, and handcrafted feel. The layout should feel warm and authentic.",
        negativePrompt: "modern, sleek, digital, urban, polished"
    },

    // Default theme when none is specified
    default: {
        basePrompt: "Design a versatile photo album template with balanced layout, subtle design elements, and timeless appeal. The design should enhance photos without overwhelming them.",
        negativePrompt: "extreme, busy, chaotic, distracting, unprofessional"
    }
};

/**
 * Get prompts for a specific theme
 * @param {string} theme - The theme name
 * @returns {Object} Object containing basePrompt and negativePrompt
 */
// Define interfaces for the prompt structure
interface ThemePrompt {
    basePrompt: string;
    negativePrompt: string;
}

interface ThemePromptCollection {
    [key: string]: ThemePrompt;
}

/**
 * Get prompts for a specific theme
 * @param {string} theme - The theme name
 * @returns {Object} Object containing basePrompt and negativePrompt
 */
export function getThemePrompts(theme: string): ThemePrompt {
    // Return the prompts for the specified theme or default if not found
    return (themePrompts as ThemePromptCollection)[theme.toLowerCase()] || themePrompts.default;
}

/**
 * Get all available theme options
 * @returns {string[]} Array of available theme names
 */
export function getAvailableThemes() {
    return Object.keys(themePrompts);
}