"use client";
import React, { useState, useRef, useCallback } from 'react';
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
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [currentDrawingPath, setCurrentDrawingPath] = useState<DrawingPath | null>(null);
    const [drawingColor, setDrawingColor] = useState<string>('#000000');
    const [drawingWidth, setDrawingWidth] = useState<number>(2);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Add text element
    const addText = useCallback((): void => {
        try {
            const newElement = createTextElement(
                { x: 150, y: 150 },
                'Click to edit text',
                { width: 200, height: 40, fontSize: 16, color: '#333333', rotation: 0 }
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

            // Close templates panel and automatically select the new text element to show settings panel
            setShowTemplates(false);
            setSelectedElement(newElement);
        } catch (error) {
            const editorError = handleError(error, 'Add text element');
            console.error('Error adding text element:', editorError);
        }
    }, [selectedPageIndex]);

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
    }, []);

    // Handle drag over
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
    }, []);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        if (!draggedElement) return;

        const rect = e.currentTarget.getBoundingClientRect();
        try {
            const data: DragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const newX = e.clientX - rect.left - data.offsetX;
            const newY = e.clientY - rect.top - data.offsetY;

            updateElement(draggedElement.id, { x: newX, y: newY });
            setDraggedElement(null);
        } catch (error) {
            console.error('Error parsing drag data:', error);
            setDraggedElement(null);
        }
    }, [draggedElement, updateElement]);

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
                            setShowImagePanel(true);
                            setShowDrawPanel(false);
                            setShowStickerPanel(false);
                            setShowTemplates(false);
                        }}
                        className={`p-3 rounded-lg transition-colors ${showImagePanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Add Image"
                    >
                        <Image className="w-5 h-5" />
                    </button>
                    <button
                        onClick={addText}
                        className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Add Text"
                    >
                        <Type className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setTool('draw');
                            setShowDrawPanel(true);
                            setShowImagePanel(false);
                            setShowStickerPanel(false);
                            setShowTemplates(false);
                        }}
                        className={`p-3 rounded-lg transition-colors ${tool === 'draw' || showDrawPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Draw"
                    >
                        <Pen className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setShowStickerPanel(true);
                            setShowImagePanel(false);
                            setShowDrawPanel(false);
                            setShowTemplates(false);
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
                            }
                        }}
                        className={`p-3 rounded-lg transition-colors ${showTemplates ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Templates"
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <div className="border-t pt-4 flex flex-col gap-2">
                        {backgroundColors.map((color: string, index: number) => (
                            <button
                                key={index}
                                onClick={() => changeBackground(color)}
                                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                                style={{ backgroundColor: color }}
                                title="Background Color"
                            />
                        ))}
                    </div>
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
                            {/* Upload from Computer */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-600 mb-3">Upload from your computer</p>
                                <button
                                    onClick={handleModalFileUpload}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Choose File
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    Supports JPG, PNG, GIF up to 10MB
                                </p>
                            </div>

                            {/* Stock Photos Section */}
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Sample Images</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        '/api/placeholder/150/100',
                                        '/api/placeholder/150/100',
                                        '/api/placeholder/150/100',
                                        '/api/placeholder/150/100',
                                        '/api/placeholder/150/100',
                                        '/api/placeholder/150/100'
                                    ].map((src, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                try {
                                                    const newElement = createImageElement(
                                                        { x: 100, y: 100 },
                                                        src,
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
                                                    const editorError = handleError(error, 'Add sample image');
                                                    console.error('Error adding sample image:', editorError);
                                                }
                                            }}
                                            className="aspect-video bg-gray-200 rounded border-2 border-gray-200 hover:border-blue-500 transition-colors overflow-hidden"
                                        >
                                            <img
                                                src={src}
                                                alt={`Sample ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Drawing Panel */}
                {showDrawPanel && (
                    <div className="w-80 bg-white border-r p-4 h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Drawing Tools</h3>
                            <button
                                onClick={() => {
                                    setShowDrawPanel(false);
                                    setTool('select');
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close Drawing"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Drawing Tools */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brush Color</label>
                                <input
                                    type="color"
                                    value={drawingColor}
                                    onChange={(e) => setDrawingColor(e.target.value)}
                                    className="w-full h-10 border border-gray-300 rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brush Size: {drawingWidth}px
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={drawingWidth}
                                    onChange={(e) => setDrawingWidth(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Drawing Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800 mb-2">How to draw:</p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• Click and drag on the canvas to draw</li>
                                    <li>• Change colors and brush size above</li>
                                    <li>• Click outside to stop drawing</li>
                                </ul>
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

                {/* Canvas Area */}
                <div className='flex-1 flex justify-center items-start pt-3 overflow-auto'>
                    <div className="flex flex-col items-center">
                        {/* Spread Navigation */}
                        <div className="flex items-center gap-4 mb-6">
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

                        {/* Spread Canvas - Left and Right Pages */}
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
                                        handleDrop(e);
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
                                        handleDrop(e);
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
