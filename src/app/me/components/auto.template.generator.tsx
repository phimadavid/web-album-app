"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { generateTemplateImage } from '@/lib/services/hf.generate.template';


import { AutoTemplateGeneratorProps, TemplateData } from '@/app/design/types/template';
import { analyzeEventTags, getTemplateConfigForCategory, isLikelyConcert, parseEventTags } from '@/app/design/components/event.prediction';
import DesignTemplatesLibrary, { DesignTemplate } from '@/app/design/components/design.templates.library';

const AutoTemplateGenerator: React.FC<AutoTemplateGeneratorProps> = ({ albumId, Images }) => {
    const router = useRouter();

    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const [customColors, setCustomColors] = useState<string[]>([]);
    const [maxSuggestedTemplates] = useState<number>(8);
    const [generationCount, setGenerationCount] = useState<number>(0);

    const [detectedEventTags, setDetectedEventTags] = useState<string[]>([]);
    const [eventCategory, setEventCategory] = useState<string>('General Event');
    const [activeTab, setActiveTab] = useState<'suggested'>('suggested');
    const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string>('all');

    const [translatedPromptWord, setTranslatedPromptWord] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [promptWord, setPromptWord] = useState<string>('elegant');
    const [customPromptWord, setCustomPromptWord] = useState<string>('');

    // New state for overlay control
    const [overlayImageIndex, setOverlayImageIndex] = useState<{ [templateId: string]: number }>({});
    const [overlaySettings, setOverlaySettings] = useState<{
        [templateId: string]: {
            size: number;
            opacity: number;
            position: 'center' | 'top' | 'bottom';
        }
    }>({});

    // State for AI-generated overlay images (now defaults to AI mode)
    const [overlayMode, setOverlayMode] = useState<'user' | 'ai'>('ai');
    const [aiOverlayImages, setAiOverlayImages] = useState<{ [templateId: string]: string[] }>({});
    const [aiOverlayPrompts, setAiOverlayPrompts] = useState<{ [templateId: string]: string[] }>({});
    const [isGeneratingOverlay, setIsGeneratingOverlay] = useState<{ [templateId: string]: boolean }>({});

    // Default prompts for automatic AI overlay generation
    const defaultOverlayPrompts = [
        'people traveling together',
        'friends bonding and laughing',
        'family group smiling',
        'couple enjoying vacation',
        'people celebrating',
        'friends having fun',
        'group of travelers',
        'people sharing memories',
        'happy friends together',
        'people on adventure',
        'family bonding time',
        'friends exploring',
        'people enjoying life',
        'group celebration',
        'travel companions'
    ];

    const [colorPalettes, setColorPalettes] = useState<string[][]>([
        ['#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#355C7D'],
        ['#99B898', '#FECEAB', '#FF847C', '#E84A5F', '#2A363B'],
        ['#A8E6CE', '#DCEDC2', '#FFD3B5', '#FFAAA6', '#FF8C94'],
        ['#CAEBF2', '#A9A9A9', '#FF3B3F', '#EFEFEF', '#D3D3D3']
    ]);

    // Predefined template styles
    const templateStyles = [
        'Minimalist',
        'Vintage',
        'Modern',
        'Elegant',
        'Playful',
        'Rustic',
        'Geometric'
    ];

    // Function to detect if text contains non-English characters
    const containsNonEnglishChars = (text: string): boolean => {
        // This regex matches characters outside basic Latin alphabet, numbers, and common punctuation
        const nonEnglishRegex = /[^\x00-\x7F]/;
        return nonEnglishRegex.test(text);
    };

    // Function to detect language - could be expanded in the future
    const detectLanguage = (text: string): string => {
        // A simple check for Hebrew characters
        const hebrewChars = /[\u0590-\u05FF]/;
        if (hebrewChars.test(text)) {
            return 'he_IL';
        }

        // Default to auto-detection (which the model will handle)
        return 'auto';
    };

    // Function to translate text to English
    const translateToEnglish = async (text: string): Promise<string> => {
        if (!text.trim()) return '';

        try {
            setIsTranslating(true);

            // Call translation API
            const response = await axios.post('/api/translate', {
                text: text,
                targetLanguage: 'en'
            });

            if (response.data && response.data.translatedText) {
                return response.data.translatedText;
            }

            // Fallback in case translation fails
            return text;
        } catch (error) {
            console.error('Translation error:', error);
            // Return original text if translation fails
            return text;
        } finally {
            setIsTranslating(false);
        }
    };

    // Function to extract all event tags from cover images
    const extractAllEventTags = () => {
        let allTags: string[] = [];

        Images.forEach(image => {
            if (image.metadata && image.metadata.event_tags) {
                const parsedTags = parseEventTags(image.metadata.event_tags);
                allTags = [...allTags, ...parsedTags];
            }
        });

        // Remove duplicates and return
        return [...new Set(allTags)];
    };

    // Function to create composite images with cover images on top of templates
    const createCompositeTemplateImage = (templateImage: string) => {
        // This function simulates creating a composite image
        // In a real implementation, this would create a canvas and draw images together
        // or use a server-side API to composite the images

        // For now, we'll just return the template image as a placeholder
        return templateImage;
    };

    // Function to get overlay settings for a template
    const getOverlaySettings = (templateId: string) => {
        return overlaySettings[templateId] || {
            size: 75, // Default size percentage
            opacity: 90, // Default opacity percentage
            position: 'center' // Default position
        };
    };

    // Function to generate AI overlay images
    const generateAIOverlayImage = async (templateId: string, prompt: string) => {
        if (!prompt.trim()) return;

        setIsGeneratingOverlay(prev => ({ ...prev, [templateId]: true }));

        try {
            // Use the same HF service but with a different prompt focused on overlay elements
            const overlayPrompt = `${prompt}, isolated subject, clean background, portrait, centered composition`;
            const response = await generateTemplateImage(overlayPrompt);

            if (response && response.length > 0) {
                const newAIImage = response[0];

                // Add the new AI image to the template's AI overlay images
                setAiOverlayImages(prev => ({
                    ...prev,
                    [templateId]: [...(prev[templateId] || []), newAIImage]
                }));

                // Store the prompt used
                setAiOverlayPrompts(prev => ({
                    ...prev,
                    [templateId]: [...(prev[templateId] || []), prompt]
                }));

                // If this is the first AI image for this template, reset the overlay index
                if (!(templateId in aiOverlayImages) || aiOverlayImages[templateId].length === 0) {
                    setOverlayImageIndex(prev => ({
                        ...prev,
                        [templateId]: 0
                    }));
                }
            }
        } catch (error) {
            console.error('Error generating AI overlay image:', error);
        } finally {
            setIsGeneratingOverlay(prev => ({ ...prev, [templateId]: false }));
        }
    };

    // Function to get total overlay image count for a template
    const getTotalOverlayCount = (templateId: string) => {
        if (overlayMode === 'ai') {
            return (aiOverlayImages[templateId] || []).length;
        }
        return Images.length;
    };

    // Function to cycle through overlay images (updated for AI support)
    const cycleOverlayImageUpdated = (templateId: string, direction: 'next' | 'prev') => {
        const totalCount = getTotalOverlayCount(templateId);
        if (totalCount === 0) return;

        const currentIndex = overlayImageIndex[templateId] || 0;
        let newIndex;

        if (direction === 'next') {
            newIndex = (currentIndex + 1) % totalCount;
        } else {
            newIndex = currentIndex === 0 ? totalCount - 1 : currentIndex - 1;
        }

        setOverlayImageIndex(prev => ({
            ...prev,
            [templateId]: newIndex
        }));
    };

    // Function to automatically generate AI overlays for a template
    const autoGenerateAIOverlays = async (templateId: string) => {
        // Get a random prompt from the default prompts
        const randomPrompt = defaultOverlayPrompts[Math.floor(Math.random() * defaultOverlayPrompts.length)];

        // Generate 2-3 overlay images for each template automatically
        const numberOfOverlays = Math.floor(Math.random() * 2) + 2; // 2 or 3 overlays

        for (let i = 0; i < numberOfOverlays; i++) {
            const prompt = i === 0 ? randomPrompt : defaultOverlayPrompts[Math.floor(Math.random() * defaultOverlayPrompts.length)];
            await generateAIOverlayImage(templateId, prompt);
            // Add small delay between generations to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    };

    // Analyze event tags and set appropriate theme
    useEffect(() => {
        if (Images && Images.length > 0) {
            // Extract all event tags from cover images
            const allTags = extractAllEventTags();
            setDetectedEventTags(allTags);

            // Analyze event tags to determine event category
            const eventCategoryObj = analyzeEventTags(allTags);

            // Special case for the example: concert detection
            const concertDetected = isLikelyConcert(allTags);

            if (concertDetected) {
                const concertCategory = analyzeEventTags(['concert', 'stage', 'crowd']);
                setEventCategory(concertCategory.name);
                setPromptWord(concertCategory.promptWord);
                setColorPalettes(concertCategory.colorPalettes);

                // Set appropriate library category when concert is detected
                setSelectedLibraryCategory('concert');
            } else {
                // Use the general analyzed category
                const templateConfig = getTemplateConfigForCategory(eventCategoryObj);
                setEventCategory(templateConfig.name);
                setPromptWord(templateConfig.promptWord);
                setColorPalettes(templateConfig.colorPalettes);

                // Try to map the event category to a library category
                const categoryMapping: { [key: string]: string } = {
                    'Wedding': 'wedding',
                    'Birthday': 'birthday',
                    'Travel': 'travel',
                    'Sports': 'sports',
                    'Corporate': 'corporate',
                    'Family': 'family',
                    'Holiday': 'holiday'
                };

                if (categoryMapping[templateConfig.name]) {
                    setSelectedLibraryCategory(categoryMapping[templateConfig.name]);
                } else {
                    setSelectedLibraryCategory('all');
                }
            }
        }
    }, [Images]);

    // New function to handle routing to album-book page
    const handleNavigateToAlbumBook = async (templateId: string) => {

        try {
            setIsLoading(true);
            // First, apply the template
            const selectedTemplateData = templates.find(t => t.id === templateId);

            if (!selectedTemplateData) {
                throw new Error('No template selected');
            }

            // template data for saving
            const templateToApply = {
                albumId,
                template: {
                    id: selectedTemplateData.id,
                    name: selectedTemplateData.name,
                    previewUrl: selectedTemplateData.compositeImage || selectedTemplateData.image,
                    theme: selectedTemplateData.theme,
                    style: selectedTemplateData.style,
                    colors: customColors,
                    coverImageCount: Images.length,
                    coverImages: Images.map(img => img.previewUrl || img.s3Url),
                    templateImage: selectedTemplateData.image,
                    eventCategory: eventCategory,
                    promptWord: selectedTemplateData.promptWord || promptWord,
                    detectedTags: detectedEventTags
                }
            };

            // Save the template before navigating
            await axios.post('/api/book/apply-template', templateToApply);

            // Navigate to the album-book page with the albumId as a parameter
            router.push(`me/edit/${albumId}`);

        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to navigate to album book'));
            console.error('Error navigating to album book:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate a single template
    const generateSingleTemplate = async (
        templateId: string,
        themeName: string,
        styleType: string,
        colorsArray: string[],
        customPromptWord: string
    ) => {
        try {
            // Mark template as loading its image
            setTemplates(prevTemplates =>
                prevTemplates.map(t => t.id === templateId ? { ...t, imageLoading: true } : t)
            );

            // Generate the template image
            const response = await generateTemplateImage(customPromptWord);

            if (!response || response.length === 0) {
                throw new Error('No image generated');
            }

            const templateImage = response[0] || '';
            const compositeImage = createCompositeTemplateImage(templateImage);

            return {
                id: templateId,
                name: `${themeName} ${styleType}`,
                image: templateImage,
                compositeImage: compositeImage,
                theme: themeName,
                style: styleType,
                colors: colorsArray,
                promptWord: customPromptWord,
                isLoading: false,
                imageLoading: false
            };

        } catch (error) {
            console.error('Error generating template:', error);
            return null;
        }
    };

    // Handle generating templates on demand
    const handleGenerateTemplates = async () => {
        if (!albumId || Images.length === 0 || !promptWord) return;

        setIsLoading(true);
        setError(null);

        try {
            const theme = eventCategory;
            const numberOfTemplates = Math.min(maxSuggestedTemplates, 8); // Generate up to max suggested templates
            const newGenerationCount = generationCount + 1;

            // Create placeholders for new templates with isLoading set to true
            const placeholders: TemplateData[] = [];

            for (let i = 0; i < numberOfTemplates; i++) {
                const newTemplateId = `t${templates.length + i + 1}`;
                const styleIndex = Math.floor(Math.random() * templateStyles.length);
                const colorIndex = Math.floor(Math.random() * colorPalettes.length);

                placeholders.push({
                    id: newTemplateId,
                    name: `${theme} ${templateStyles[styleIndex]}`,
                    image: '',
                    theme,
                    style: templateStyles[styleIndex],
                    colors: colorPalettes[colorIndex],
                    promptWord: promptWord,
                    isLoading: true,
                    imageLoading: true
                });
            }

            // Add placeholders to state (at the beginning)
            setTemplates(prevTemplates => [...placeholders, ...prevTemplates]);

            // Generate each template
            const newTemplates = [];

            for (let i = 0; i < placeholders.length; i++) {
                const placeholder = placeholders[i];
                const customPrompt = `${promptWord} ${placeholder.style.toLowerCase()}`;

                const template = await generateSingleTemplate(
                    placeholder.id,
                    placeholder.theme,
                    placeholder.style,
                    placeholder.colors,
                    customPrompt
                );

                if (template) {
                    newTemplates.push(template);

                    // Update templates as they are generated
                    setTemplates(prevTemplates =>
                        prevTemplates.map(t => t.id === template.id ? template : t)
                    );

                    // Automatically generate AI overlays for this template
                    if (overlayMode === 'ai') {
                        autoGenerateAIOverlays(template.id);
                    }
                }
            }

            // If no templates were successfully generated, show error
            if (newTemplates.length === 0) {
                setError(new Error('Failed to generate any templates'));
            } else {
                // Select first template if none selected
                if (!selectedTemplate) {
                    setSelectedTemplate(newTemplates[0].id);
                    setCustomColors(newTemplates[0].colors);
                }

                setGenerationCount(newGenerationCount);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to generate templates'));
            console.error('Error generating templates:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle generating a new template on demand
    const handleGenerateNewTemplate = async () => {
        if (!albumId || Images.length === 0) return;

        setIsLoading(true);

        try {
            const theme = eventCategory;
            const newTemplateId = `t${templates.length + 1}`;
            const styleIndex = Math.floor(Math.random() * templateStyles.length);
            const colorIndex = Math.floor(Math.random() * colorPalettes.length);

            // Add a placeholder for the new template
            const newTemplate: TemplateData = {
                id: newTemplateId,
                name: `${theme} ${templateStyles[styleIndex]}`,
                theme,
                style: templateStyles[styleIndex],
                colors: colorPalettes[colorIndex],
                isLoading: true,
                imageLoading: true,
                promptWord: promptWord,
                image: "",
            };

            setTemplates(prev => [newTemplate, ...prev]);

            // Generate the template image
            const template = await generateSingleTemplate(
                newTemplateId,
                theme,
                templateStyles[styleIndex],
                colorPalettes[colorIndex],
                promptWord
            );

            if (template) {
                // Update with the generated image
                setTemplates(prev => prev.map(t =>
                    t.id === newTemplateId ? template : t
                ));

                // Select the new template
                setSelectedTemplate(newTemplateId);
                setCustomColors(template.colors);

                // Automatically generate AI overlays for this template
                if (overlayMode === 'ai') {
                    autoGenerateAIOverlays(template.id);
                }
            } else {
                // Remove placeholder if generation failed
                setTemplates(prev => prev.filter(t => t.id !== newTemplateId));
                throw new Error('Failed to generate template');
            }
        } catch (err) {
            console.error('Error generating new template:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle generating a custom template with the user-provided prompt
    const handleGenerateCustomTemplate = async () => {
        if (!albumId || Images.length === 0) return;

        const promptToUse = customPromptWord.trim();
        if (!promptToUse) {
            // Use default prompt if custom prompt is empty
            return handleGenerateNewTemplate();
        }

        setIsLoading(true);

        try {
            // Check if the custom prompt contains non-English characters
            if (containsNonEnglishChars(promptToUse)) {
                // Detect source language (basic detection for Hebrew)
                const sourceLang = detectLanguage(promptToUse);

                // Translate the prompt to English
                const translated = await translateToEnglish(promptToUse);
                setTranslatedPromptWord(translated);

                // Log original and translated text
                // console.log(`Translated prompt: "${promptToUse}" → "${translated}" (detected: ${sourceLang})`);

                // If translation is empty or failed somehow, fall back to original text
                const finalPrompt = translated.trim() ? translated : promptToUse;

                // Generate template with translated prompt
                await generateCustomTemplateWithPrompt(finalPrompt);
            } else {
                // No translation needed
                setTranslatedPromptWord('');
                await generateCustomTemplateWithPrompt(promptToUse);
            }
        } catch (err) {
            console.error('Error handling custom template generation:', err);
            setError(err instanceof Error ? err : new Error('Failed to generate custom template'));
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to generate a custom template with a given prompt
    const generateCustomTemplateWithPrompt = async (promptText: string) => {
        const theme = eventCategory;
        const newTemplateId = `t${templates.length + 1}`;
        const styleIndex = Math.floor(Math.random() * templateStyles.length);
        const colorIndex = Math.floor(Math.random() * colorPalettes.length);

        // Add a placeholder for the new template
        const newTemplate: TemplateData = {
            id: newTemplateId,
            name: `${theme} ${templateStyles[styleIndex]} (Custom)`,
            theme,
            style: templateStyles[styleIndex],
            colors: colorPalettes[colorIndex],
            isLoading: true,
            imageLoading: true,
            promptWord: promptText,
            image: "",
        };

        setTemplates(prev => [newTemplate, ...prev]);

        // Generate the template image with the custom prompt
        const template = await generateSingleTemplate(
            newTemplateId,
            theme,
            templateStyles[styleIndex],
            colorPalettes[colorIndex],
            promptText
        );

        if (template) {
            // Update with the generated image
            setTemplates(prev => prev.map(t =>
                t.id === newTemplateId ? template : t
            ));

            // Select the new template
            setSelectedTemplate(newTemplateId);
            setCustomColors(template.colors);

            // Automatically generate AI overlays for this template
            if (overlayMode === 'ai') {
                autoGenerateAIOverlays(template.id);
            }

            // Reset the custom prompt input after successful generation
            setCustomPromptWord('');

            // Switch to suggested tab to view the new template
            setActiveTab('suggested');
        } else {
            // Remove placeholder if generation failed
            setTemplates(prev => prev.filter(t => t.id !== newTemplateId));
            throw new Error('Failed to generate custom template');
        }
    };

    // Handle template image load event
    const handleImageLoad = (templateId: string) => {
        setTemplates(prevTemplates =>
            prevTemplates.map(t =>
                t.id === templateId ? { ...t, imageLoading: false } : t
            )
        );
    };

    // Handle selecting a template from the library
    const handleSelectLibraryTemplate = (template: DesignTemplate) => {
        const newTemplateId = `t${templates.length + 1}`;

        // Create a new template from the library template
        const newTemplate: TemplateData = {
            id: newTemplateId,
            name: template.name,
            image: template.imageUrl,
            theme: template.category,
            style: template.style,
            colors: template.colors,
            promptWord: template.promptWord,
            isLoading: false,
            imageLoading: false
        };

        // Add the template to our templates list (at the beginning)
        setTemplates(prev => [newTemplate, ...prev]);

        // Select the new template
        setSelectedTemplate(newTemplateId);
        setCustomColors(template.colors);

        // Switch to suggested tab to view the selected template
        setActiveTab('suggested');
    };

    useEffect(() => {
        if (albumId && Images.length > 0 && templates.length === 0 && !isLoading) {
            const timer = setTimeout(() => {
                handleGenerateTemplates();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [albumId, Images, templates.length, isLoading]);

    if (!albumId) {
        return null; // Don't render if no albumId is provided
    }

    return (
        <div>
            <div className='w-full gap-4'>
                <div className="mb-6 p-4 h-auto row-start-1 col-span-4">
                    <h3 className="text-xl font-medium mb-2 py-2 text-end">Generate Prompt Custom Book Cover Design</h3>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={customPromptWord}
                            onChange={(e) => setCustomPromptWord(e.target.value)}
                            placeholder="Enter custom prompt (e.g., vibrant, modern, tropical)"
                            className="flex-1 border rounded-full p-2 text-sm"
                            style={{ textAlign: "right" }}
                        />
                        <button
                            onClick={handleGenerateCustomTemplate}
                            className="px-4 py-2 min-w-48 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || Images.length === 0 || isTranslating}
                        >
                            {isTranslating ? 'Translating...' : 'Generate'}
                        </button>
                    </div>

                    {/* AI Overlay Info */}
                    <div className="border-t pt-4 mt-4">
                        <div className="text-end mb-2">
                            <p className="text-sm text-purple-600 font-medium">✨ AI Overlays Enabled</p>
                            <p className="text-xs text-gray-500">Automatically generating people, travel, and bonding overlays for your templates</p>
                        </div>
                    </div>

                    <p className="text-xs text-end text-gray-500 mt-2">
                        {translatedPromptWord ?
                            `Translation: "${customPromptWord}" → "${translatedPromptWord}"` :
                            `Generate a unique template with your own descriptive words in any language. Leave blank to use default theme: "${promptWord}".`}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-10 gap-4 p-2 mt-5">
                <div className="col-start-1 col-span-8 p-4">
                    <h2 className="text-xl text-end font-bold mb-4">Generated Album Book Cover Designs</h2>
                    {detectedEventTags.length > 0 && (
                        <div className="p-3 mb-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
                            <p className="font-semibold"> {eventCategory}</p>
                            <p className="text-sm mt-1">Generate book cover design with {promptWord} themes based on your uploaded photos.</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                            <p>Error generating templates. Please try again later.</p>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full">
                            {templates.length === 0 && isLoading && (
                                <div className="flex justify-center my-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="text-gray-600">Generating book design templates...</p>
                                    </div>
                                </div>
                            )}

                            {templates.length === 0 && !isLoading && Images.length === 0 && (
                                <div className="text-center my-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <p className="text-gray-600">Please select cover images to generate templates</p>
                                </div>
                            )}

                            {isLoading && templates.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-8">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="mt-4 text-gray-600">Generating Cover Design based on your images analysis...</p>
                                </div>
                            )}

                            {templates.length > 0 && (
                                <div className="mb-4 border-b">
                                    <div className="flex">
                                        <button
                                            onClick={() => setActiveTab('suggested')}
                                            className={`px-4 py-2 font-medium ${activeTab === 'suggested'
                                                ? 'border-b-2 border-blue-500 text-blue-600'
                                                : 'text-gray-600 hover:text-gray-800'}`}
                                        >
                                            Suggested Book Cover Design
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Suggested Templates Tab */}
                            {activeTab === 'suggested' && templates.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div
                                        className="border rounded-lg overflow-hidden cursor-pointer bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center h-full p-4"
                                        onClick={handleGenerateNewTemplate}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="font-medium text-blue-600">Generate New Book Design</p>
                                    </div>
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className={`min-h-[500px] overflow-hidden cursor-pointer transition-all`}
                                            onClick={() => handleNavigateToAlbumBook(template.id)}
                                        >
                                            <div className="relative h-64">
                                                {template.isLoading || template.imageLoading ? (
                                                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                ) : template.image ? (
                                                    <div className="absolute w-full inset-0 borders">
                                                        {/* Background layer - Hugging Face generated image */}
                                                        <div className="absolute inset-0 z-10">
                                                            <img
                                                                src={template.image}
                                                                alt={`${template.name} background`}
                                                                className="w-full h-full object-cover bg-white"
                                                                onLoad={() => handleImageLoad(template.id)}
                                                                style={{
                                                                    border: '3px solid #bbb',
                                                                    boxShadow: '3px 3px 12px rgba(0,0,0,0.25)',
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Overlay image layer - User's or AI images on top */}
                                                        {(() => {
                                                            const settings = getOverlaySettings(template.id);
                                                            let overlayImage = null;
                                                            let hasValidOverlay = false;

                                                            if (overlayMode === 'ai') {
                                                                const aiImages = aiOverlayImages[template.id] || [];
                                                                if (aiImages.length > 0) {
                                                                    const currentIndex = overlayImageIndex[template.id] || 0;
                                                                    overlayImage = {
                                                                        previewUrl: aiImages[currentIndex % aiImages.length],
                                                                        s3Url: aiImages[currentIndex % aiImages.length],
                                                                        isAI: true
                                                                    };
                                                                    hasValidOverlay = true;
                                                                }
                                                            } else if (overlayMode === 'user' && Images && Images.length > 0) {
                                                                const currentIndex = overlayImageIndex[template.id] || 0;
                                                                overlayImage = Images[currentIndex];
                                                                hasValidOverlay = true;
                                                            }

                                                            if (!hasValidOverlay || !overlayImage) return null;

                                                            const positionClass = settings.position === 'top' ? 'items-start pt-4' :
                                                                settings.position === 'bottom' ? 'items-end pb-4' :
                                                                    'items-center';

                                                            return (
                                                                <div className={`absolute inset-0 z-20 flex justify-center ${positionClass}`}>
                                                                    <div
                                                                        className="relative overflow-hidden shadow-lg"
                                                                        style={{
                                                                            width: `${settings.size}%`,
                                                                            height: `${settings.size}%`,
                                                                            maxWidth: '280px',
                                                                            maxHeight: '200px'
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={overlayImage.previewUrl || overlayImage.s3Url}
                                                                            alt="Overlay image"
                                                                            className="w-full h-full object-cover"
                                                                            style={{
                                                                                opacity: settings.opacity / 100,
                                                                                border: '2px solid rgba(255,255,255,0.8)',
                                                                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                                                            }}
                                                                        />

                                                                        {/* Overlay controls - show when there are multiple overlays */}
                                                                        {getTotalOverlayCount(template.id) > 1 && (
                                                                            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-between p-2">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        cycleOverlayImageUpdated(template.id, 'prev');
                                                                                    }}
                                                                                    className="bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                                                                                >
                                                                                    &#8249;
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        cycleOverlayImageUpdated(template.id, 'next');
                                                                                    }}
                                                                                    className="bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                                                                                >
                                                                                    &#8250;
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                        {/* AI Overlay Generation Button for individual templates */}
                                                                        {overlayMode === 'ai' && (
                                                                            <div className="absolute bottom-2 left-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const prompt = `${template.style.toLowerCase()} ${eventCategory.toLowerCase()} overlay`;
                                                                                        generateAIOverlayImage(template.id, prompt);
                                                                                    }}
                                                                                    className="bg-purple-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded hover:bg-purple-700"
                                                                                    disabled={isGeneratingOverlay[template.id]}
                                                                                >
                                                                                    + AI Overlay
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                        {/* Optional: Add a subtle gradient overlay for better text visibility */}
                                                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-20"></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Book spine effect */}
                                                        <div
                                                            className="absolute top-0 left-0 bg-transparent w-[10px] blur-[1px] brightness-50 h-full brightness-60 z-30"
                                                            style={{
                                                                border: '1px groove #666',
                                                            }}
                                                        ></div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                                        <p className="text-gray-600 font-medium">No Template Background</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3">
                                                <p className="text-gray-600">{template.style}</p>
                                                <div className="flex mt-2 space-x-1">
                                                    {template.colors.map((color, index) => (
                                                        <div
                                                            key={index}
                                                            className="w-6 h-6 rounded-full border border-gray-200"
                                                            style={{ backgroundColor: color }}
                                                        ></div>
                                                    ))}
                                                </div>
                                                {template.promptWord && (
                                                    <p className="text-xs text-gray-500 mt-1">Theme: {template.promptWord}</p>
                                                )}
                                                <div className='mt-4'>
                                                    <button
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                                                        onClick={() => handleNavigateToAlbumBook(template.id)}
                                                    >
                                                        Select Cover Design
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Button to generate more templates */}
                                    {templates.length < maxSuggestedTemplates && (
                                        <div
                                            className="border rounded-lg overflow-hidden cursor-pointer bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center h-full p-4"
                                            onClick={handleGenerateTemplates}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-500 mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                            <p className="font-medium text-green-600">Generate More Templates</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className='col-start-9 col-span-10 bg-white p-4'>
                    <DesignTemplatesLibrary
                        promptWord={promptWord}
                        selectedCategory={selectedLibraryCategory}
                        onSelectTemplate={handleSelectLibraryTemplate}
                        onSelectCategory={setSelectedLibraryCategory}
                        currentEventCategory={eventCategory}
                    />
                </div>
            </div>
        </div>
    );
}

export default AutoTemplateGenerator;
