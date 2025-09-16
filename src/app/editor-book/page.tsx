"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Image, Type, Palette, Download, Save, Grid, Layers, Move, RotateCcw, Trash2, Upload, Pen, Sticker } from 'lucide-react';

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
    PhotobookEditorProps,
    DEFAULT_PAGE_SIZE
} from './types';

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
} from './utils';

const PhotobookEditor: React.FC<PhotobookEditorProps> = ({
    initialPages,
    onSave,
    onExport
}) => {
    const [currentSpread, setCurrentSpread] = useState<number>(0);
    const [viewMode, setViewMode] = useState<'spread' | 'scroll'>('spread');
    const [pages, setPages] = useState<Page[]>(initialPages || [
        { id: 1, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
        { id: 2, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
        { id: 3, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height },
        { id: 4, elements: [], background: '#ffffff', width: DEFAULT_PAGE_SIZE.width, height: DEFAULT_PAGE_SIZE.height }
    ]);
    const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0); // Which page is currently being edited
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
    const [showTextInput, setShowTextInput] = useState<boolean>(false);
    const [textInputValue, setTextInputValue] = useState<string>('');
    const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);

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

    const backgroundColors: string[] = ['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd'];

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

    // Enhanced add text element with input box
    const addText = useCallback((position?: { x: number; y: number }): void => {
        const textPosition = position || { x: 150, y: 150 };
        
        // Show text input box at the specified position
        setTextInputPosition(textPosition);
        setTextInputValue('');
        setShowTextInput(true);
        
        // Focus the input after a brief delay to ensure it's rendered
        setTimeout(() => {
            textInputRef.current?.focus();
        }, 100);
    }, []);

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

    // Handle drag start
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, element: Element): void => {
        setDraggedElement(element);
        const rect = e.currentTarget.getBoundingClientRect();
        const dragData: DragData = {
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            elementId: element.id
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    // Handle drag over
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    // Enhanced drop handler that supports cross-page dragging
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetPageIndex: number): void => {
        e.preventDefault();
        if (!draggedElement) return;

        const rect = e.currentTarget.getBoundingClientRect();
        try {
            const data: DragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const newX = Math.max(0, Math.min(e.clientX - rect.left - data.offsetX, DEFAULT_PAGE_SIZE.width - draggedElement.width));
            const newY = Math.max(0, Math.min(e.clientY - rect.top - data.offsetY, DEFAULT_PAGE_SIZE.height - draggedElement.height));

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

            // Update pages state
            setPages(prevPages => {
                const newPages = [...prevPages];
                
                // Remove element from source page
                newPages[sourcePageIndex] = {
                    ...newPages[sourcePageIndex],
                    elements: newPages[sourcePageIndex].elements.filter(el => el.id !== draggedElement.id)
                };
                
                // Add element to target page
                newPages[targetPageIndex] = {
                    ...newPages[targetPageIndex],
                    elements: [...newPages[targetPageIndex].elements, updatedElement]
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

    // Change background for selected page
    const changeBackground = useCallback((color: string): void => {
        setPages(prevPages => prevPages.map((page, index) =>
            index === selectedPageIndex
                ? { ...page, background: color }
                : page
        ));
    }, [selectedPageIndex]);

    // Handle save action
    const handleSave = useCallback((): void => {
        if (onSave) {
            onSave(pages);
        } else {
            // Default save behavior - could save to localStorage or make API call
            localStorage.setItem('photobook-pages', JSON.stringify(pages));
            console.log('Pages saved to localStorage');
        }
    }, [pages, onSave]);

    // Handle export action
    const handleExport = useCallback((): void => {
        if (onExport) {
            const exportOptions = {
                format: 'json' as const,
                quality: 100,
                includeMetadata: true
            };
            onExport(pages, exportOptions);
        } else {
            // Default export behavior - could generate PDF or download JSON
            const dataStr = JSON.stringify(pages, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = `photobook-${Date.now()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    }, [pages, onExport]);

    // Get current spread pages (left and right)
    const leftPageIndex = currentSpread * 2;
    const rightPageIndex = currentSpread * 2 + 1;
    const leftPage = pages[leftPageIndex];
    const rightPage = pages[rightPageIndex];
    const totalSpreads = Math.ceil(pages.length / 2);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+L to add text
            if (e.ctrlKey && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                addText();
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
    }, [addText, showTextInput, handleTextInputCancel, handleTextInputSubmit]);

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

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b flex items-center justify-between px-6 py-3">
                <h1 className="text-xl font-semibold text-gray-800">Photobook Editor</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            <div className='flex flex-row h-full'>
                {/* Left Toolbar */}
                <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-4">
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
                        }}
                        className={`p-3 rounded-lg transition-colors ${showImagePanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Add Image"
                    >
                        <Image className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => addText()}
                        className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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
                        }}
                        className={`p-3 rounded-lg transition-colors ${showStickerPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Add Sticker"
                    >
                        <Sticker className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setShowTemplates(!showTemplates);
                            if (!showTemplates) {
                                setShowImagePanel(false);
                                setShowDrawPanel(false);
                                setShowStickerPanel(false);
                                setShowBackgroundPanel(false);
                            }
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
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { 
                                            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&crop=center',
                                            name: 'Mountain Landscape',
                                            category: 'Nature'
                                        },
                                        { 
                                            src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop&crop=center',
                                            name: 'Forest Path',
                                            category: 'Nature'
                                        },
                                        { 
                                            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&crop=center',
                                            name: 'City Skyline',
                                            category: 'Urban'
                                        },
                                        { 
                                            src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop&crop=center',
                                            name: 'Ocean Waves',
                                            category: 'Seascape'
                                        },
                                        { 
                                            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&crop=center',
                                            name: 'Desert Sunset',
                                            category: 'Landscape'
                                        },
                                        { 
                                            src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop&crop=center',
                                            name: 'Garden Flowers',
                                            category: 'Nature'
                                        }
                                    ].map((image, index) => (
                                        <button
                                            key={index}
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
                                                    const editorError = handleError(error, 'Add project image');
                                                    console.error('Error adding project image:', editorError);
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
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
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

                {/* Background Color Panel */}
                {showBackgroundPanel && (
                    <div className="w-80 bg-white border-r p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Background Colors</h3>
                            <button
                                onClick={() => setShowBackgroundPanel(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Background Colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
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
                                            
                                            // Show alert to confirm color selection
                                            const confirmColor = window.confirm(
                                                `Do you want to apply the color ${selectedColor} to the current page background?\n\nPage: ${selectedPageIndex + 1}\nColor: ${selectedColor}`
                                            );
                                            
                                            if (confirmColor) {
                                                changeBackground(selectedColor);
                                                alert(`Background color changed to ${selectedColor} for page ${selectedPageIndex + 1}!`);
                                            }
                                        }}
                                        className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                                        title="Click to select a custom color"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Click the color box above to open color picker
                                    </p>
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
                                                // Show alert to confirm color selection
                                                const confirmColor = window.confirm(
                                                    `Do you want to apply ${preset.name} (${preset.color}) to the current page background?\n\nPage: ${selectedPageIndex + 1}\nColor: ${preset.name}`
                                                );
                                                
                                                if (confirmColor) {
                                                    changeBackground(preset.color);
                                                    alert(`Background changed to ${preset.name} for page ${selectedPageIndex + 1}!`);
                                                }
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

                            {/* Current Page Info */}
                            <div className="border-t pt-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800 mb-2">Current Page Info:</p>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• Page Number: {selectedPageIndex + 1}</li>
                                        <li>• Current Background: {pages[selectedPageIndex]?.background || '#ffffff'}</li>
                                        <li>• Click any color to change this page's background</li>
                                        <li>• You'll be asked to confirm before applying</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-sm text-gray-800 mb-2">How to use:</p>
                                <ul className="text-xs text-gray-600 space-y-1">
                                    <li>• Select a page by clicking on it</li>
                                    <li>• Choose a color from presets or use custom picker</li>
                                    <li>• Confirm your selection in the alert dialog</li>
                                    <li>• Each page can have its own background color</li>
                                </ul>
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
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setSelectedPageIndex(leftPageIndex);
                                                    setSelectedElement(element);
                                                }}
                                                className={`absolute cursor-move ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                                                    }`}
                                                style={{
                                                    left: element.x,
                                                    top: element.y,
                                                    width: element.width,
                                                    height: element.height,
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
                                                            fontSize: (element as TextElement).fontSize || 16,
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
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    setSelectedPageIndex(rightPageIndex);
                                                    setSelectedElement(element);
                                                }}
                                                className={`absolute cursor-move ${selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                                                    }`}
                                                style={{
                                                    left: element.x,
                                                    top: element.y,
                                                    width: element.width,
                                                    height: element.height,
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
                                                            fontSize: (element as TextElement).fontSize || 16,
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

                {/* Right Properties Panel */}
                {selectedElement && (
                    <div className="w-80 bg-white border-l p-4">
                        <h3 className="font-semibold mb-4">Properties</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Position</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.x)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        placeholder="X"
                                    />
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.y)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        placeholder="Y"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Size</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.width)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        placeholder="Width"
                                    />
                                    <input
                                        type="number"
                                        value={Math.round(selectedElement.height)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                        placeholder="Height"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Rotation</label>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={selectedElement.rotation || 0}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-500 text-center">
                                    {selectedElement.rotation || 0}°
                                </div>
                            </div>
                            {selectedElement.type === 'text' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Font Size</label>
                                        <input
                                            type="number"
                                            value={(selectedElement as TextElement).fontSize || 16}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                            min="8"
                                            max="72"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Color</label>
                                        <input
                                            type="color"
                                            value={(selectedElement as TextElement).color || '#333333'}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedElement.id, { color: e.target.value })}
                                            className="w-full h-10 border border-gray-300 rounded"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="pt-4 border-t">
                                <button
                                    onClick={() => deleteElement(selectedElement.id)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Element
                                </button>
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

export default PhotobookEditor;
