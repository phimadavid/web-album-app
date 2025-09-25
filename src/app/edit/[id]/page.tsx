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
    DrawingPath,
    Page,
    Template,
    DragData,
    Tool,
    ExportOptions,
    DEFAULT_PAGE_SIZE,
    MaskElement,
    ShapeType,
    MASK_SHAPES
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
    handleError,
    createMaskElement,
    generateShapePath,
    applyMaskToImage,
    removeMaskFromImage,
    updateMask
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
    const [isGeneratingCaption, setIsGeneratingCaption] = useState<boolean>(false);
    const [showCaptionButton, setShowCaptionButton] = useState<boolean>(false);
    const [generatedCaption, setGeneratedCaption] = useState<string>('');
    const [showLayoutButton, setShowLayoutButton] = useState<boolean>(false);
    const [isGeneratingLayout, setIsGeneratingLayout] = useState<boolean>(false);
    const [layoutButtonPosition, setLayoutButtonPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [currentLayoutIndex, setCurrentLayoutIndex] = useState<number>(0);
    // Mask-related states
    const [showMaskPanel, setShowMaskPanel] = useState<boolean>(false);
    const [selectedMaskShape, setSelectedMaskShape] = useState<ShapeType>('circle');
    const [maskFeather, setMaskFeather] = useState<number>(0);
    const [maskInvert, setMaskInvert] = useState<boolean>(false);
    const [maskOpacity, setMaskOpacity] = useState<number>(1);
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
            { position: 'nw', cursor: 'nw-resize', style: { top: -handleSize / 2, left: -handleSize / 2 } },
            { position: 'n', cursor: 'n-resize', style: { top: -handleSize / 2, left: '50%', transform: 'translateX(-50%)' } },
            { position: 'ne', cursor: 'ne-resize', style: { top: -handleSize / 2, right: -handleSize / 2 } },
            { position: 'e', cursor: 'e-resize', style: { top: '50%', right: -handleSize / 2, transform: 'translateY(-50%)' } },
            { position: 'se', cursor: 'se-resize', style: { bottom: -handleSize / 2, right: -handleSize / 2 } },
            { position: 's', cursor: 's-resize', style: { bottom: -handleSize / 2, left: '50%', transform: 'translateX(-50%)' } },
            { position: 'sw', cursor: 'sw-resize', style: { bottom: -handleSize / 2, left: -handleSize / 2 } },
            { position: 'w', cursor: 'w-resize', style: { top: '50%', left: -handleSize / 2, transform: 'translateY(-50%)' } }
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

    // Show caption button when image is selected
    useEffect(() => {
        if (selectedElement && selectedElement.type === 'image') {
            setShowCaptionButton(true);
        } else {
            setShowCaptionButton(false);
            setGeneratedCaption('');
        }
    }, [selectedElement]);

    // Generate AI caption for selected image with theme support
    const generateAICaption = useCallback(async (theme?: string, style?: string, tone?: string) => {
        if (!selectedElement || selectedElement.type !== 'image') {
            toast.error('Please select an image first');
            return;
        }

        setIsGeneratingCaption(true);
        try {
            const imageElement = selectedElement as ImageElement;

            // Convert image to blob for API call
            let blob: Blob | null = null;
            
            // Handle different image sources (base64, URL, etc.)
            if (imageElement.src.startsWith('data:')) {
                // Handle base64 data URLs - these work reliably
                const response = await fetch(imageElement.src);
                blob = await response.blob();
            } else {
                // For external URLs, try multiple approaches to handle CORS
                let imageProcessed = false;
                
                // Method 1: Try direct fetch with CORS
                try {
                    const response = await fetch(imageElement.src, {
                        mode: 'cors',
                        credentials: 'omit',
                        headers: {
                            'Accept': 'image/*'
                        }
                    });
                    
                    if (response.ok) {
                        blob = await response.blob();
                        imageProcessed = true;
                    }
                } catch (fetchError) {
                    console.log('Direct CORS fetch failed, trying proxy approach');
                }

                // Method 2: Try using a CORS proxy through our API
                if (!imageProcessed) {
                    try {
                        const proxyResponse = await fetch('/api/image-proxy', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ imageUrl: imageElement.src })
                        });

                        if (proxyResponse.ok) {
                            blob = await proxyResponse.blob();
                            imageProcessed = true;
                        }
                    } catch (proxyError) {
                        console.log('Proxy approach failed, trying public CORS proxy');
                    }
                }

                // Method 2.5: Try public CORS proxy services
                if (!imageProcessed) {
                    const corsProxies = [
                        'https://api.allorigins.win/raw?url=',
                        'https://cors-anywhere.herokuapp.com/',
                        'https://thingproxy.freeboard.io/fetch/'
                    ];

                    for (const proxy of corsProxies) {
                        try {
                            const proxyUrl = proxy + encodeURIComponent(imageElement.src);
                            const response = await fetch(proxyUrl, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'image/*',
                                    'X-Requested-With': 'XMLHttpRequest'
                                }
                            });

                            if (response.ok) {
                                blob = await response.blob();
                                imageProcessed = true;
                                console.log(`Successfully fetched image via ${proxy}`);
                                break;
                            }
                        } catch (proxyError) {
                            console.log(`CORS proxy ${proxy} failed:`, proxyError);
                            continue;
                        }
                    }
                }

                // Method 3: Canvas approach with better CORS handling
                if (!imageProcessed) {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = document.createElement('img');
                        
                        // Create a promise to handle image loading
                        const imageLoadPromise = new Promise<Blob>((resolve, reject) => {
                            img.onload = () => {
                                try {
                                    canvas.width = img.naturalWidth || img.width;
                                    canvas.height = img.naturalHeight || img.height;
                                    
                                    // Clear canvas and draw image
                                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                                    ctx?.drawImage(img, 0, 0);
                                    
                                    canvas.toBlob((canvasBlob) => {
                                        if (canvasBlob && canvasBlob.size > 0) {
                                            resolve(canvasBlob);
                                        } else {
                                            reject(new Error('Failed to convert canvas to blob'));
                                        }
                                    }, 'image/jpeg', 0.9);
                                } catch (canvasError) {
                                    reject(canvasError);
                                }
                            };
                            
                            img.onerror = (error) => {
                                reject(new Error('Failed to load image - CORS or network error'));
                            };
                            
                            // Set a timeout for image loading
                            setTimeout(() => {
                                reject(new Error('Image loading timeout'));
                            }, 15000);
                        });
                        
                        // Try different CORS settings
                        img.crossOrigin = 'anonymous';
                        
                        // Add a small delay to ensure crossOrigin is set
                        setTimeout(() => {
                            img.src = imageElement.src;
                        }, 10);
                        
                        blob = await imageLoadPromise;
                        imageProcessed = true;
                    } catch (canvasError) {
                        console.error('Canvas approach failed:', canvasError);
                    }
                }

                // Method 4: If all else fails, throw an error
                if (!imageProcessed) {
                    throw new Error('Unable to access image for caption generation. The image may be from a different domain with CORS restrictions. Try uploading the image directly to the editor.');
                }
            }

            // Validate blob
            if (!blob || blob.size === 0) {
                throw new Error('Invalid image data - the image may be corrupted or inaccessible');
            }

            // Create FormData for the caption API with theme support
            const formData = new FormData();
            formData.append('file', blob, 'image.jpg');
            
            // Add theme, style, and tone parameters if provided
            if (theme) formData.append('theme', theme);
            if (style) formData.append('style', style);
            if (tone) formData.append('tone', tone);

            // Call the enhanced Replicate AI caption API
            const captionResponse = await fetch('/api/caption', {
                method: 'POST',
                body: formData,
            });

            if (captionResponse.ok) {
                const data = await captionResponse.json();
                const caption = data.caption || 'A beautiful moment captured in time.';

                setGeneratedCaption(caption);

                // Automatically add the caption as text below the image
                const captionPosition = {
                    x: imageElement.x,
                    y: Math.min(imageElement.y + imageElement.height + 10, DEFAULT_PAGE_SIZE.height - 40)
                };

                const captionElement = createTextElement(
                    captionPosition,
                    caption,
                    {
                        width: Math.min(imageElement.width, DEFAULT_PAGE_SIZE.width - captionPosition.x),
                        height: 30,
                        fontSize: 14,
                        color: '#333333',
                        rotation: 0,
                        fontFamily: 'Arial',
                        textAlign: 'center'
                    }
                );

                const validation = validateElement(captionElement);
                if (validation.isValid) {
                    setPages(prevPages => prevPages.map((page, index) =>
                        index === selectedPageIndex
                            ? { ...page, elements: [...page.elements, captionElement] }
                            : page
                    ));
                    
                    // Select the newly created caption for immediate editing
                    setSelectedElement(captionElement);
                } else {
                    console.error('Invalid caption element created:', validation.errors);
                    toast.error('Failed to add caption to page');
                }
            } else {
                const errorData = await captionResponse.json().catch(() => ({}));
                console.error('Caption API error:', errorData);
                
                if (captionResponse.status === 500 && errorData.error === 'API key not configured') {
                    toast.error('AI service not configured. Please check your Replicate API key.');
                } else {
                    toast.error(`Failed to generate caption: ${errorData.error || 'Unknown error'}`);
                }

                // Fallback caption if API fails
                const fallbackCaption = 'A wonderful memory captured forever.';
                setGeneratedCaption(fallbackCaption);

                const captionPosition = {
                    x: imageElement.x,
                    y: Math.min(imageElement.y + imageElement.height + 10, DEFAULT_PAGE_SIZE.height - 40)
                };

                const captionElement = createTextElement(
                    captionPosition,
                    fallbackCaption,
                    {
                        width: Math.min(imageElement.width, DEFAULT_PAGE_SIZE.width - captionPosition.x),
                        height: 30,
                        fontSize: 14,
                        color: '#333333',
                        rotation: 0,
                        fontFamily: 'Arial',
                        textAlign: 'center'
                    }
                );

                const validation = validateElement(captionElement);
                if (validation.isValid) {
                    setPages(prevPages => prevPages.map((page, index) =>
                        index === selectedPageIndex
                            ? { ...page, elements: [...page.elements, captionElement] }
                            : page
                    ));
                    setSelectedElement(captionElement);
                }
            }
        } catch (error) {
            console.error('Error generating AI caption:', error);
            
            let errorMessage = 'Failed to generate AI caption';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            // Show user-friendly error message
            if (errorMessage.includes('CORS')) {
                toast.error('Cannot access image due to security restrictions. Try uploading the image directly to the editor for AI caption generation.', {
                    autoClose: 5000
                });
            } else {
                toast.error(errorMessage);
            }

            // Always provide a fallback caption for better user experience
            const fallbackCaption = 'A precious moment in time.';
            setGeneratedCaption(fallbackCaption);

            const imageElement = selectedElement as ImageElement;
            const captionPosition = {
                x: imageElement.x,
                y: Math.min(imageElement.y + imageElement.height + 10, DEFAULT_PAGE_SIZE.height - 40)
            };

            const captionElement = createTextElement(
                captionPosition,
                fallbackCaption,
                {
                    width: Math.min(imageElement.width, DEFAULT_PAGE_SIZE.width - captionPosition.x),
                    height: 30,
                    fontSize: 14,
                    color: '#333333',
                    rotation: 0,
                    fontFamily: 'Arial',
                    textAlign: 'center'
                }
            );

            const validation = validateElement(captionElement);
            if (validation.isValid) {
                setPages(prevPages => prevPages.map((page, index) =>
                    index === selectedPageIndex
                        ? { ...page, elements: [...page.elements, captionElement] }
                        : page
                ));
                setSelectedElement(captionElement);
                
                // Inform user that a fallback caption was added
                toast.info('Added a fallback caption. You can edit it by double-clicking the text.', {
                    autoClose: 3000
                });
            }
        } finally {
            setIsGeneratingCaption(false);
        }
    }, [selectedElement, selectedPageIndex, createTextElement, validateElement]);

    // Generate AI layout for current page - Auto arrange existing images
    const generateAILayout = useCallback(async () => {
        setIsGeneratingLayout(true);
        try {
            // Analyze current page context
            const currentPage = pages[selectedPageIndex];
            const imageElements = currentPage.elements.filter(el => el.type === 'image') as ImageElement[];
            const textElements = currentPage.elements.filter(el => el.type === 'text');
            const otherElements = currentPage.elements.filter(el => el.type !== 'image' && el.type !== 'text');

            if (imageElements.length === 0) {
                toast.info('No images found on this page to arrange');
                setShowLayoutButton(false);
                return;
            }

            // Generate different layout patterns based on number of images
            const arrangedImages = arrangeImagesInLayout(imageElements, imageElements.length);

            // Update the page with rearranged images
            setPages(prevPages => prevPages.map((page, index) =>
                index === selectedPageIndex
                    ? {
                        ...page,
                        elements: [...arrangedImages, ...textElements, ...otherElements]
                    }
                    : page
            ));

        } catch (error) {
            console.error('Error generating AI layout:', error);
        } finally {
            setIsGeneratingLayout(false);
            setShowLayoutButton(false);
        }
    }, [selectedPageIndex, pages]);

    // Arrange images in different layout patterns with multiple variations
    const arrangeImagesInLayout = useCallback((images: ImageElement[], count: number): ImageElement[] => {
        const layoutVariations = {
            1: [
                [{ x: 200, y: 150, width: 200, height: 150 }], // Centered
                [{ x: 100, y: 100, width: 300, height: 200 }], // Large centered
                [{ x: 250, y: 80, width: 150, height: 240 }]   // Portrait centered
            ],
            2: [
                // Variation 1: Side by side
                [
                    { x: 80, y: 150, width: 160, height: 120 },
                    { x: 260, y: 150, width: 160, height: 120 }
                ],
                // Variation 2: Top and bottom
                [
                    { x: 200, y: 80, width: 200, height: 120 },
                    { x: 200, y: 220, width: 200, height: 120 }
                ],
                // Variation 3: Diagonal
                [
                    { x: 50, y: 80, width: 180, height: 135 },
                    { x: 270, y: 185, width: 180, height: 135 }
                ],
                // Variation 4: Large and small
                [
                    { x: 50, y: 50, width: 250, height: 180 },
                    { x: 320, y: 250, width: 130, height: 100 }
                ]
            ],
            3: [
                // Variation 1: Triangle
                [
                    { x: 200, y: 50, width: 180, height: 120 },
                    { x: 80, y: 200, width: 160, height: 120 },
                    { x: 260, y: 200, width: 160, height: 120 }
                ],
                // Variation 2: Vertical stack
                [
                    { x: 200, y: 50, width: 200, height: 100 },
                    { x: 200, y: 160, width: 200, height: 100 },
                    { x: 200, y: 270, width: 200, height: 100 }
                ],
                // Variation 3: L-shape
                [
                    { x: 50, y: 50, width: 200, height: 150 },
                    { x: 270, y: 50, width: 130, height: 100 },
                    { x: 270, y: 170, width: 130, height: 100 }
                ]
            ],
            4: [
                // Variation 1: Grid 2x2
                [
                    { x: 80, y: 80, width: 160, height: 120 },
                    { x: 260, y: 80, width: 160, height: 120 },
                    { x: 80, y: 220, width: 160, height: 120 },
                    { x: 260, y: 220, width: 160, height: 120 }
                ],
                // Variation 2: One large, three small
                [
                    { x: 50, y: 50, width: 250, height: 180 },
                    { x: 320, y: 50, width: 130, height: 85 },
                    { x: 320, y: 145, width: 130, height: 85 },
                    { x: 320, y: 240, width: 130, height: 85 }
                ],
                // Variation 3: Cross pattern
                [
                    { x: 200, y: 30, width: 150, height: 100 },
                    { x: 50, y: 140, width: 150, height: 100 },
                    { x: 200, y: 140, width: 150, height: 100 },
                    { x: 350, y: 140, width: 150, height: 100 }
                ],
                // Variation 4: Horizontal line
                [
                    { x: 30, y: 150, width: 100, height: 100 },
                    { x: 140, y: 150, width: 100, height: 100 },
                    { x: 250, y: 150, width: 100, height: 100 },
                    { x: 360, y: 150, width: 100, height: 100 }
                ]
            ],
            5: [
                // Variation 1: Cross pattern
                [
                    { x: 200, y: 30, width: 160, height: 100 },
                    { x: 50, y: 150, width: 120, height: 90 },
                    { x: 190, y: 150, width: 120, height: 90 },
                    { x: 330, y: 150, width: 120, height: 90 },
                    { x: 200, y: 260, width: 160, height: 100 }
                ],
                // Variation 2: Pentagon
                [
                    { x: 200, y: 30, width: 140, height: 90 },
                    { x: 80, y: 130, width: 120, height: 80 },
                    { x: 300, y: 130, width: 120, height: 80 },
                    { x: 120, y: 230, width: 120, height: 80 },
                    { x: 260, y: 230, width: 120, height: 80 }
                ],
                // Variation 3: Flower pattern
                [
                    { x: 200, y: 150, width: 140, height: 100 }, // Center
                    { x: 200, y: 50, width: 100, height: 80 },   // Top
                    { x: 350, y: 150, width: 100, height: 80 },  // Right
                    { x: 200, y: 270, width: 100, height: 80 },  // Bottom
                    { x: 50, y: 150, width: 100, height: 80 }    // Left
                ]
            ],
            6: [
                // Variation 1: Grid 3x2
                [
                    { x: 50, y: 50, width: 120, height: 90 },
                    { x: 190, y: 50, width: 120, height: 90 },
                    { x: 330, y: 50, width: 120, height: 90 },
                    { x: 50, y: 160, width: 120, height: 90 },
                    { x: 190, y: 160, width: 120, height: 90 },
                    { x: 330, y: 160, width: 120, height: 90 }
                ],
                // Variation 2: Grid 2x3
                [
                    { x: 100, y: 40, width: 140, height: 90 },
                    { x: 260, y: 40, width: 140, height: 90 },
                    { x: 100, y: 140, width: 140, height: 90 },
                    { x: 260, y: 140, width: 140, height: 90 },
                    { x: 100, y: 240, width: 140, height: 90 },
                    { x: 260, y: 240, width: 140, height: 90 }
                ],
                // Variation 3: Hexagon pattern
                [
                    { x: 150, y: 30, width: 100, height: 80 },   // Top center
                    { x: 270, y: 30, width: 100, height: 80 },   // Top right
                    { x: 320, y: 120, width: 100, height: 80 },  // Middle right
                    { x: 270, y: 210, width: 100, height: 80 },  // Bottom right
                    { x: 150, y: 210, width: 100, height: 80 },  // Bottom center
                    { x: 80, y: 120, width: 100, height: 80 }    // Middle left
                ],
                // Variation 4: Pyramid
                [
                    { x: 200, y: 30, width: 120, height: 80 },   // Top
                    { x: 120, y: 120, width: 120, height: 80 },  // Middle left
                    { x: 260, y: 120, width: 120, height: 80 },  // Middle right
                    { x: 80, y: 210, width: 100, height: 80 },   // Bottom left
                    { x: 200, y: 210, width: 100, height: 80 },  // Bottom center
                    { x: 320, y: 210, width: 100, height: 80 }   // Bottom right
                ]
            ]
        };

        // Get available variations for the image count
        const availableLayouts = layoutVariations[Math.min(count, 6) as keyof typeof layoutVariations] || [layoutVariations[6][0]];

        // Cycle through layout variations
        const layoutIndex = currentLayoutIndex % availableLayouts.length;
        const selectedLayout = availableLayouts[layoutIndex];

        // Update layout index for next time
        setCurrentLayoutIndex(prev => prev + 1);

        // If more than 6 images, create a grid layout
        if (count > 6) {
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            const imageWidth = Math.floor((DEFAULT_PAGE_SIZE.width - 60) / cols);
            const imageHeight = Math.floor((DEFAULT_PAGE_SIZE.height - 60) / rows);

            const gridLayout: Array<{ x: number; y: number; width: number; height: number }> = [];
            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                gridLayout.push({
                    x: 30 + col * (imageWidth + 10),
                    y: 30 + row * (imageHeight + 10),
                    width: imageWidth,
                    height: imageHeight
                });
            }

            return images.map((image, index) => ({
                ...image,
                x: gridLayout[index]?.x || image.x,
                y: gridLayout[index]?.y || image.y,
                width: gridLayout[index]?.width || image.width,
                height: gridLayout[index]?.height || image.height
            }));
        }

        // Apply selected layout pattern
        return images.map((image, index) => ({
            ...image,
            x: selectedLayout[index]?.x || image.x,
            y: selectedLayout[index]?.y || image.y,
            width: selectedLayout[index]?.width || image.width,
            height: selectedLayout[index]?.height || image.height
        }));
    }, [currentLayoutIndex]);

    // Get layout name for user feedback
    const getLayoutName = useCallback((count: number): string => {
        const layoutVariationNames = {
            1: ['Single Centered', 'Large Centered', 'Portrait Centered'],
            2: ['Side by Side', 'Top & Bottom', 'Diagonal', 'Large & Small'],
            3: ['Triangle', 'Vertical Stack', 'L-Shape'],
            4: ['Grid 2x2', 'One Large + Three Small', 'Cross Pattern', 'Horizontal Line'],
            5: ['Cross Pattern', 'Pentagon', 'Flower Pattern'],
            6: ['Grid 3x2', 'Grid 2x3', 'Hexagon Pattern', 'Pyramid']
        };

        const variations = layoutVariationNames[Math.min(count, 6) as keyof typeof layoutVariationNames] || ['Grid Layout'];
        const variationIndex = (currentLayoutIndex - 1) % variations.length;

        return variations[variationIndex] || `Grid ${Math.ceil(Math.sqrt(count))}x${Math.ceil(count / Math.ceil(Math.sqrt(count)))}`;
    }, [currentLayoutIndex]);

    // Apply mask to selected image
    const applyMaskToSelectedImage = useCallback((shapeType: ShapeType) => {
        if (!selectedElement || selectedElement.type !== 'image') {
            toast.error('Please select an image first to apply a mask');
            return;
        }

        const imageElement = selectedElement as ImageElement;
        
        // Create mask element
        const mask = createMaskElement(
            shapeType,
            { x: 0, y: 0 }, // Relative to image
            { width: imageElement.width, height: imageElement.height },
            {
                feather: maskFeather,
                invert: maskInvert,
                opacity: maskOpacity
            }
        );

        // Apply mask to image
        const maskedImage = applyMaskToImage(imageElement, mask);

        // Update the element in the page
        updateElement(imageElement.id, maskedImage);

        toast.success(`${MASK_SHAPES[shapeType].name} mask applied to image!`);
        setShowStickerPanel(false);
    }, [selectedElement, maskFeather, maskInvert, maskOpacity, updateElement]);

    // Remove mask from selected image
    const removeMaskFromSelectedImage = useCallback(() => {
        if (!selectedElement || selectedElement.type !== 'image') {
            toast.error('Please select an image first');
            return;
        }

        const imageElement = selectedElement as ImageElement;
        
        if (!imageElement.mask) {
            toast.info('This image does not have a mask applied');
            return;
        }

        // Remove mask from image
        const unmaskedImage = removeMaskFromImage(imageElement);

        // Update the element in the page
        updateElement(imageElement.id, unmaskedImage);

        toast.success('Mask removed from image!');
    }, [selectedElement, updateElement]);

    // Update mask properties for selected image
    const updateSelectedImageMask = useCallback((maskUpdates: Partial<MaskElement>) => {
        if (!selectedElement || selectedElement.type !== 'image') {
            return;
        }

        const imageElement = selectedElement as ImageElement;
        
        if (!imageElement.mask) {
            return;
        }

        // Update mask properties
        const updatedImage = updateMask(imageElement, maskUpdates);

        // Update the element in the page
        updateElement(imageElement.id, updatedImage);
    }, [selectedElement, updateElement]);

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
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isSaving
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

                            {/* Image Masks */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Image Masks</h4>
                                <p className="text-xs text-gray-600 mb-3">
                                    Select an image first, then choose a mask shape to apply
                                </p>
                                
                                {/* Mask Shape Selection */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {Object.entries(MASK_SHAPES).map(([shapeType, shapeInfo]) => (
                                        <button
                                            key={shapeType}
                                            onClick={() => applyMaskToSelectedImage(shapeType as ShapeType)}
                                            disabled={!selectedElement || selectedElement.type !== 'image'}
                                            className={`aspect-square bg-gray-100 rounded-lg border-2 transition-colors text-lg flex items-center justify-center ${
                                                !selectedElement || selectedElement.type !== 'image'
                                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-200 hover:border-blue-500 text-gray-700 cursor-pointer'
                                            }`}
                                            title={`Apply ${shapeInfo.name} mask`}
                                        >
                                            {shapeInfo.icon}
                                        </button>
                                    ))}
                                </div>

                                {/* Mask Controls */}
                                {selectedElement && selectedElement.type === 'image' && (
                                    <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h5 className="text-sm font-medium text-blue-800">Mask Settings</h5>
                                        
                                        {/* Feather Control */}
                                        <div>
                                            <label className="block text-xs text-blue-700 mb-1">
                                                Feather: {maskFeather}px
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="20"
                                                step="1"
                                                value={maskFeather}
                                                onChange={(e) => {
                                                    const newFeather = parseInt(e.target.value);
                                                    setMaskFeather(newFeather);
                                                    if ((selectedElement as ImageElement).mask) {
                                                        updateSelectedImageMask({ feather: newFeather });
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Opacity Control */}
                                        <div>
                                            <label className="block text-xs text-blue-700 mb-1">
                                                Opacity: {Math.round(maskOpacity * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={maskOpacity}
                                                onChange={(e) => {
                                                    const newOpacity = parseFloat(e.target.value);
                                                    setMaskOpacity(newOpacity);
                                                    if ((selectedElement as ImageElement).mask) {
                                                        updateSelectedImageMask({ opacity: newOpacity });
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Invert Toggle */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="mask-invert"
                                                checked={maskInvert}
                                                onChange={(e) => {
                                                    const newInvert = e.target.checked;
                                                    setMaskInvert(newInvert);
                                                    if ((selectedElement as ImageElement).mask) {
                                                        updateSelectedImageMask({ invert: newInvert });
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <label htmlFor="mask-invert" className="text-xs text-blue-700">
                                                Invert mask
                                            </label>
                                        </div>

                                        {/* Remove Mask Button */}
                                        {(selectedElement as ImageElement).mask && (
                                            <button
                                                onClick={removeMaskFromSelectedImage}
                                                className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                            >
                                                Remove Mask
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Instructions */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs text-gray-700 mb-2">💡 How to use masks:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li>1. Select an image on the canvas</li>
                                        <li>2. Choose a mask shape above</li>
                                        <li>3. Adjust feather for soft edges</li>
                                        <li>4. Use invert to flip the mask</li>
                                        <li>5. Adjust opacity for transparency</li>
                                    </ul>
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

                        {/* Manual Text Editor */}
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
                                    className={`w-full px-4 py-2 rounded-lg transition-colors text-sm ${textInputValue.trim()
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    Add Text to Page
                                </button>
                            </div>
                        </div>
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
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${backgroundScope === 'current'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Current Page
                                </button>
                                <button
                                    onClick={() => setBackgroundScope('all')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${backgroundScope === 'all'
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
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${backgroundMode === 'color'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Colors
                                </button>
                                <button
                                    onClick={() => setBackgroundMode('library')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${backgroundMode === 'library'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Library
                                </button>
                                <button
                                    onClick={() => setBackgroundMode('ai')}
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${backgroundMode === 'ai'
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
                                                    className={`aspect-video bg-gray-200 rounded-lg border-2 transition-colors overflow-hidden group relative ${selectedLibraryBackground === bg.id
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
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${isGeneratingBackground || !aiPrompt.trim()
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
                        {/* Navigation */}
                        <div className="flex items-center gap-4 mb-6">
                            {/* Spread Navigation */}
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

                            <button
                                onClick={addPage}
                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Add Pages"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Canvas Content - Spread View */}
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

                                            // Show layout button when clicking on empty page area
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const y = e.clientY - rect.top;
                                            setLayoutButtonPosition({ x, y });
                                            setShowLayoutButton(true);

                                            // Hide layout button after 5 seconds
                                            setTimeout(() => {
                                                setShowLayoutButton(false);
                                            }, 5000);
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
                                                <div className="w-full h-full relative">
                                                    <img
                                                        src={(element as ImageElement).src}
                                                        alt={(element as ImageElement).alt || ""}
                                                        className="w-full h-full object-cover border border-gray-300"
                                                        style={{
                                                            clipPath: (element as ImageElement).mask ? 
                                                                `path('${generateShapePath(
                                                                    (element as ImageElement).mask!.shape.type,
                                                                    element.width,
                                                                    element.height,
                                                                    (element as ImageElement).mask!.shape.properties
                                                                )}')` : 
                                                                undefined,
                                                            filter: (element as ImageElement).mask?.feather ? 
                                                                `blur(${(element as ImageElement).mask!.feather}px)` : 
                                                                undefined,
                                                            opacity: (element as ImageElement).mask?.opacity || 1
                                                        }}
                                                    />
                                                </div>
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

                                            // Show layout button when clicking on empty page area
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const y = e.clientY - rect.top;
                                            setLayoutButtonPosition({ x, y });
                                            setShowLayoutButton(true);

                                            // Hide layout button after 5 seconds
                                            setTimeout(() => {
                                                setShowLayoutButton(false);
                                            }, 5000);
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
                                                <div className="w-full h-full relative">
                                                    <img
                                                        src={(element as ImageElement).src}
                                                        alt={(element as ImageElement).alt || ""}
                                                        className="w-full h-full object-cover border border-gray-300"
                                                        style={{
                                                            clipPath: (element as ImageElement).mask ? 
                                                                `path('${generateShapePath(
                                                                    (element as ImageElement).mask!.shape.type,
                                                                    element.width,
                                                                    element.height,
                                                                    (element as ImageElement).mask!.shape.properties
                                                                )}')` : 
                                                                undefined,
                                                            filter: (element as ImageElement).mask?.feather ? 
                                                                `blur(${(element as ImageElement).mask!.feather}px)` : 
                                                                undefined,
                                                            opacity: (element as ImageElement).mask?.opacity || 1
                                                        }}
                                                    />
                                                    {(element as ImageElement).mask && (
                                                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                                                            {MASK_SHAPES[(element as ImageElement).mask!.shape.type].icon}
                                                        </div>
                                                    )}
                                                </div>
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

                        {/* AI Caption Button - Shows when image is selected */}
                        {showCaptionButton && selectedElement && selectedElement.type === 'image' && (
                            <div className="fixed bottom-6 right-6 z-50">
                                <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">Smart Text & Storytelling</h4>
                                            <p className="text-xs text-gray-600">AI Assistant</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 mb-4">
                                        Generate an AI caption for this image and add it to your page.
                                    </p>

                                    {/* Theme Selection */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-gray-700 mb-2">
                                            Choose a theme (optional):
                                        </label>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            {[
                                                { key: 'family-gathering', label: '👨‍👩‍👧‍👦 Family', color: 'bg-red-50 text-red-700 border-red-200' },
                                                { key: 'birthday', label: '🎂 Birthday', color: 'bg-pink-50 text-pink-700 border-pink-200' },
                                                { key: 'wedding', label: '💒 Wedding', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                                                { key: 'vacation', label: '🏖️ Vacation', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                                { key: 'baby', label: '👶 Baby', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                                                { key: 'pets', label: '🐕 Pets', color: 'bg-green-50 text-green-700 border-green-200' }
                                            ].map((theme) => (
                                                <button
                                                    key={theme.key}
                                                    onClick={() => generateAICaption(theme.key, 'descriptive', 'warm')}
                                                    disabled={isGeneratingCaption}
                                                    className={`px-2 py-1 rounded border text-xs transition-colors hover:opacity-80 ${theme.color} ${isGeneratingCaption ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {theme.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {generatedCaption && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800 font-medium mb-1">Generated Caption:</p>
                                            <p className="text-sm text-gray-700 italic">"{generatedCaption}"</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => generateAICaption()}
                                            disabled={isGeneratingCaption}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${isGeneratingCaption
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                                                }`}
                                        >
                                            {isGeneratingCaption ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Auto Caption
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCaptionButton(false);
                                                setGeneratedCaption('');
                                            }}
                                            className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                            title="Close"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Tips */}
                                    <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                                        <p className="font-medium mb-1">💡 Tips:</p>
                                        <ul className="space-y-0.5">
                                            <li>• Click a theme for contextual captions</li>
                                            <li>• Use "Auto Caption" for general descriptions</li>
                                            <li>• Double-click generated text to edit</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Layout Button - Shows when page is clicked */}
                        {showLayoutButton && (
                            <div
                                className="fixed z-40 pointer-events-none"
                                style={{
                                    left: `${layoutButtonPosition.x + 250}px`,
                                    top: `${layoutButtonPosition.y + 200}px`,
                                }}
                            >
                                <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm pointer-events-auto">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                                            <Grid className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">AI Layout Generator</h4>
                                            <p className="text-xs text-gray-600">Page {selectedPageIndex + 1}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 mb-4">
                                        Generate an AI layout for this page based on existing content.
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={generateAILayout}
                                            disabled={isGeneratingLayout}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${isGeneratingLayout
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
                                                }`}
                                        >
                                            {isGeneratingLayout ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Grid className="w-4 h-4" />
                                                    Generate Layout
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowLayoutButton(false)}
                                            className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                            title="Close"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                        className={`px-3 py-1 rounded text-sm font-bold transition-colors ${(selectedElement as TextElement).fontWeight === 'bold'
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
                                        className={`px-3 py-1 rounded text-sm transition-colors ${(selectedElement as TextElement).textDecoration === 'underline'
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
                                            className={`px-2 py-1 rounded text-sm transition-colors ${(selectedElement as TextElement).textAlign === align
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
                                    className={`flex-1 px-4 py-2 rounded-md transition-colors ${textInputValue.trim()
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
