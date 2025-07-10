import axios from 'axios';

/**
 * Generate template images using the FLUX.1-dev model via our Next.js API
 * @param promptWord The aesthetic descriptor to use for generation
 * @returns Promise with array of image URLs as data:image/jpeg;base64
 */

export async function generateTemplateImage(promptWord: string): Promise<string[]> {
    try {
        // Call our server-side API route
        const response = await axios.post('/api/generate/template', {
            promptWord
        });

        if (response.data.error) {
            throw new Error(response.data.error);
        }

        return response.data.image ? [response.data.image] : [];


    } catch (error) {
        console.error('Error generating template:', error);

        if (axios.isAxiosError(error)) {
            console.error('API error details:', {
                status: error.response?.status,
                data: error.response?.data
            });
        }

        return [];
    }
}

