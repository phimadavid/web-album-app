"use client"
import React, { useState, useEffect } from 'react';
import { generateTemplateImage } from '@/lib/services/hf.generate.template';

export type DesignTemplate = {
    id: string;
    name: string;
    category: string;
    style: string;
    imageUrl: string;
    colors: string[];
    promptWord: string;
    description?: string;
    isLoading?: boolean;
    imageLoading?: boolean;
    errorMessage?: string;
};

export type DesignTemplateCategory = {
    id: string;
    name: string;
    description?: string;
    count?: number;
};

export interface DesignTemplatesLibraryProps {
    promptWord: string;
    selectedCategory: string;
    onSelectTemplate: (template: DesignTemplate) => void;
    onSelectCategory: (categoryId: string) => void;
    currentEventCategory?: string;
}

// Pre-defined categories
const TEMPLATE_CATEGORIES: DesignTemplateCategory[] = [
    { id: 'all', name: 'All Templates' },
    { id: 'wedding', name: 'Wedding' },
    { id: 'birthday', name: 'Birthday' },
    { id: 'concert', name: 'Concert' },
    { id: 'travel', name: 'Travel' },
    { id: 'sports', name: 'Sports' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'family', name: 'Family' },
    { id: 'holiday', name: 'Holiday' }
];

const DesignTemplatesLibrary: React.FC<DesignTemplatesLibraryProps> = ({
    promptWord,
    selectedCategory,
    onSelectTemplate,
    onSelectCategory,
    currentEventCategory
}) => {
    const [templates, setTemplates] = useState<DesignTemplate[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [generatingTemplate, setGeneratingTemplate] = useState<boolean>(false);
    const [hasAutoLoaded, setHasAutoLoaded] = useState<boolean>(false);

    // Generate a single template
    const generateSingleTemplate = async (
        templateId: string,
        style: string,
        category: string,
        colors: string[],
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

            // Return the complete template
            return {
                id: templateId,
                name: `${style} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                category: category,
                style: style,
                imageUrl: templateImage,
                colors: colors,
                promptWord: customPromptWord,
                description: `A ${style.toLowerCase()} template perfect for ${category} events.`,
                isLoading: false,
                imageLoading: false
            };
        } catch (error) {
            console.error(`Error generating template ${templateId}:`, error);
            return null;
        }
    };

    // Function to create templates for a category
    const generateTemplatesForCategory = async (categoryId: string) => {
        setIsLoading(true);

        // Clear any existing templates
        setTemplates([]);

        // Determine which categories to generate
        const categoriesToGenerate = categoryId === 'all'
            ? ['wedding', 'birthday', 'concert', 'travel', 'sports', 'corporate'] // Generate from 6 categories for "all"
            : [categoryId];

        // Expanded styles and colors for more variety
        const styles = [
            'Minimalist', 'Vintage', 'Modern', 'Elegant', 'Playful', 'Rustic',
            'Geometric', 'Classic', 'Bold', 'Artistic', 'Professional', 'Creative'
        ];

        const colorPalettes = [
            ['#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#355C7D'],
            ['#99B898', '#FECEAB', '#FF847C', '#E84A5F', '#2A363B'],
            ['#A8E6CE', '#DCEDC2', '#FFD3B5', '#FFAAA6', '#FF8C94'],
            ['#CAEBF2', '#A9A9A9', '#FF3B3F', '#EFEFEF', '#D3D3D3'],
            ['#FFE66D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
            ['#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'],
            ['#74B9FF', '#0984E3', '#00B894', '#00CEC9', '#6C5CE7'],
            ['#FD79A8', '#FDCB6E', '#E17055', '#81ECEC', '#A29BFE'],
            ['#2D3436', '#636E72', '#B2BEC3', '#DDD', '#FFF'],
            ['#FF7675', '#74B9FF', '#55A3FF', '#00B894', '#FDCB6E']
        ];

        try {
            // Create placeholder templates
            const placeholders: DesignTemplate[] = [];

            if (categoryId === 'all') {
                // Generate 2 templates per category for "all" (6 categories × 2 = 12 templates)
                for (const category of categoriesToGenerate) {
                    for (let i = 0; i < 2; i++) {
                        const styleIndex = (categoriesToGenerate.indexOf(category) * 2 + i) % styles.length;
                        const style = styles[styleIndex];
                        const colorPalette = colorPalettes[styleIndex % colorPalettes.length];
                        const templateId = `${category}-${style.toLowerCase()}-${Date.now()}-${i}`;
                        const customPrompt = `${promptWord} ${style.toLowerCase()} ${category}`;

                        placeholders.push({
                            id: templateId,
                            name: `${style} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                            category: category,
                            style: style,
                            imageUrl: '',
                            colors: colorPalette,
                            promptWord: customPrompt,
                            description: `A ${style.toLowerCase()} template perfect for ${category} events.`,
                            isLoading: true,
                            imageLoading: true
                        });
                    }
                }
            } else {
                // Generate 10 templates for specific category
                for (let i = 0; i < 10; i++) {
                    const style = styles[i % styles.length];
                    const colorPalette = colorPalettes[i % colorPalettes.length];
                    const templateId = `${categoryId}-${style.toLowerCase()}-${Date.now()}-${i}`;
                    const customPrompt = `${promptWord} ${style.toLowerCase()} ${categoryId}`;

                    placeholders.push({
                        id: templateId,
                        name: `${style} ${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}`,
                        category: categoryId,
                        style: style,
                        imageUrl: '',
                        colors: colorPalette,
                        promptWord: customPrompt,
                        description: `A ${style.toLowerCase()} template perfect for ${categoryId} events.`,
                        isLoading: true,
                        imageLoading: true
                    });
                }
            }

            // Add placeholders to state
            setTemplates(placeholders);

            // Generate actual templates
            for (let i = 0; i < placeholders.length; i++) {
                const placeholder = placeholders[i];

                const template = await generateSingleTemplate(
                    placeholder.id,
                    placeholder.style,
                    placeholder.category,
                    placeholder.colors,
                    placeholder.promptWord
                );

                if (template) {
                    // Update this specific template in the array
                    setTemplates(prevTemplates =>
                        prevTemplates.map(t => t.id === template.id ? template : t)
                    );
                } else {
                    // Update with error state
                    setTemplates(prevTemplates =>
                        prevTemplates.map(t =>
                            t.id === placeholder.id
                                ? {
                                    ...t,
                                    isLoading: false,
                                    imageLoading: false,
                                    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZDdkYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTMzMzMiPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
                                    errorMessage: 'Failed to generate template'
                                }
                                : t
                        )
                    );
                }
            }

        } catch (error) {
            console.error('Error generating templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle category selection
    const handleCategorySelect = async (categoryId: string) => {
        // Call parent handler
        onSelectCategory(categoryId);

        // Generate templates for this category
        await generateTemplatesForCategory(categoryId);
    };

    // Filter templates based on search term
    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.style.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Generate a template with AI
    const generateAITemplate = async () => {
        setGeneratingTemplate(true);
        try {
            // Get the style and category
            const style = templates[0]?.style || 'Modern';
            const category = selectedCategory === 'all' ? 'event' : selectedCategory;
            const customPromptWord = `${promptWord} ${style.toLowerCase()} ${category}`;
            const newTemplateId = `ai-template-${Date.now()}`;
            const colorPalette = templates[0]?.colors || ['#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#355C7D'];

            // Generate the template image
            const template = await generateSingleTemplate(
                newTemplateId,
                style,
                category,
                colorPalette,
                customPromptWord
            );

            // Add placeholder template with loading state
            const newTemplate: DesignTemplate = {
                id: newTemplateId,
                name: `AI ${style} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                category: category,
                style: style,
                imageUrl: '',
                colors: colorPalette,
                promptWord: customPromptWord,
                description: `An AI-generated ${style.toLowerCase()} template for ${category} events.`,
                isLoading: true,
                imageLoading: true
            };

            setTemplates(prev => [newTemplate, ...prev]);

            if (template) {
                // Update the template with the generated image
                setTemplates(prev =>
                    prev.map(t =>
                        t.id === newTemplateId ? template : t
                    )
                );
            } else {
                // Update with error state
                setTemplates(prev =>
                    prev.map(t =>
                        t.id === newTemplateId
                            ? {
                                ...t,
                                isLoading: false,
                                imageLoading: false,
                                imageUrl: '',
                                name: t.name + ' (Failed)',
                                errorMessage: 'Failed to generate template'
                            }
                            : t
                    )
                );
            }
        } catch (error) {
            console.error('Error generating AI template:', error);
        } finally {
            setGeneratingTemplate(false);
        }
    };

    // Handle image load event
    const handleImageLoad = (templateId: string) => {
        setTemplates(prevTemplates =>
            prevTemplates.map(t =>
                t.id === templateId ? { ...t, imageLoading: false } : t
            )
        );
    };

    // Handle image error event
    const handleImageError = (templateId: string) => {
        setTemplates(prevTemplates =>
            prevTemplates.map(t =>
                t.id === templateId ?
                    {
                        ...t,
                        imageLoading: false,
                        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZDdkYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTMzMzMiPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
                    } : t
            )
        );
    };

    // Auto-load templates when component mounts or when promptWord changes
    useEffect(() => {
        if (promptWord && !hasAutoLoaded && templates.length === 0 && !isLoading) {
            const timer = setTimeout(() => {
                generateTemplatesForCategory(selectedCategory);
                setHasAutoLoaded(true);
            }, 1000); // Delay to ensure component is fully mounted

            return () => clearTimeout(timer);
        }
    }, [promptWord, hasAutoLoaded, templates.length, isLoading, selectedCategory]);

    // Reset auto-load flag when selectedCategory changes
    useEffect(() => {
        setHasAutoLoaded(false);
    }, [selectedCategory]);

    return (
        <>
            <div className="flex items-center justify-between flex-row-reverse mb-4">
                <h2 className="text-xl font-bold">A.I Book Design Library</h2>
                {currentEventCategory && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {currentEventCategory}
                    </span>
                )}
            </div>

            {/* Categories */}
            <div className="mb-4 overflow-x-auto">
                <div className='flex flex-row justify-between items-center'>
                    <div className="space-x-3 space-y-2">
                        {TEMPLATE_CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => handleCategorySelect(category.id)}
                                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${selectedCategory === category.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
                {/*  Generate Book Design Button */}
                <button
                    onClick={generateAITemplate}
                    className="w-full px-4 py-2 mt-5 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center gap-2"
                    disabled={generatingTemplate || isLoading}
                >
                    {generatingTemplate ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Generate Book Design
                        </>
                    )}
                </button>
            </div>

            {/* Templates grid */}
            {isLoading && templates.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">No book cover design found. Select a category to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 mt-2 overflow-x-auto pr-2">
                    {filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => !template.isLoading && onSelectTemplate(template)}
                        >
                            <div className="h-32 bg-gray-100 relative">
                                {template.imageLoading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <span className="text-xs text-gray-500">Loading template...</span>
                                    </div>
                                ) : (
                                    <img
                                        src={template.imageUrl}
                                        alt={template.name}
                                        className="w-full h-full object-cover"
                                        onLoad={() => handleImageLoad(template.id)}
                                        onError={() => handleImageError(template.id)}
                                    />
                                )}

                                {/* Category badge */}
                                <div className="absolute top-2 left-2 bg-black bg-opacity-40 text-white text-xs px-2 py-1 rounded">
                                    {template.category}
                                </div>

                                {/* AI Badge for AI-generated templates */}
                                {template.id.startsWith('ai-') && !template.imageLoading && (
                                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        AI
                                    </div>
                                )}

                                {/* Error indicator */}
                                {template.errorMessage && (
                                    <div className="absolute bottom-2 right-2">
                                        <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                                            Error
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-2">
                                <h3 className="font-medium text-sm truncate">{template.name}</h3>
                                <div className="flex mt-1 space-x-1">
                                    {template.colors.slice(0, 3).map((color, index) => (
                                        <div
                                            key={index}
                                            className="w-4 h-4 rounded-full border border-gray-200"
                                            style={{ backgroundColor: color }}
                                        ></div>
                                    ))}
                                    {template.colors.length > 3 && (
                                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                            +{template.colors.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </>
    );
};

export default DesignTemplatesLibrary;
