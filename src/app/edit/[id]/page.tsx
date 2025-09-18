"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Image, Type, Palette, Download, Save, Grid, Layers, Move, RotateCcw, Trash2, Upload, Pen, Sticker, ArrowLeft, Eye, BookOpen, X } from 'lucide-react';
import Link from "next/link";
import { toast } from "react-toastify";
import { ThreeDots } from "react-loader-spinner";
import { AnimatePresence, motion } from "framer-motion";

// Import types from the dedicated types file
import {
    Element,
    ImageElement,
    TextElement,
    DrawingElement,
    StickerElement,
    DrawingPath,
    Page,
    Template,
    DragData,
    Tool,
    ExportOptions,
    DEFAULT_PAGE_SIZE
} from '../../editor-book/types';

// Import utility functions
import {
    createImageElement,
    createTextElement,
    createDrawingElement,
    createStickerElement,
    createDrawingPath,
    generateElementId,
    validateElement,
    handleError
} from '../../editor-book/utils';

import { useAlbumData } from "@/backend/services/actions/getAlbums";
import {
   AlbumDataProps,
   BookAlbumPageProps,
} from "../data-types/types";

const BookAlbumPage = ({ params }: BookAlbumPageProps) => {
    const paramsId = params.id;

    // Album data states
    const [isInitialized, setIsInitialized] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Editor states
    const [currentSpread, setCurrentSpread] = useState<number>(0);
    const [viewMode, setViewMode] = useState<'spread' | 'scroll'>('spread');
    const [pages, setPages] = useState<Page[]>([
        { id: 1, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
        { id: 2, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
        { id: 3, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
        { id: 4, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height }
    ]);
    const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
    const [selectedElement, setSelectedElement] = useState<Element | null>(null);
    const [draggedElement, setDraggedElement] = useState<Element | null>(null);
    const [tool, setTool] = useState<Tool>('select');
    const [showTemplates, setShowTemplates] = useState<boolean>(false);
    const [showImagePanel, setShowImagePanel] = useState<boolean>(false);
    const [showDrawPanel, setShowDrawPanel] = useState<boolean>(false);
    const [showStickerPanel, setShowStickerPanel] = useState<boolean>(false);
    const [showBackgroundPanel, setShowBackgroundPanel] = useState<boolean>(false);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [currentDrawingPath, setCurrentDrawingPath] = useState<DrawingPath | null>(null);
    const [drawingColor, setDrawingColor] = useState<string>('#000000');
    const [drawingWidth, setDrawingWidth] = useState<number>(2);
    const [backgroundMode, setBackgroundMode] = useState<'color' | 'library' | 'ai'>('color');
    const [aiPrompt, setAiPrompt] = useState<string>('');
    const [backgroundIntensity, setBackgroundIntensity] = useState<number>(0.5);
    const [isGeneratingBackground, setIsGeneratingBackground] = useState<boolean>(false);
    const [selectedLibraryBackground, setSelectedLibraryBackground] = useState<string>('');
    const [backgroundScope, setBackgroundScope] = useState<'current' | 'all'>('current');
    const [showTextInput, setShowTextInput] = useState<boolean>(false);
    const [textInputValue, setTextInputValue] = useState<string>('');
    const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [showAdvancedTextPanel, setShowAdvancedTextPanel] = useState<boolean>(false);
    const [textStyles, setTextStyles] = useState({
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#333333',
        fontWeight: 'normal' as 'normal' | 'bold',
        textDecoration: 'none' as 'none' | 'underline' | 'overline' | 'line-through',
        textAlign: 'left' as 'left' | 'center' | 'right' | 'justify',
        lineHeight: 1.2,
        letterSpacing: 0,
        textTransform: 'none' as 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    });
    const [savedTextStyles, setSavedTextStyles] = useState<any[]>([]);
    const [showAIContentPanel, setShowAIContentPanel] = useState<boolean>(false);
    const [aiContentType, setAiContentType] = useState<'caption' | 'headline' | 'paragraph'>('caption');
    const [aiTone, setAiTone] = useState<'humorous' | 'sentimental' | 'poetic' | 'formal' | 'casual'>('casual');
    const [aiStyle, setAiStyle] = useState<'single' | 'paragraph' | 'question' | 'quote'>('single');
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
    const [recentImages, setRecentImages] = useState<any[]>([]);
    const [loadingRecentImages, setLoadingRecentImages] = useState<boolean>(false);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeHandle, setResizeHandle] = useState<string>('');
    const [resizeStartPos, setResizeStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const {
        albumData,
        error,
        isLoading,
        setAlbumData,
        handleSaveAlbumName,
    } = useAlbumData(params.id);

    // Convert album images to editor pages
    const convertAlbumToEditorPages = useCallback((albumData: AlbumDataProps): Page[] => {
        if (!albumData?.images || albumData.images.length === 0) {
            // Return default empty pages if no images
            return [
                { id: 1, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
                { id: 2, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
            ];
        }

        const pages: Page[] = [];
        const imagesPerPage = 2; // Adjust based on your layout preference
        
        // Create pages with images
        for (let i = 0; i < albumData.images.length; i += imagesPerPage) {
            const pageImages = albumData.images.slice(i, i + imagesPerPage);
            const elements: Element[] = [];

            pageImages.forEach((image, index) => {
                if (image?.s3Url) {
                    try {
                        // Position images side by side or in a grid
                        const x = index === 0 ? 50 : 270;
                        const y = 50;
                        
                        const imageElement = createImageElement(
                            { x, y },
                            image.s3Url,
                            { 
                                width: 200, 
                                height: 150, 
                                rotation: image.metadata?.rotation || 0,
                                alt: `Image ${i + index + 1}`
                            }
                        );

                        const validation = validateElement(imageElement);
                        if (validation.isValid) {
                            elements.push(imageElement);
                        }
                    } catch (error) {
                        console.error('Error creating image element:', error);
                    }
                }
            });

            pages.push({
                id: Math.floor(i / imagesPerPage) + 1,
                elements,
                background: '#ffffff',
                width: DEFAULT_PAGE_SIZE.width,
                height: DEFAULT_PAGE_SIZE.height,
                name: `Page ${Math.floor(i / imagesPerPage) + 1}`
            });
        }

        // Ensure we have at least 2 pages
        if (pages.length === 0) {
            pages.push(
                { id: 1, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
                { id: 2, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height }
            );
        } else if (pages.length === 1) {
            pages.push({ id: 2, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height });
        }

        return pages;
    }, []);

    // Initialize editor pages when album data is loaded
    useEffect(() => {
        if (albumData && !isInitialized && !isLoading) {
            setIsConverting(true);
            try {
                const convertedPages = convertAlbumToEditorPages(albumData);
                setPages(convertedPages);
                setIsInitialized(true);
            } catch (error) {
                console.error('Error converting album to editor pages:', error);
                toast.error('Failed to initialize editor');
            } finally {
                setIsConverting(false);
            }
        }
    }, [albumData, isInitialized, isLoading, convertAlbumToEditorPages]);

    // Predefined background library
    const backgroundLibrary = [
        {
            id: 'nature-1',
            name: 'Mountain Lake',
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center',
            category: 'Nature'
        },
        {
            id: 'nature-2',
            name: 'Forest Path',
            url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center',
            category: 'Nature'
        },
        {
            id: 'abstract-1',
            name: 'Geometric Waves',
            url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop&crop=center',
            category: 'Abstract'
        },
        {
            id: 'abstract-2',
            name: 'Color Gradient',
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center',
            category: 'Abstract'
        },
        {
            id: 'texture-1',
            name: 'Paper Texture',
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center',
            category: 'Texture'
        },
        {
            id: 'texture-2',
            name: 'Marble Pattern',
            url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
            category: 'Texture'
        }
    ];

    // Generate AI background
    const generateAIBackground = useCallback(async () => {
        if (!aiPrompt.trim()) {
            toast.error('Please enter a description for the background');
            return;
        }

        setIsGeneratingBackground(true);
        try {
            // Mock AI generation - replace with actual AI service call
            const response = await fetch('/api/generate/background', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    intensity: backgroundIntensity,
                    dimensions: { width: 800, height: 600 }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const backgroundUrl = data.imageUrl;
                
                // Apply the generated background
                applyBackgroundImage(backgroundUrl);
                
                toast.success('AI background generated successfully!');
                setAiPrompt('');
            } else {
                // Fallback to a placeholder for demo
                const placeholderUrl = `https://via.placeholder.com/800x600/4f46e5/ffffff?text=${encodeURIComponent(aiPrompt)}`;
                applyBackgroundImage(placeholderUrl);
                toast.info('Using placeholder - AI service not available');
            }
        } catch (error) {
            console.error('Error generating AI background:', error);
            // Fallback to a placeholder
            const placeholderUrl = `https://via.placeholder.com/800x600/4f46e5/ffffff?text=${encodeURIComponent(aiPrompt)}`;
            applyBackgroundImage(placeholderUrl);
            toast.info('Using placeholder - AI service not available');
        } finally {
            setIsGeneratingBackground(false);
        }
    }, [aiPrompt, backgroundIntensity]);

    // Apply background image with intensity
    const applyBackgroundImage = useCallback((imageUrl: string) => {
        const targetPages = backgroundScope === 'all' ? 
            Array.from({ length: pages.length }, (_, i) => i) : 
            [selectedPageIndex];

        setPages(prevPages => prevPages.map((page, index) => {
            if (targetPages.includes(index)) {
                return {
                    ...page,
                    background: `linear-gradient(rgba(255,255,255,${1 - backgroundIntensity}), rgba(255,255,255,${1 - backgroundIntensity})), url(${imageUrl})`,
                    backgroundImage: imageUrl,
                    backgroundIntensity: backgroundIntensity
                };
            }
            return page;
        }));

        const scopeText = backgroundScope === 'all' ? 'all pages' : `page ${selectedPageIndex + 1}`;
        toast.success(`Background applied to ${scopeText}!`);
    }, [backgroundScope, selectedPageIndex, pages.length, backgroundIntensity]);

    // Templates with proper typing
    const templates: Template[] = [
        {
            id: 'classic-layout',
            name: 'Classic Layout',
            elements: [
                createImageElement(
                    { x: 50, y: 50 },
                    '/api/placeholder/200/150',
                    { width: 200, height: 150, rotation: 0 }
                ),
                createTextElement(
                    { x: 50, y: 220 },
                    'Your Story Here',
                    { width: 200, height: 40, fontSize: 18, color: '#333333', rotation: 0 }
                )
            ]
        },
        {
            id: 'photo-grid',
            name: 'Photo Grid',
            elements: [
                createImageElement(
                    { x: 30, y: 30 },
                    '/api/placeholder/120/90',
                    { width: 120, height: 90, rotation: 0 }
                ),
                createImageElement(
                    { x: 170, y: 30 },
                    '/api/placeholder/120/90',
                    { width: 120, height: 90, rotation: 0 }
                ),
                createImageElement(
                    { x: 30, y: 140 },
                    '/api/placeholder/120/90',
                    { width: 120, height: 90, rotation: 0 }
                ),
                createImageElement(
                    { x: 170, y: 140 },
                    '/api/placeholder/120/90',
                    { width: 120, height: 90, rotation: 0 }
                )
            ]
        },
        {
            id: 'title-page',
            name: 'Title Page',
            elements: [
                createTextElement(
                    { x: 100, y: 80 },
                    'Our Photo Book',
                    { width: 300, height: 60, fontSize: 28, color: '#2c3e50', rotation: 0 }
                ),
                createTextElement(
                    { x: 100, y: 150 },
                    'Memories to Cherish',
                    { width: 300, height: 30, fontSize: 16, color: '#7f8c8d', rotation: 0 }
                ),
                createImageElement(
                    { x: 150, y: 200 },
                    '/api/placeholder/200/150',
                    { width: 200, height: 150, rotation: 0 }
                )
            ]
        }
    ];

    // Add new page
    const addPage = useCallback((): void => {
        const newPage: Page = {
            id: pages.length + 1,
            elements: [],
            background: '#ffffff',
            width: DEFAULT_PAGE_SIZE.width,
            height: DEFAULT_PAGE_SIZE.height
        };
        setPages(prevPages => [...prevPages, newPage]);
    }, [pages.length]);

    // Apply template to current page
    const applyTemplate = useCallback((template: Template): void => {
        const newElements: Element[] = template.elements.map(el => ({
            ...el,
            id: generateElementId(el.type)
        }));

        setPages(prevPages => prevPages.map((page, index) =>
            index === selectedPageIndex
                ? { ...page, elements: newElements }
                : page
        ));
        setShowTemplates(false);
    }, [selectedPageIndex]);

    // Handle file upload from modal
    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target?.result && typeof e.target.result === 'string') {
                    try {
                        const newElement = createImageElement(
                            { x: 100, y: 100 },
                            e.target.result,
                            { width: 200, height: 150, rotation: 0 }
                        );

                        const validation = validateElement(newElement);
                        if (!validation.isValid) {
                            console.error('Invalid element created:', validation.errors);
                            return;
                        }

                        setPages(prevPages => prevPages.map((page, index) =>
                            index === selectedPageIndex
                                ? { ...page, elements: [...page.elements, newElement] }
                                : page
                        ));

                        // Close panel and select the new image element
                        setShowImagePanel(false);
                        setSelectedElement(newElement);
                    } catch (error) {
                        const editorError = handleError(error, 'File upload');
                        console.error('Error uploading file:', editorError);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset file input
        if (event.target) {
            event.target.value = '';
        }
    }, [selectedPageIndex]);

    // Handle modal file upload trigger
    const handleModalFileUpload = useCallback((): void => {
        fileInputRef.current?.click();
    }, []);

    // Enhanced add text element with Smart Text & Storytelling Suite
    const addText = useCallback((position?: { x: number; y: number }): void => {
        const textPosition = position || { x: 150, y: 150 };
        
        // Show advanced text panel instead of simple input
        setTextInputPosition(textPosition);
        setTextInputValue('');
        setShowAdvancedTextPanel(true);
        
        // Focus the input after a brief delay to ensure it's rendered
        setTimeout(() => {
            textInputRef.current?.focus();
        }, 100);
    }, []);

    // Generate AI content suggestions
    const generateAIContent = useCallback(async () => {
        setIsGeneratingAI(true);
        try {
            // Analyze current page context
            const currentPage = pages[selectedPageIndex];
            const imageElements = currentPage.elements.filter(el => el.type === 'image');
            const hasImages = imageElements.length > 0;
            
            // Mock AI content generation based on context
            const contextPrompt = hasImages 
                ? `Generate ${aiContentType} for a photo album page with ${imageElements.length} image(s). Tone: ${aiTone}, Style: ${aiStyle}`
                : `Generate ${aiContentType} for a photo album page. Tone: ${aiTone}, Style: ${aiStyle}`;

            // Simulate API call to AI service
            const response = await fetch('/api/generate/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: aiContentType,
                    tone: aiTone,
                    style: aiStyle,
                    context: contextPrompt,
                    albumName: albumData?.bookName || 'Photo Album',
                    pageNumber: selectedPageIndex + 1
                }),
            });

            let suggestions: string[] = [];

            if (response.ok) {
                const data = await response.json();
                suggestions = data.suggestions || [];
            } else {
                // Fallback suggestions based on type and tone
                suggestions = generateFallbackSuggestions(aiContentType, aiTone, aiStyle);
            }

            setAiSuggestions(suggestions);
            toast.success('AI content generated successfully!');
        } catch (error) {
            console.error('Error generating AI content:', error);
            // Use fallback suggestions
            const suggestions = generateFallbackSuggestions(aiContentType, aiTone, aiStyle);
            setAiSuggestions(suggestions);
            toast.info('Using sample suggestions - AI service not available');
        } finally {
            setIsGeneratingAI(false);
        }
    }, [aiContentType, aiTone, aiStyle, pages, selectedPageIndex, albumData?.bookName]);

    // Generate fallback suggestions
    const generateFallbackSuggestions = useCallback((type: string, tone: string, style: string): string[] => {
        const suggestions: { [key: string]: { [key: string]: { [key: string]: string[] } } } = {
            caption: {
                casual: {
                    single: [
                        "Another beautiful moment captured!",
                        "Making memories that last forever.",
                        "Life is better with friends like these.",
                        "Perfect day, perfect memories."
                    ],
                    paragraph: [
                        "This moment perfectly captures the joy and laughter we shared together. Sometimes the best memories are made in the simplest moments.",
                        "Looking back at this photo brings back all the wonderful feelings from that day. These are the moments that make life truly special."
                    ],
                    question: [
                        "Can you remember a moment that made you smile this wide?",
                        "What makes this memory so special to you?",
                        "Isn't it amazing how one photo can bring back so many feelings?"
                    ],
                    quote: [
                        "\"The best things in life are the people we love, the places we've been, and the memories we've made along the way.\"",
                        "\"Life is not measured by the number of breaths we take, but by the moments that take our breath away.\""
                    ]
                },
                sentimental: {
                    single: [
                        "Treasured moments like these warm the heart.",
                        "Some memories are too beautiful for words.",
                        "In this moment, everything was perfect.",
                        "A memory to hold close to the heart forever."
                    ],
                    paragraph: [
                        "This photograph holds within it all the love, laughter, and joy of that precious day. It reminds us that the most beautiful moments are often the simplest ones.",
                        "Years may pass, but the warmth of this memory will remain forever etched in our hearts. This is what true happiness looks like."
                    ]
                },
                humorous: {
                    single: [
                        "When life gives you lemons, take a selfie!",
                        "Proof that we clean up pretty well!",
                        "Warning: May cause excessive smiling.",
                        "This is our 'we're totally adults' face."
                    ]
                },
                poetic: {
                    single: [
                        "Like golden threads woven through time's tapestry.",
                        "In this frame, eternity whispers softly.",
                        "Where laughter dances with the light of memory.",
                        "A moment suspended between heartbeats."
                    ]
                },
                formal: {
                    single: [
                        "A cherished memory from our family gathering.",
                        "Commemorating this special occasion with gratitude.",
                        "Celebrating the bonds that unite us.",
                        "A testament to the joy found in togetherness."
                    ]
                }
            },
            headline: {
                casual: {
                    single: [
                        "The Best Day Ever!",
                        "Making Memories",
                        "Good Times & Great Friends",
                        "Life is Beautiful"
                    ]
                },
                sentimental: {
                    single: [
                        "Moments That Matter Most",
                        "Love, Laughter & Legacy",
                        "Hearts Full of Gratitude",
                        "Forever in Our Hearts"
                    ]
                },
                humorous: {
                    single: [
                        "Squad Goals Achieved!",
                        "Professional Fun-Havers",
                        "Chaos & Happiness",
                        "Warning: Extreme Cuteness Ahead"
                    ]
                }
            },
            paragraph: {
                casual: {
                    paragraph: [
                        "What an incredible day this was! From the moment we woke up to the time we finally said goodbye, every minute was filled with laughter, joy, and the kind of memories that make life worth living. These are the days we'll look back on and smile.",
                        "Sometimes the best adventures are the ones that happen right in your own backyard. This day reminded us that happiness isn't about where you are, but who you're with and how you choose to see the world around you."
                    ]
                },
                sentimental: {
                    paragraph: [
                        "In the tapestry of our lives, days like this shine like golden threads. Every smile, every laugh, every shared glance becomes a treasure that time cannot diminish. This is what love looks like - not just in grand gestures, but in quiet moments of pure joy.",
                        "As I look at this memory captured in time, my heart overflows with gratitude. For the people who fill our lives with meaning, for the moments that take our breath away, and for the love that binds us all together in this beautiful journey called life."
                    ]
                }
            }
        };

        const typeData = suggestions[type] || suggestions.caption;
        const toneData = typeData[tone] || typeData.casual;
        const styleData = toneData[style] || toneData.single;
        
        return styleData || [
            "A beautiful moment captured in time.",
            "Memories that will last forever.",
            "Life's precious moments."
        ];
    }, []);

    // Generate variations of selected suggestion
    const generateVariations = useCallback(async (baseSuggestion: string) => {
        setIsGeneratingAI(true);
        try {
            // Mock variation generation
            const variations = [
                baseSuggestion,
                baseSuggestion.replace(/beautiful/gi, 'wonderful'),
                baseSuggestion.replace(/moment/gi, 'memory'),
                baseSuggestion + ' ✨',
                '✨ ' + baseSuggestion
            ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

            setAiSuggestions(variations);
            toast.success('Variations generated!');
        } catch (error) {
            console.error('Error generating variations:', error);
            toast.error('Failed to generate variations');
        } finally {
            setIsGeneratingAI(false);
        }
    }, []);

    // Save custom text style
    const saveTextStyle = useCallback(() => {
        const styleName = prompt('Enter a name for this style:');
        if (styleName && styleName.trim()) {
            const newStyle = {
                id: Date.now().toString(),
                name: styleName.trim(),
                ...textStyles
            };
            setSavedTextStyles(prev => [...prev, newStyle]);
            toast.success(`Style "${styleName}" saved!`);
        }
    }, [textStyles]);

    // Apply saved text style
    const applyTextStyle = useCallback((style: any) => {
        setTextStyles({
            fontFamily: style.fontFamily || 'Arial',
            fontSize: style.fontSize || 16,
            color: style.color || '#333333',
            fontWeight: style.fontWeight || 'normal',
            textDecoration: style.textDecoration || 'none',
            textAlign: style.textAlign || 'left',
            lineHeight: style.lineHeight || 1.2,
            letterSpacing: style.letterSpacing || 0,
            textTransform: style.textTransform || 'none'
        });
        toast.success(`Style "${style.name}" applied!`);
    }, []);

    // Create text element with advanced styling
    const createAdvancedTextElement = useCallback((text: string) => {
        try {
            const newElement = createTextElement(
                textInputPosition,
                text,
                {
                    width: 200,
                    height: 40,
                    fontSize: textStyles.fontSize,
                    color: textStyles.color,
                    rotation: 0,
                    fontFamily: textStyles.fontFamily,
                    fontWeight: textStyles.fontWeight,
                    textDecoration: textStyles.textDecoration,
                    textAlign: textStyles.textAlign,
                    lineHeight: textStyles.lineHeight,
                    letterSpacing: textStyles.letterSpacing,
                    textTransform: textStyles.textTransform
                }
            );

            const validation = validateElement(newElement);
            if (!validation.isValid) {
                console.error('Invalid element created:', validation.errors);
                return;
            }

            setPages(prevPages => prevPages.map((page, index) =>
                index === selectedPageIndex
                    ? { ...page, elements: [...page.elements, newElement] }
                    : page
            ));

            setSelectedElement(newElement);
            setShowAdvancedTextPanel(false);
            setShowAIContentPanel(false);
            setTextInputValue('');
            setAiSuggestions([]);
            setSelectedSuggestion('');
            
            toast.success('Text added successfully!');
        } catch (error) {
            const editorError = handleError(error, 'Create advanced text element');
            console.error('Error creating advanced text element:', editorError);
        }
    }, [textInputPosition, textStyles, selectedPageIndex, validateElement, createTextElement, handleError]);

    // Handle text input submission
    const handleTextInputSubmit = useCallback((): void => {
        if (!textInputValue.trim()) {
            setShowTextInput(false);
            return;
        }

        try {
            const newElement = createTextElement(
                textInputPosition,
                textInputValue,
                { width: 200, height: 40, fontSize: 16, color: '#333333', rotation: 0 }
            );

            const validation = validateElement(newElement);
            if (!validation.isValid) {
                console.error('Invalid element created:', validation.errors);
                setShowTextInput(false);
                return;
            }

            setPages(prevPages => prevPages.map((page, index) =>
                index === selectedPageIndex
                    ? { ...page, elements: [...page.elements, newElement] }
                    : page
            ));

            // Close input and select the new text element
            setShowTextInput(false);
            setTextInputValue('');
            setSelectedElement(newElement);
        } catch (error) {
            const editorError = handleError(error, 'Add text element');
            console.error('Error adding text element:', editorError);
            setShowTextInput(false);
        }
    }, [textInputValue, textInputPosition, selectedPageIndex]);

    // Handle text input cancel
    const handleTextInputCancel = useCallback((): void => {
        setShowTextInput(false);
        setTextInputValue('');
    }, []);

    // Update element
    const updateElement = useCallback((elementId: string, updates: Partial<Element>): void => {
        setPages(prevPages => prevPages.map((page, index) =>
            index === selectedPageIndex
                ? {
                    ...page,
                    elements: page.elements.map(el =>
                        el.id === elementId ? { ...el, ...updates } as Element : el
                    )
                }
                : page
        ));
    }, [selectedPageIndex]);

    // Delete element
    const deleteElement = useCallback((elementId: string): void => {
        setPages(prevPages => prevPages.map((page, index) =>
            index === selectedPageIndex
                ? {
                    ...page,
                    elements: page.elements.filter(el => el.id !== elementId)
                }
                : page
        ));
        setSelectedElement(null);
    }, [selectedPageIndex]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent, handle: string, element: Element): void => {
        e.stopPropagation();
        e.preventDefault();
        
        const startPos = { x: e.clientX, y: e.clientY };
        const startSize = { width: element.width, height: element.height };
        const startPosition = { x: element.x, y: element.y };
        
        setIsResizing(true);
        setResizeHandle(handle);
        
        // Add global mouse event listeners
        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startPos.x;
            const deltaY = e.clientY - startPos.y;
            
            let newWidth = startSize.width;
            let newHeight = startSize.height;
            let newX = startPosition.x;
            let newY = startPosition.y;
            
            // Calculate new dimensions based on resize handle
            switch (handle) {
                case 'se': // Bottom-right
                    newWidth = Math.max(20, startSize.width + deltaX);
                    newHeight = Math.max(20, startSize.height + deltaY);
                    break;
                case 'sw': // Bottom-left
                    newWidth = Math.max(20, startSize.width - deltaX);
                    newHeight = Math.max(20, startSize.height + deltaY);
                    newX = startPosition.x + (startSize.width - newWidth);
                    break;
                case 'ne': // Top-right
                    newWidth = Math.max(20, startSize.width + deltaX);
                    newHeight = Math.max(20, startSize.height - deltaY);
                    newY = startPosition.y + (startSize.height - newHeight);
                    break;
                case 'nw': // Top-left
                    newWidth = Math.max(20, startSize.width - deltaX);
                    newHeight = Math.max(20, startSize.height - deltaY);
                    newX = startPosition.x + (startSize.width - newWidth);
                    newY = startPosition.y + (startSize.height - newHeight);
                    break;
                case 'n': // Top
                    newHeight = Math.max(20, startSize.height - deltaY);
                    newY = startPosition.y + (startSize.height - newHeight);
                    break;
                case 's': // Bottom
                    newHeight = Math.max(20, startSize.height + deltaY);
                    break;
                case 'e': // Right
                    newWidth = Math.max(20, startSize.width + deltaX);
                    break;
                case 'w': // Left
                    newWidth = Math.max(20, startSize.width - deltaX);
                    newX = startPosition.x + (startSize.width - newWidth);
                    break;
            }
            
            // Ensure element stays within page bounds
            newX = Math.max(0, Math.min(newX, DEFAULT_PAGE_SIZE.width - newWidth));
            newY = Math.max(0, Math.min(newY, DEFAULT_PAGE_SIZE.height - newHeight));
            newWidth = Math.min(newWidth, DEFAULT_PAGE_SIZE.width - newX);
            newHeight = Math.min(newHeight, DEFAULT_PAGE_SIZE.height - newY);
            
            // Update element
            updateElement(element.id, {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            });
        };
        
        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeHandle('');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [updateElement]);

    // Render resize handles for selected element
    const renderResizeHandles = useCallback((element: Element) => {
        if (!selectedElement || selectedElement.id !== element.id) return null;
        
        const handleSize = 8;
        const handles = [
            { position: 'nw', cursor: 'nw-resize', style: { top: -handleSize/2, left: -handleSize/2 } },
            { position: 'n', cursor: 'n-resize', style: { top: -handleSize/2, left: '50%', transform: 'translateX(-50%)' } },
            { position: 'ne', cursor: 'ne-resize', style: { top: -handleSize/2, right: -handleSize/2 } },
            { position: 'e', cursor: 'e-resize', style: { top: '50%', right: -handleSize/2, transform: 'translateY(-50%)' } },
            { position: 'se', cursor: 'se-resize', style: { bottom: -handleSize/2, right: -handleSize/2 } },
            { position: 's', cursor: 's-resize', style: { bottom: -handleSize/2, left: '50%', transform: 'translateX(-50%)' } },
            { position: 'sw', cursor: 'sw-resize', style: { bottom: -handleSize/2, left: -handleSize/2 } },
            { position: 'w', cursor: 'w-resize', style: { top: '50%', left: -handleSize/2, transform: 'translateY(-50%)' } }
        ];
        
        return (
            <>
                {handles.map((handle) => (
                    <div
                        key={handle.position}
                        className="absolute bg-blue-500 border-2 border-white rounded-full hover:bg-blue-600 transition-colors z-10"
                        style={{
                            width: handleSize,
                            height: handleSize,
                            cursor: handle.cursor,
                            ...handle.style
                        }}
                        onMouseDown={(e) => handleResizeStart(e, handle.position, element)}
                    />
                ))}
            </>
        );
    }, [selectedElement, handleResizeStart]);

    // Optimized drag start with smooth performance
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, element: Element): void => {
        setDraggedElement(element);
        const rect = e.currentTarget.getBoundingClientRect();
        const dragData: DragData = {
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            elementId: element.id
        };
        
        // Set drag image for smoother visual feedback
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.transform = 'rotate(0deg)';
        dragImage.style.opacity = '0.8';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, dragData.offsetX, dragData.offsetY);
        
        // Clean up drag image after a short delay
        setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 0);
        
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
        
        // Add visual feedback to original element
        e.currentTarget.style.opacity = '0.5';
    }, []);

    // Optimized drag over with throttling
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    // Enhanced drop handler with smooth positioning
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetPageIndex: number): void => {
        e.preventDefault();
        if (!draggedElement) return;

        const rect = e.currentTarget.getBoundingClientRect();
        try {
            const data: DragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // Calculate new position with smooth snapping
            const rawX = e.clientX - rect.left - data.offsetX;
            const rawY = e.clientY - rect.top - data.offsetY;
            
            // Smooth boundary constraints
            const newX = Math.max(0, Math.min(rawX, DEFAULT_PAGE_SIZE.width - draggedElement.width));
            const newY = Math.max(0, Math.min(rawY, DEFAULT_PAGE_SIZE.height - draggedElement.height));

            // Find the source page index
            const sourcePageIndex = pages.findIndex(page => 
                page.elements.some(el => el.id === draggedElement.id)
            );

            if (sourcePageIndex === -1) {
                console.error('Source page not found for dragged element');
                setDraggedElement(null);
                return;
            }

            // Create updated element with new position
            const updatedElement = {
                ...draggedElement,
                x: newX,
                y: newY
            };

            // Batch update for better performance
            setPages(prevPages => {
                const newPages = [...prevPages];
                
                // Remove element from source page
                if (sourcePageIndex !== targetPageIndex) {
                    newPages[sourcePageIndex] = {
                        ...newPages[sourcePageIndex],
                        elements: newPages[sourcePageIndex].elements.filter(el => el.id !== draggedElement.id)
                    };
                }
                
                // Add/update element on target page
                newPages[targetPageIndex] = {
                    ...newPages[targetPageIndex],
                    elements: sourcePageIndex === targetPageIndex 
                        ? newPages[targetPageIndex].elements.map(el => 
                            el.id === draggedElement.id ? updatedElement : el
                          )
                        : [...newPages[targetPageIndex].elements, updatedElement]
                };
                
                return newPages;
            });

            // Update selected page and element
            setSelectedPageIndex(targetPageIndex);
            setSelectedElement(updatedElement);
            setDraggedElement(null);
            
        } catch (error) {
            console.error('Error parsing drag data:', error);
            setDraggedElement(null);
        }
    }, [draggedElement, pages]);

    // Handle drawing events
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, pageIndex: number): void => {
        if (tool !== 'draw') return;

        setSelectedPageIndex(pageIndex);
        setIsDrawing(true);

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newPath = createDrawingPath([{ x, y }], drawingColor, drawingWidth);
        setCurrentDrawingPath(newPath);
    }, [tool, drawingColor, drawingWidth]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        if (!isDrawing || tool !== 'draw' || !currentDrawingPath) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentDrawingPath(prevPath => {
            if (!prevPath) return null;
            return {
                ...prevPath,
                points: [...prevPath.points, { x, y }]
            };
        });
    }, [isDrawing, tool, currentDrawingPath]);

    const handleMouseUp = useCallback((): void => {
        if (!isDrawing || tool !== 'draw' || !currentDrawingPath) return;

        setIsDrawing(false);

        // Create a drawing element with the completed path
        try {
            const newElement = createDrawingElement(
                { x: 0, y: 0 },
                [currentDrawingPath],
                { width: 500, height: 400, strokeColor: drawingColor, strokeWidth: drawingWidth }
            );

            const validation = validateElement(newElement);
            if (!validation.isValid) {
                console.error('Invalid drawing element created:', validation.errors);
                setCurrentDrawingPath(null);
                return;
            }

            setPages(prevPages => prevPages.map((page, index) =>
                index === selectedPageIndex
                    ? { ...page, elements: [...page.elements, newElement] }
                    : page
            ));

            setCurrentDrawingPath(null);
            setSelectedElement(newElement);
        } catch (error) {
            const editorError = handleError(error, 'Create drawing element');
            console.error('Error creating drawing element:', editorError);
        }
    }, [isDrawing, tool, currentDrawingPath, drawingColor, drawingWidth, selectedPageIndex]);

    // Handle text edit
    const handleTextEdit = useCallback((elementId: string, newText: string): void => {
        updateElement(elementId, { text: newText });
    }, [updateElement]);

    // Change background for selected page or all pages based on scope
    const changeBackground = useCallback((color: string): void => {
        const targetPages = backgroundScope === 'all' ? 
            Array.from({ length: pages.length }, (_, i) => i) : 
            [selectedPageIndex];

        setPages(prevPages => prevPages.map((page, index) => {
            if (targetPages.includes(index)) {
                return { ...page, background: color };
            }
            return page;
        }));

        // Single toast notification
        const scopeText = backgroundScope === 'all' ? 'all pages' : `page ${selectedPageIndex + 1}`;
        toast.success(`Background color applied to ${scopeText}!`);
    }, [selectedPageIndex, backgroundScope, pages.length]);

    // Handle save from editor
    const handleEditorSave = useCallback(async (pagesToSave?: Page[]) => {
        const currentPages = pagesToSave || pages;
        setIsSaving(true);
        try {
            // Here you could save the editor pages to your backend
            // For now, we'll just save to localStorage and show success
            localStorage.setItem(`photobook-${paramsId}`, JSON.stringify(currentPages));
            
            toast.success("Photobook saved successfully!", {
                position: "bottom-right",
                autoClose: 2000,
            });
        } catch (error) {
            console.error("Error saving photobook:", error);
            toast.error("Failed to save photobook", {
                position: "bottom-right",
                autoClose: 2000,
            });
        } finally {
            setIsSaving(false);
        }
    }, [pages, paramsId]);

    // Handle export from editor
    const handleEditorExport = useCallback(async (pagesToExport?: Page[], options?: ExportOptions) => {
        const currentPages = pagesToExport || pages;
        const exportOptions = options || {
            format: 'json' as const,
            quality: 100,
            includeMetadata: true
        };

        try {
            if (exportOptions.format === 'json') {
                const dataStr = JSON.stringify(currentPages, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                
                const exportFileDefaultName = `${albumData?.bookName || 'photobook'}-${Date.now()}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
                
                toast.success("Photobook exported successfully!", {
                    position: "bottom-right",
                    autoClose: 2000,
                });
            } else {
                toast.info(`Export format ${exportOptions.format} is not yet implemented`, {
                    position: "bottom-right",
                    autoClose: 3000,
                });
            }
        } catch (error) {
            console.error("Error exporting photobook:", error);
            toast.error("Failed to export photobook", {
                position: "bottom-right",
                autoClose: 2000,
            });
        }
    }, [pages, albumData?.bookName]);

    // Handle canvas click for text placement
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
        // Only handle canvas clicks when not drawing and clicking on empty space
        if (tool === 'draw' || e.target !== e.currentTarget) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Double-click to add text at cursor position
        if (e.detail === 2) {
            setSelectedPageIndex(pageIndex);
            addText({ x, y });
        }
    }, [tool, addText]);

    // Fetch recent images
    const fetchRecentImages = useCallback(async () => {
        try {
            setLoadingRecentImages(true);
            const response = await fetch('/api/recent-images?limit=6');
            if (response.ok) {
                const images = await response.json();
                setRecentImages(images);
            } else {
                console.error('Failed to fetch recent images');
                // Fallback to empty array if API fails
                setRecentImages([]);
            }
        } catch (error) {
            console.error('Error fetching recent images:', error);
            // Fallback to empty array if API fails
            setRecentImages([]);
        } finally {
            setLoadingRecentImages(false);
        }
    }, []);

    // Load recent images when image panel opens
    useEffect(() => {
        if (showImagePanel && recentImages.length === 0 && !loadingRecentImages) {
            fetchRecentImages();
        }
    }, [showImagePanel, recentImages.length, loadingRecentImages, fetchRecentImages]);

    // Get current spread pages (left and right)
    const leftPageIndex = currentSpread * 2;
    const rightPageIndex = currentSpread * 2 + 1;
    const leftPage = pages[leftPageIndex];
    const rightPage = pages[rightPageIndex];
    const totalSpreads = Math.ceil(pages.length / 2);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+L to add text - show simple text box
            if (e.ctrlKey && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                // Show simple text input modal instead of advanced panel
                setTextInputPosition({ x: 150, y: 150 });
                setTextInputValue('');
                setShowTextInput(true);
                
                // Focus the input after a brief delay
                setTimeout(() => {
                    textInputRef.current?.focus();
                }, 100);
            }
            
            // Escape to cancel text input
            if (e.key === 'Escape' && showTextInput) {
                handleTextInputCancel();
            }
            
            // Enter to submit text input
            if (e.key === 'Enter' && showTextInput) {
                e.preventDefault();
                handleTextInputSubmit();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showTextInput, handleTextInputCancel, handleTextInputSubmit]);

    // Loading state
    if (isLoading || isConverting) {
        return (
            <div className="flex flex-col h-screen items-center mt-32 justify-start w-full px-4">
                <div className="bg-white p-8 text-center place-items-center max-w-md mx-auto">
                    <div>
                        <ThreeDots
                            color="#0000FF"
                            width="80"
                            visible={true}
                            aria-label="loading-indicator"
                        />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mt-4">
                        {isLoading ? "Loading album..." : "Initializing editor..."}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                        Please wait while we prepare your editing workspace...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-screen items-center mt-32 justify-start w-full px-4">
                <div className="bg-red-50 border border-red-200 p-8 text-center place-items-center max-w-md mx-auto rounded-lg">
                    <h3 className="text-lg font-semibold text-red-800 mt-4">
                        Error Loading Album
                    </h3>
                    <p className="text-sm text-red-600 mt-2">
                        {error}
                    </p>
                    <Link 
                        href="/me/dashboard"
                        className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/me/dashboard"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </Link>
                    <div className="border-l pl-4">
                        <h1 className="text-xl font-semibold text-gray-800">
                            {albumData?.bookName || "Photo Album"} - Editor
                        </h1>
                        <p className="text-sm text-gray-600">
                            {albumData?.images?.length || 0} images • {pages.length} pages
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPreviewModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        Preview
                    </button>
                    
                    <button
                        onClick={() => handleEditorSave()}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isSaving
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save
                            </>
                        )}
                    </button>
                    
                    <button
                        onClick={() => handleEditorExport()}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            <div className='flex flex-row h-full relative'>
                {/* Left Toolbar */}
                <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-4 z-10">
                    <button
                        onClick={() => setTool('select')}
                        className={`p-3 rounded-lg transition-colors ${tool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Select"
                    >
                        <Move className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setShowImagePanel(!showImagePanel);
                            setShowDrawPanel(false);
                            setShowStickerPanel(false);
                            setShowTemplates(false);
                            setShowBackgroundPanel(false);
                            setShowAdvancedTextPanel(false);
                        }}
                        className={`p-3 rounded-lg transition-colors ${showImagePanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Add Image"
                    >
                        <Image className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setShowAdvancedTextPanel(!showAdvancedTextPanel);
                            setShowImagePanel(false);
                            setShowDrawPanel(false);
                            setShowStickerPanel(false);
                            setShowTemplates(false);
                            setShowBackgroundPanel(false);
                        }}
                        className={`p-3 rounded-lg transition-colors ${showAdvancedTextPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Add Text (Ctrl+L)"
                    >
                        <Type className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setShowStickerPanel(!showStickerPanel);
                            setShowImagePanel(false);
                            setShowDrawPanel(false);
                            setShowTemplates(false);
                            setShowBackgroundPanel(false);
                            setShowAdvancedTextPanel(false);
                        }}
                        className={`p-3 rounded-lg transition-colors ${showStickerPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Add Sticker"
                    >
                        <Sticker className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setShowTemplates(!showTemplates);
                            setShowImagePanel(false);
                            setShowDrawPanel(false);
                            setShowStickerPanel(false);
                            setShowBackgroundPanel(false);
                            setShowAdvancedTextPanel(false);
                        }}
                        className={`p-3 rounded-lg transition-colors ${showTemplates ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Templates"
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setShowBackgroundPanel(!showBackgroundPanel);
                            setShowImagePanel(false);
                            setShowDrawPanel(false);
                            setShowStickerPanel(false);
                            setShowTemplates(false);
                            setShowAdvancedTextPanel(false);
                        }}
                        className={`p-3 rounded-lg transition-colors ${showBackgroundPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Background Colors"
                    >
                        <Palette className="w-5 h-5" />
                    </button>
                </div>

                {/* Templates Panel */}
                {showTemplates && (
                    <div className="w-80 bg-white border-r p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Templates</h3>
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Templates"
                            >
                                ×
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {templates.map((template: Template, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => applyTemplate(template)}
                                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-left w-full"
                                >
                                    <div className="text-sm font-medium mb-1">{template.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {template.elements.length} elements
                                    </div>
                                    <div className="mt-2 h-16 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                                        <span className="text-xs text-gray-400">Preview</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Image Upload Panel */}
                {showImagePanel && (
                    <div className="w-80 bg-white border-r p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Add Image</h3>
                            <button
                                onClick={() => setShowImagePanel(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Images"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Enhanced Upload from Computer */}
                            <div 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                                    
                                    const files = Array.from(e.dataTransfer.files);
                                    const imageFile = files.find(file => file.type.startsWith('image/'));
                                    
                                    if (imageFile) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            if (event.target?.result && typeof event.target.result === 'string') {
                                                try {
                                                    const newElement = createImageElement(
                                                        { x: 100, y: 100 },
                                                        event.target.result,
                                                        { width: 200, height: 150, rotation: 0 }
                                                    );

                                                    const validation = validateElement(newElement);
                                                    if (!validation.isValid) {
                                                        console.error('Invalid element created:', validation.errors);
                                                        return;
                                                    }

                                                    setPages(prevPages => prevPages.map((page, index) =>
                                                        index === selectedPageIndex
                                                            ? { ...page, elements: [...page.elements, newElement] }
                                                            : page
                                                    ));

                                                    setShowImagePanel(false);
                                                    setSelectedElement(newElement);
                                                } catch (error) {
                                                    console.error('Error adding dropped image:', error);
                                                }
                                            }
                                        };
                                        reader.readAsDataURL(imageFile);
                                    }
                                }}
                                onClick={handleModalFileUpload}
                            >
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-600 mb-3">Upload from your computer</p>
                                <p className="text-xs text-blue-600 mb-3">Drag & drop images here or click to browse</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleModalFileUpload();
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Choose File
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    Supports JPG, PNG, GIF up to 10MB
                                </p>
                            </div>

                            {/* Recent Projects Section */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Projects</h4>
                                
                                {loadingRecentImages ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-sm text-gray-600">Loading recent images...</span>
                                    </div>
                                ) : recentImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {recentImages.map((image, index) => (
                                            <button
                                                key={`recent-${image.id}-${index}`}
                                                onClick={() => {
                                                    try {
                                                        const newElement = createImageElement(
                                                            { x: 100, y: 100 },
                                                            image.src,
                                                            { width: 200, height: 150, rotation: 0 }
                                                        );

                                                        const validation = validateElement(newElement);
                                                        if (!validation.isValid) {
                                                            console.error('Invalid element created:', validation.errors);
                                                            return;
                                                        }

                                                        setPages(prevPages => prevPages.map((page, pageIndex) =>
                                                            pageIndex === selectedPageIndex
                                                                ? { ...page, elements: [...page.elements, newElement] }
                                                                : page
                                                        ));

                                                        // Close panel and select the new image element
                                                        setShowImagePanel(false);
                                                        setSelectedElement(newElement);
                                                    } catch (error) {
                                                        const editorError = handleError(error, 'Add recent image');
                                                        console.error('Error adding recent image:', editorError);
                                                    }
                                                }}
                                                className="aspect-video bg-gray-200 rounded border-2 border-gray-200 hover:border-blue-500 transition-colors overflow-hidden group relative"
                                            >
                                                <img
                                                    src={image.src}
                                                    alt={image.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback to placeholder if image fails to load
                                                        e.currentTarget.src = `https://via.placeholder.com/300x200/e2e8f0/64748b?text=${encodeURIComponent(image.name)}`;
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-end">
                                                    <div className="w-full p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="font-medium truncate">{image.name}</p>
                                                        <p className="text-gray-300 text-xs">{image.category}</p>
                                                        {image.albumName && (
                                                            <p className="text-gray-400 text-xs">From: {image.albumName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">No recent images found</p>
                                        <p className="text-xs text-gray-500">Upload some images to see them here</p>
                                        <button
                                            onClick={fetchRecentImages}
                                            className="mt-3 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sticker Panel */}
                {showStickerPanel && (
                    <div className="w-80 bg-white border-r p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Stickers</h3>
                            <button
                                onClick={() => setShowStickerPanel(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Stickers"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Emoji Stickers */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Emoji</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {['😊', '😍', '🥳', '😎', '🤩', '😂', '🤗', '😇', '🥰', '😘', '🤔', '👍', '❤️', '🎉', '🌟', '🔥'].map((emoji, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                try {
                                                    // Create a simple text-based sticker for emojis
                                                    const newElement = createTextElement(
                                                        { x: 150, y: 150 },
                                                        emoji,
                                                        { width: 60, height: 60, fontSize: 48, color: 'black', rotation: 0 }
                                                    );

                                                    const validation = validateElement(newElement);
                                                    if (!validation.isValid) {
                                                        console.error('Invalid element created:', validation.errors);
                                                        return;
                                                    }

                                                    setPages(prevPages => prevPages.map((page, pageIndex) =>
                                                        pageIndex === selectedPageIndex
                                                            ? { ...page, elements: [...page.elements, newElement] }
                                                            : page
                                                    ));

                                                    setShowStickerPanel(false);
                                                    setSelectedElement(newElement);
                                                } catch (error) {
                                                    const editorError = handleError(error, 'Add sticker');
                                                    console.error('Error adding sticker:', editorError);
                                                }
                                            }}
                                            className="aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors text-2xl flex items-center justify-center"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Shape Stickers */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Shapes</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {['★', '♡', '◆', '▲', '●', '■'].map((shape, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                try {
                                                    const newElement = createTextElement(
                                                        { x: 150, y: 150 },
                                                        shape,
                                                        { width: 40, height: 40, fontSize: 32, color: drawingColor, rotation: 0 }
                                                    );

                                                    const validation = validateElement(newElement);
                                                    if (!validation.isValid) {
                                                        console.error('Invalid element created:', validation.errors);
                                                        return;
                                                    }

                                                    setPages(prevPages => prevPages.map((page, pageIndex) =>
                                                        pageIndex === selectedPageIndex
                                                            ? { ...page, elements: [...page.elements, newElement] }
                                                            : page
                                                    ));

                                                    setShowStickerPanel(false);
                                                    setSelectedElement(newElement);
                                                } catch (error) {
                                                    const editorError = handleError(error, 'Add shape sticker');
                                                    console.error('Error adding shape sticker:', editorError);
                                                }
                                            }}
                                            className="aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors text-xl flex items-center justify-center"
                                            style={{ color: drawingColor }}
                                        >
                                            {shape}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Smart Text & Storytelling Suite Panel */}
                {showAdvancedTextPanel && (
                    <div className="w-80 bg-white border-r p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Smart Text & Storytelling</h3>
                            <button
                                onClick={() => setShowAdvancedTextPanel(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Text Editor"
                            >
                                ×
                            </button>
                        </div>

                        {/* Mode Toggle */}
                        <div className="mb-4">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setShowAIContentPanel(false)}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                                        !showAIContentPanel 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Manual Editor
                                </button>
                                <button
                                    onClick={() => setShowAIContentPanel(true)}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                                        showAIContentPanel 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    AI Assistant
                                </button>
                            </div>
                        </div>

                        {!showAIContentPanel ? (
                            /* Manual Text Editor */
                            <div className="space-y-4">
                                {/* Text Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Enter your text:
                                    </label>
                                    <textarea
                                        ref={textAreaRef}
                                        value={textInputValue}
                                        onChange={(e) => setTextInputValue(e.target.value)}
                                        placeholder="Type your text here..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Font Controls */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-700">Typography</h4>
                                    
                                    {/* Font Family & Size */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={textStyles.fontFamily}
                                            onChange={(e) => setTextStyles(prev => ({ ...prev, fontFamily: e.target.value }))}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                        >
                                            <option value="Arial">Arial</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Times New Roman">Times</option>
                                            <option value="Helvetica">Helvetica</option>
                                            <option value="Verdana">Verdana</option>
                                            <option value="Comic Sans MS">Comic Sans</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={textStyles.fontSize}
                                            onChange={(e) => setTextStyles(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 16 }))}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                            min="8"
                                            max="72"
                                        />
                                    </div>

                                    {/* Font Weight & Decoration */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTextStyles(prev => ({ 
                                                ...prev, 
                                                fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold' 
                                            }))}
                                            className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                                                textStyles.fontWeight === 'bold' 
                                                    ? 'bg-blue-100 text-blue-600' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            B
                                        </button>
                                        <button
                                            onClick={() => setTextStyles(prev => ({ 
                                                ...prev, 
                                                textDecoration: prev.textDecoration === 'underline' ? 'none' : 'underline' 
                                            }))}
                                            className={`px-3 py-1 rounded text-sm italic transition-colors ${
                                                textStyles.textDecoration === 'underline' 
                                                    ? 'bg-blue-100 text-blue-600' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            U
                                        </button>
                                    </div>

                                    {/* Text Alignment */}
                                    <div className="flex gap-1">
                                        {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                                            <button
                                                key={align}
                                                onClick={() => setTextStyles(prev => ({ ...prev, textAlign: align }))}
                                                className={`px-2 py-1 rounded text-sm transition-colors ${
                                                    textStyles.textAlign === align 
                                                        ? 'bg-blue-100 text-blue-600' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {align === 'left' && '⬅'}
                                                {align === 'center' && '↔'}
                                                {align === 'right' && '➡'}
                                                {align === 'justify' && '⬌'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Color Picker */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Text Color
                                        </label>
                                        <input
                                            type="color"
                                            value={textStyles.color}
                                            onChange={(e) => setTextStyles(prev => ({ ...prev, color: e.target.value }))}
                                            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                                        />
                                    </div>

                                    {/* Advanced Typography */}
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Line Height: {textStyles.lineHeight}
                                            </label>
                                            <input
                                                type="range"
                                                min="0.8"
                                                max="2.0"
                                                step="0.1"
                                                value={textStyles.lineHeight}
                                                onChange={(e) => setTextStyles(prev => ({ ...prev, lineHeight: parseFloat(e.target.value) }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Letter Spacing: {textStyles.letterSpacing}px
                                            </label>
                                            <input
                                                type="range"
                                                min="-2"
                                                max="5"
                                                step="0.5"
                                                value={textStyles.letterSpacing}
                                                onChange={(e) => setTextStyles(prev => ({ ...prev, letterSpacing: parseFloat(e.target.value) }))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Style Presets */}
                                {savedTextStyles.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Styles</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {savedTextStyles.map((style) => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => applyTextStyle(style)}
                                                    className="text-left p-2 border border-gray-200 rounded hover:border-blue-300 transition-colors"
                                                >
                                                    <div className="text-sm font-medium">{style.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {style.fontFamily} • {style.fontSize}px
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-4 border-t">
                                    <button
                                        onClick={saveTextStyle}
                                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        Save Current Style
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (textInputValue.trim()) {
                                                createAdvancedTextElement(textInputValue);
                                            }
                                        }}
                                        disabled={!textInputValue.trim()}
                                        className={`w-full px-4 py-2 rounded-lg transition-colors text-sm ${
                                            textInputValue.trim()
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        Add Text to Page
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* AI Content Generator */
                            <div className="space-y-4">
                                {/* Content Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Content Type
                                    </label>
                                    <select
                                        value={aiContentType}
                                        onChange={(e) => setAiContentType(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="caption">Caption</option>
                                        <option value="headline">Headline</option>
                                        <option value="paragraph">Paragraph</option>
                                    </select>
                                </div>

                                {/* Tone Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tone
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['casual', 'sentimental', 'humorous', 'poetic', 'formal'] as const).map((tone) => (
                                            <button
                                                key={tone}
                                                onClick={() => setAiTone(tone)}
                                                className={`px-3 py-2 rounded-md text-sm transition-colors capitalize ${
                                                    aiTone === tone 
                                                        ? 'bg-blue-100 text-blue-600 border border-blue-300' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                                }`}
                                            >
                                                {tone}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Style Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Style
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['single', 'paragraph', 'question', 'quote'] as const).map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => setAiStyle(style)}
                                                className={`px-3 py-2 rounded-md text-sm transition-colors capitalize ${
                                                    aiStyle === style 
                                                        ? 'bg-blue-100 text-blue-600 border border-blue-300' 
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                                }`}
                                            >
                                                {style === 'single' ? 'Single Line' : style}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={generateAIContent}
                                    disabled={isGeneratingAI}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                                        isGeneratingAI
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isGeneratingAI ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Generate Content
                                        </>
                                    )}
                                </button>

                                {/* AI Suggestions */}
                                {aiSuggestions.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions</h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {aiSuggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                        selectedSuggestion === suggestion
                                                            ? 'border-blue-300 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                    onClick={() => setSelectedSuggestion(suggestion)}
                                                >
                                                    <p className="text-sm text-gray-800">{suggestion}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                createAdvancedTextElement(suggestion);
                                                            }}
                                                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                                        >
                                                            Use This
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                generateVariations(suggestion);
                                                            }}
                                                            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                                                        >
                                                            Variations
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Context Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800 mb-2">💡 Context Analysis:</p>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• Page: {selectedPageIndex + 1} of {pages.length}</li>
                                        <li>• Images on page: {pages[selectedPageIndex]?.elements.filter(el => el.type === 'image').length || 0}</li>
                                        <li>• Album: {albumData?.bookName || 'Untitled'}</li>
                                        <li>• AI will consider this context when generating content</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Automatic Backgrounds Panel */}
                {showBackgroundPanel && (
                    <div className="w-80 bg-white border-r p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Automatic Backgrounds</h3>
                            <button
                                onClick={() => setShowBackgroundPanel(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Backgrounds"
                            >
                                ×
                            </button>
                        </div>

                        {/* Scope Control */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Apply to:</label>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setBackgroundScope('current')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                                        backgroundScope === 'current' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Current Page
                                </button>
                                <button
                                    onClick={() => setBackgroundScope('all')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                                        backgroundScope === 'all' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    All Pages
                                </button>
                            </div>
                        </div>

                        {/* Background Mode Tabs */}
                        <div className="mb-4">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setBackgroundMode('color')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                                        backgroundMode === 'color' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Colors
                                </button>
                                <button
                                    onClick={() => setBackgroundMode('library')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                                        backgroundMode === 'library' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Library
                                </button>
                                <button
                                    onClick={() => setBackgroundMode('ai')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
                                        backgroundMode === 'ai' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    AI-Generated
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Color Mode */}
                            {backgroundMode === 'color' && (
                                <>
                                    {/* Custom Color Picker */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Custom Background Color
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                                            <Palette className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm text-gray-600 mb-3">Choose any color for your page background</p>
                                            <input
                                                type="color"
                                                onChange={(e) => {
                                                    const selectedColor = e.target.value;
                                                    changeBackground(selectedColor);
                                                }}
                                                className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                                                title="Click to select a custom color"
                                            />
                                        </div>
                                    </div>

                                    {/* Preset Colors */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Preset Colors</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { color: '#ffffff', name: 'White' },
                                                { color: '#f8f9fa', name: 'Light Gray' },
                                                { color: '#e9ecef', name: 'Gray' },
                                                { color: '#dee2e6', name: 'Medium Gray' },
                                                { color: '#ced4da', name: 'Dark Gray' },
                                                { color: '#adb5bd', name: 'Darker Gray' },
                                                { color: '#fef2f2', name: 'Light Pink' },
                                                { color: '#fef3c7', name: 'Light Yellow' },
                                                { color: '#ecfdf5', name: 'Light Green' },
                                                { color: '#eff6ff', name: 'Light Blue' },
                                                { color: '#f3e8ff', name: 'Light Purple' },
                                                { color: '#fdf4ff', name: 'Light Magenta' }
                                            ].map((preset, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        changeBackground(preset.color);
                                                    }}
                                                    className="aspect-square rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors relative group"
                                                    style={{ backgroundColor: preset.color }}
                                                    title={`${preset.name} (${preset.color})`}
                                                >
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {preset.name}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Library Mode */}
                            {backgroundMode === 'library' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Predefined Library</h4>
                                    <div className="space-y-4">
                                        {/* Background Intensity Slider */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Background Intensity: {Math.round(backgroundIntensity * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={backgroundIntensity}
                                                onChange={(e) => setBackgroundIntensity(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>Subtle</span>
                                                <span>Full</span>
                                            </div>
                                        </div>

                                        {/* Background Library Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {backgroundLibrary.map((bg) => (
                                                <button
                                                    key={bg.id}
                                                    onClick={() => {
                                                        setSelectedLibraryBackground(bg.id);
                                                        applyBackgroundImage(bg.url);
                                                    }}
                                                    className={`aspect-video bg-gray-200 rounded-lg border-2 transition-colors overflow-hidden group relative ${
                                                        selectedLibraryBackground === bg.id 
                                                            ? 'border-blue-500' 
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <img
                                                        src={bg.url}
                                                        alt={bg.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://via.placeholder.com/300x200/e2e8f0/64748b?text=${encodeURIComponent(bg.name)}`;
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-end">
                                                        <div className="w-full p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="font-medium">{bg.name}</p>
                                                            <p className="text-gray-300">{bg.category}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Generation Mode */}
                            {backgroundMode === 'ai' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">AI-Generated Backgrounds</h4>
                                    <div className="space-y-4">
                                        {/* AI Prompt Input */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Describe your desired background:
                                            </label>
                                            <textarea
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                placeholder="e.g., 'Sunset over mountains with warm colors' or 'Abstract geometric pattern in blue tones'"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                rows={3}
                                            />
                                        </div>

                                        {/* Background Intensity Slider */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Background Intensity: {Math.round(backgroundIntensity * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={backgroundIntensity}
                                                onChange={(e) => setBackgroundIntensity(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>Subtle</span>
                                                <span>Full</span>
                                            </div>
                                        </div>

                                        {/* Generate Button */}
                                        <button
                                            onClick={generateAIBackground}
                                            disabled={isGeneratingBackground || !aiPrompt.trim()}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                                                isGeneratingBackground || !aiPrompt.trim()
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            {isGeneratingBackground ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Generate Background
                                                </>
                                            )}
                                        </button>

                                        {/* AI Tips */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm text-blue-800 mb-2">💡 AI Generation Tips:</p>
                                            <ul className="text-xs text-blue-700 space-y-1">
                                                <li>• Be specific about colors, mood, and style</li>
                                                <li>• Mention if you want abstract or realistic</li>
                                                <li>• Include lighting preferences (bright, soft, dramatic)</li>
                                                <li>• Try: "Watercolor sunset", "Minimalist geometric", "Vintage paper texture"</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Current Settings Info */}
                            <div className="border-t pt-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-sm text-gray-800 mb-2">Current Settings:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li>• Target: {backgroundScope === 'all' ? 'All Pages' : `Page ${selectedPageIndex + 1}`}</li>
                                        <li>• Mode: {backgroundMode === 'color' ? 'Solid Colors' : backgroundMode === 'library' ? 'Predefined Library' : 'AI-Generated'}</li>
                                        {(backgroundMode === 'library' || backgroundMode === 'ai') && (
                                            <li>• Intensity: {Math.round(backgroundIntensity * 100)}%</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas Area */}
                <div className='flex-1 flex justify-center items-start pt-3 overflow-auto'>
                    <div className="flex flex-col items-center">
                        {/* View Mode Toggle and Navigation */}
                        <div className="flex items-center gap-4 mb-6">
                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-200 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('spread')}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                        viewMode === 'spread' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Spread View
                                </button>
                                <button
                                    onClick={() => setViewMode('scroll')}
                                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                        viewMode === 'scroll' 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Scroll View
                                </button>
                            </div>

                            {/* Spread Navigation - Only show in spread view */}
                            {viewMode === 'spread' && (
                                <>
                                    <button
                                        onClick={() => setCurrentSpread(Math.max(0, currentSpread - 1))}
                                        disabled={currentSpread === 0}
                                        className="p-2 rounded-lg bg-white shadow hover:shadow-md transition-shadow disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Pages {currentSpread + 1} of {totalSpreads}
                                    </span>
                                    <button
                                        onClick={() => setCurrentSpread(Math.min(totalSpreads - 1, currentSpread + 1))}
                                        disabled={currentSpread === totalSpreads - 1}
                                        className="p-2 rounded-lg bg-white shadow hover:shadow-md transition-shadow disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            <button
                                onClick={addPage}
                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Add Pages"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Canvas Content - Conditional based on view mode */}
                        {viewMode === 'spread' ? (
                            /* Spread View - Left and Right Pages */
                            <div className="flex gap-4">
                                {/* Left Page */}
                                {leftPage && (
                                    <div
                                        className={`relative border-2 shadow-lg ${tool === 'draw' ? 'cursor-crosshair' : 'cursor-pointer'} ${selectedPageIndex === leftPageIndex ? 'border-blue-500' : 'border-gray-200'
                                            }`}
                                        style={{
                                            width: `${leftPage.width}px`,
                                            height: `${leftPage.height}px`,
                                            backgroundColor: leftPage.background
                                        }}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => {
                                            setSelectedPageIndex(leftPageIndex);
                                            handleDrop(e, leftPageIndex);
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, leftPageIndex)}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onClick={(e) => {
                                            if (e.target === e.currentTarget) {
                                                setSelectedPageIndex(leftPageIndex);
                                                setSelectedElement(null);
                                            }
                                        }}
                                    >
                                        <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                                            {leftPageIndex + 1}
                                        </div>

                                        {leftPage.elements.map((element: Element) => (
                                            <div
                                                key={element.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    setSelectedPageIndex(leftPageIndex);
                                                    handleDragStart(e, element);
                                                }}
                                                onDragEnd={(e) => {
                                                    // Reset opacity after drag
                                                    e.currentTarget.style.opacity = '1';
                                                }}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setSelectedPageIndex(leftPageIndex);
                                                    setSelectedElement(element);
                                                }}
                                                className={`absolute cursor-move transition-all duration-150 ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                                                    }`}
                                                style={{
                                                    left: element.x,
                                                    top: element.y,
                                                    width: element.width,
                                                    height: element.height,
                                                    transform: `rotate(${element.rotation || 0}deg)`,
                                                    willChange: 'transform'
                                                }}
                                            >
                                                {element.type === 'image' ? (
                                                    <img
                                                        src={(element as ImageElement).src}
                                                        alt={(element as ImageElement).alt || ""}
                                                        className="w-full h-full object-cover border border-gray-300"
                                                    />
                                                ) : element.type === 'drawing' ? (
                                                    <svg
                                                        width="100%"
                                                        height="100%"
                                                        viewBox={`0 0 ${element.width} ${element.height}`}
                                                        className="w-full h-full"
                                                    >
                                                        {(element as DrawingElement).paths.map((path) => (
                                                            <path
                                                                key={path.id}
                                                                d={`M ${path.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                                                stroke={path.strokeColor}
                                                                strokeWidth={path.strokeWidth}
                                                                fill="none"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                opacity={path.opacity}
                                                            />
                                                        ))}
                                                    </svg>
                                                ) : (
                                                    <div
                                                        contentEditable={false}
                                                        onDoubleClick={(e: React.MouseEvent) => {
                                                            e.stopPropagation();
                                                            // Enable editing mode on double-click
                                                            const target = e.target as HTMLDivElement;
                                                            target.contentEditable = 'true';
                                                            target.focus();
                                                            
                                                            // Set up blur handler to save and disable editing
                                                            const handleBlur = () => {
                                                                target.contentEditable = 'false';
                                                                handleTextEdit(element.id, target.textContent || '');
                                                                target.removeEventListener('blur', handleBlur);
                                                            };
                                                            target.addEventListener('blur', handleBlur);
                                                        }}
                                                        className="w-full h-full flex items-center justify-center text-center outline-none bg-transparent cursor-text select-none pointer-events-none"
                                                        style={{
                                                            fontSize: (element as TextElement).fontSize || 16,
                                                            color: (element as TextElement).color || '#333333',
                                                            fontFamily: (element as TextElement).fontFamily || 'Arial',
                                                            fontWeight: (element as TextElement).fontWeight || 'normal',
                                                            textDecoration: (element as TextElement).textDecoration || 'none',
                                                            textAlign: (element as TextElement).textAlign || 'left',
                                                            lineHeight: (element as TextElement).lineHeight || 1.2,
                                                            letterSpacing: `${(element as TextElement).letterSpacing || 0}px`,
                                                            textTransform: (element as TextElement).textTransform || 'none'
                                                        }}
                                                        suppressContentEditableWarning={true}
                                                    >
                                                        {(element as TextElement).text}
                                                    </div>
                                                )}
                                                
                                                {/* Resize Handles */}
                                                {renderResizeHandles(element)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Right Page */}
                                {rightPage && (
                                    <div
                                        className={`relative border-2 shadow-lg ${tool === 'draw' ? 'cursor-crosshair' : 'cursor-pointer'} ${selectedPageIndex === rightPageIndex ? 'border-blue-500' : 'border-gray-200'
                                            }`}
                                        style={{
                                            width: `${rightPage.width}px`,
                                            height: `${rightPage.height}px`,
                                            backgroundColor: rightPage.background
                                        }}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => {
                                            setSelectedPageIndex(rightPageIndex);
                                            handleDrop(e, rightPageIndex);
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, rightPageIndex)}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onClick={(e) => {
                                            if (e.target === e.currentTarget) {
                                                setSelectedPageIndex(rightPageIndex);
                                                setSelectedElement(null);
                                            }
                                        }}
                                    >
                                        <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                                            {rightPageIndex + 1}
                                        </div>
                                        {rightPage.elements.map((element: Element) => (
                                            <div
                                                key={element.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    setSelectedPageIndex(rightPageIndex);
                                                    handleDragStart(e, element);
                                                }}
                                                onDragEnd={(e) => {
                                                    // Reset opacity after drag
                                                    e.currentTarget.style.opacity = '1';
                                                }}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setSelectedPageIndex(rightPageIndex);
                                                    setSelectedElement(element);
                                                }}
                                                className={`absolute cursor-move transition-all duration-150 ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                                                    }`}
                                                style={{
                                                    left: element.x,
                                                    top: element.y,
                                                    width: element.width,
                                                    height: element.height,
                                                    transform: `rotate(${element.rotation || 0}deg)`,
                                                    willChange: 'transform'
                                                }}
                                            >
                                                {element.type === 'image' ? (
                                                    <img
                                                        src={(element as ImageElement).src}
                                                        alt={(element as ImageElement).alt || ""}
                                                        className="w-full h-full object-cover border border-gray-300"
                                                    />
                                                ) : element.type === 'drawing' ? (
                                                    <svg
                                                        width="100%"
                                                        height="100%"
                                                        viewBox={`0 0 ${element.width} ${element.height}`}
                                                        className="w-full h-full"
                                                    >
                                                        {(element as DrawingElement).paths.map((path) => (
                                                            <path
                                                                key={path.id}
                                                                d={`M ${path.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                                                stroke={path.strokeColor}
                                                                strokeWidth={path.strokeWidth}
                                                                fill="none"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                opacity={path.opacity}
                                                            />
                                                        ))}
                                                    </svg>
                                                ) : (
                                                    <div
                                                        contentEditable={false}
                                                        onDoubleClick={(e: React.MouseEvent) => {
                                                            e.stopPropagation();
                                                            // Enable editing mode on double-click
                                                            const target = e.target as HTMLDivElement;
                                                            target.contentEditable = 'true';
                                                            target.focus();
                                                            
                                                            // Set up blur handler to save and disable editing
                                                            const handleBlur = () => {
                                                                target.contentEditable = 'false';
                                                                handleTextEdit(element.id, target.textContent || '');
                                                                target.removeEventListener('blur', handleBlur);
                                                            };
                                                            target.addEventListener('blur', handleBlur);
                                                        }}
                                                        className="w-full h-full flex items-center justify-center text-center outline-none bg-transparent cursor-text select-none pointer-events-none"
                                                        style={{
                                                            fontSize: (element as TextElement).fontSize || 16,
                                                            color: (element as TextElement).color || '#333333',
                                                            fontFamily: (element as TextElement).fontFamily || 'Arial',
                                                            fontWeight: (element as TextElement).fontWeight || 'normal',
                                                            textDecoration: (element as TextElement).textDecoration || 'none',
                                                            textAlign: (element as TextElement).textAlign || 'left',
                                                            lineHeight: (element as TextElement).lineHeight || 1.2,
                                                            letterSpacing: `${(element as TextElement).letterSpacing || 0}px`,
                                                            textTransform: (element as TextElement).textTransform || 'none'
                                                        }}
                                                        suppressContentEditableWarning={true}
                                                    >
                                                        {(element as TextElement).text}
                                                    </div>
                                                )}
                                                
                                                {/* Resize Handles */}
                                                {renderResizeHandles(element)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Scroll View - All Pages in Sequence */
                            <div className="flex flex-col gap-6 max-h-[calc(100vh-200px)] overflow-y-auto p-4 bg-gray-50 rounded-lg">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Complete Photobook Preview</h3>
                                    <p className="text-sm text-gray-600">Scroll through your entire photobook as it will appear when printed</p>
                                </div>
                                
                                {pages.map((page: Page, index: number) => (
                                    <div key={page.id} className="flex flex-col items-center">
                                        <div className="mb-2">
                                            <span className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm">
                                                Page {index + 1}
                                            </span>
                                        </div>
                                        <div
                                            className={`relative border-2 shadow-lg ${tool === 'draw' ? 'cursor-crosshair' : 'cursor-pointer'} ${selectedPageIndex === index ? 'border-blue-500' : 'border-gray-200'
                                                } transition-all duration-200 hover:shadow-xl`}
                                            style={{
                                                width: `${page.width * 0.8}px`, // Slightly smaller for scroll view
                                                height: `${page.height * 0.8}px`,
                                                backgroundColor: page.background
                                            }}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => {
                                                setSelectedPageIndex(index);
                                                handleDrop(e, index);
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, index)}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp}
                                            onClick={(e) => {
                                                if (e.target === e.currentTarget) {
                                                    setSelectedPageIndex(index);
                                                    setSelectedElement(null);
                                                }
                                            }}
                                        >
                                            {page.elements.map((element: Element) => (
                                                <div
                                                    key={element.id}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        setSelectedPageIndex(index);
                                                        handleDragStart(e, element);
                                                    }}
                                                    onClick={(e: React.MouseEvent) => {
                                                        e.stopPropagation();
                                                        setSelectedPageIndex(index);
                                                        setSelectedElement(element);
                                                    }}
                                                    className={`absolute cursor-move ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                                                        }`}
                                                    style={{
                                                        left: element.x * 0.8, // Scale down for scroll view
                                                        top: element.y * 0.8,
                                                        width: element.width * 0.8,
                                                        height: element.height * 0.8,
                                                        transform: `rotate(${element.rotation || 0}deg)`
                                                    }}
                                                >
                                                    {element.type === 'image' ? (
                                                        <img
                                                            src={(element as ImageElement).src}
                                                            alt={(element as ImageElement).alt || ""}
                                                            className="w-full h-full object-cover border border-gray-300"
                                                        />
                                                    ) : element.type === 'drawing' ? (
                                                        <svg
                                                            width="100%"
                                                            height="100%"
                                                            viewBox={`0 0 ${element.width} ${element.height}`}
                                                            className="w-full h-full"
                                                        >
                                                            {(element as DrawingElement).paths.map((path) => (
                                                                <path
                                                                    key={path.id}
                                                                    d={`M ${path.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                                                    stroke={path.strokeColor}
                                                                    strokeWidth={path.strokeWidth}
                                                                    fill="none"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    opacity={path.opacity}
                                                                />
                                                            ))}
                                                        </svg>
                                                    ) : (
                                                        <div
                                                            contentEditable={selectedElement?.id === element.id}
                                                            onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
                                                                const target = e.target as HTMLDivElement;
                                                                handleTextEdit(element.id, target.textContent || '');
                                                            }}
                                                            className="w-full h-full flex items-center justify-center text-center outline-none bg-transparent"
                                                            style={{
                                                                fontSize: ((element as TextElement).fontSize || 16) * 0.8, // Scale down font
                                                                color: (element as TextElement).color || '#333333'
                                                            }}
                                                            suppressContentEditableWarning={true}
                                                        >
                                                            {(element as TextElement).text}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-sm">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">End of Photobook</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        You've reached the end of your {pages.length}-page photobook
                                    </p>
                                    <button
                                        onClick={() => setViewMode('spread')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Return to Edit Mode
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Page Thumbnails */}
                        <div className="flex gap-2 mt-6 flex-wrap justify-center max-w-4xl">
                            {pages.map((page: Page, index: number) => (
                                <button
                                    key={page.id}
                                    onClick={() => {
                                        const spreadIndex = Math.floor(index / 2);
                                        setCurrentSpread(spreadIndex);
                                        setSelectedPageIndex(index);
                                    }}
                                    className={`w-16 h-12 border-2 rounded ${index === selectedPageIndex ? 'border-blue-500' : 'border-gray-200'
                                        } hover:border-blue-300 transition-colors`}
                                    style={{ backgroundColor: page.background }}
                                >
                                    <span className="text-xs">{index + 1}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Text Properties Panel - Shows when text element is selected */}
                {selectedElement && selectedElement.type === 'text' && (
                    <div className="w-80 bg-white border-l p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Text Properties</h3>
                            <button
                                onClick={() => setSelectedElement(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Properties"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Current Text Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Text Content
                                </label>
                                <textarea
                                    value={(selectedElement as TextElement).text}
                                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Edit your text here..."
                                />
                            </div>

                            {/* Typography Controls */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Typography</h4>
                                
                                {/* Font Family & Size */}
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={(selectedElement as TextElement).fontFamily || 'Arial'}
                                        onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Times New Roman">Times</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="Comic Sans MS">Comic Sans</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={(selectedElement as TextElement).fontSize || 16}
                                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                        min="8"
                                        max="72"
                                    />
                                </div>

                                {/* Font Weight & Decoration */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateElement(selectedElement.id, { 
                                            fontWeight: (selectedElement as TextElement).fontWeight === 'bold' ? 'normal' : 'bold' 
                                        })}
                                        className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                                            (selectedElement as TextElement).fontWeight === 'bold' 
                                                ? 'bg-blue-100 text-blue-600' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        B
                                    </button>
                                    <button
                                        onClick={() => updateElement(selectedElement.id, { 
                                            textDecoration: (selectedElement as TextElement).textDecoration === 'underline' ? 'none' : 'underline' 
                                        })}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            (selectedElement as TextElement).textDecoration === 'underline' 
                                                ? 'bg-blue-100 text-blue-600' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        U
                                    </button>
                                </div>

                                {/* Text Alignment */}
                                <div className="flex gap-1">
                                    {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                                            className={`px-2 py-1 rounded text-sm transition-colors ${
                                                (selectedElement as TextElement).textAlign === align 
                                                    ? 'bg-blue-100 text-blue-600' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {align === 'left' && '⬅'}
                                            {align === 'center' && '↔'}
                                            {align === 'right' && '➡'}
                                            {align === 'justify' && '⬌'}
                                        </button>
                                    ))}
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Text Color
                                    </label>
                                    <input
                                        type="color"
                                        value={(selectedElement as TextElement).color || '#333333'}
                                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                        className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                                    />
                                </div>

                                {/* Advanced Typography */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Line Height: {(selectedElement as TextElement).lineHeight || 1.2}
                                        </label>
                                        <input
                                            type="range"
                                            min="0.8"
                                            max="2.0"
                                            step="0.1"
                                            value={(selectedElement as TextElement).lineHeight || 1.2}
                                            onChange={(e) => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">
                                            Letter Spacing: {(selectedElement as TextElement).letterSpacing || 0}px
                                        </label>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="5"
                                            step="0.5"
                                            value={(selectedElement as TextElement).letterSpacing || 0}
                                            onChange={(e) => updateElement(selectedElement.id, { letterSpacing: parseFloat(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Position & Size Controls */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Position & Size</h4>
                                
                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.x)}
                                            onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                            placeholder="X"
                                        />
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.y)}
                                            onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                            placeholder="Y"
                                        />
                                    </div>
                                </div>

                                {/* Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.width)}
                                            onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 20 })}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                            placeholder="Width"
                                            min="20"
                                        />
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.height)}
                                            onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 20 })}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                            placeholder="Height"
                                            min="20"
                                        />
                                    </div>
                                </div>

                                {/* Rotation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rotation: {selectedElement.rotation || 0}°
                                    </label>
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={selectedElement.rotation || 0}
                                        onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t">
                                <button
                                    onClick={() => deleteElement(selectedElement.id)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Text
                                </button>
                            </div>

                            {/* Element Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800 mb-2">📝 Text Element Info:</p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• Type: {selectedElement.type}</li>
                                    <li>• Position: ({Math.round(selectedElement.x)}, {Math.round(selectedElement.y)})</li>
                                    <li>• Size: {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}</li>
                                    <li>• Font: {(selectedElement as TextElement).fontFamily || 'Arial'} {(selectedElement as TextElement).fontSize || 16}px</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Text Input Overlay */}
            {showTextInput && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Text</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter your text:
                                </label>
                                <input
                                    ref={textInputRef}
                                    type="text"
                                    value={textInputValue}
                                    onChange={(e) => setTextInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleTextInputSubmit();
                                        } else if (e.key === 'Escape') {
                                            handleTextInputCancel();
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Type your text here..."
                                    autoFocus
                                />
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                                <p>• Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to add text</p>
                                <p>• Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Escape</kbd> to cancel</p>
                                <p>• Use <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+L</kbd> anywhere to add text</p>
                                <p>• Double-click on canvas to add text at cursor position</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleTextInputSubmit}
                                    disabled={!textInputValue.trim()}
                                    className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                                        textInputValue.trim()
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Add Text
                                </button>
                                <button
                                    onClick={handleTextInputCancel}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    >
                        <div
                            className="absolute inset-0 bg-black bg-opacity-50"
                            onClick={() => setShowPreviewModal(false)}
                        ></div>
                        <motion.div
                            className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden z-60"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                            }}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={24} className="text-blue-600" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Photobook Preview
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {albumData?.bookName || "Photo Album"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                                    aria-label="Close Preview"
                                >
                                    <X size={24} className="text-gray-600" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pages.map((page, index) => (
                                        <div
                                            key={page.id}
                                            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                                        >
                                            <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                                                Page {index + 1}
                                            </div>
                                            <div
                                                className="relative"
                                                style={{
                                                    width: '100%',
                                                    height: '300px',
                                                    backgroundColor: page.background
                                                }}
                                            >
                                                {page.elements.map((element) => (
                                                    <div
                                                        key={element.id}
                                                        className="absolute"
                                                        style={{
                                                            left: `${(element.x / 500) * 100}%`,
                                                            top: `${(element.y / 400) * 100}%`,
                                                            width: `${(element.width / 500) * 100}%`,
                                                            height: `${(element.height / 400) * 100}%`,
                                                            transform: `rotate(${element.rotation || 0}deg)`
                                                        }}
                                                    >
                                                        {element.type === 'image' ? (
                                                            <img
                                                                src={(element as ImageElement).src}
                                                                alt={(element as ImageElement).alt || ""}
                                                                className="w-full h-full object-cover border border-gray-300 rounded"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="w-full h-full flex items-center justify-center text-center bg-transparent"
                                                                style={{
                                                                    fontSize: `${((element as any).fontSize || 16) * 0.8}px`,
                                                                    color: (element as any).color || '#333333'
                                                                }}
                                                            >
                                                                {(element as any).text}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />
        </div>
    );
};

export default BookAlbumPage;
