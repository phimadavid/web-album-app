"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Upload, 
    Calendar, 
    MapPin, 
    Users, 
    Sparkles, 
    Grid, 
    Crop, 
    RotateCcw, 
    Sliders, 
    Trash2, 
    X, 
    ChevronDown, 
    Lightbulb,
    Camera,
    Heart,
    Star,
    Eye,
    Download,
    Share2,
    Settings,
    Filter,
    Layout,
    Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// Types for AI workflow
interface AIImage {
    id: string;
    src: string;
    name: string;
    uploadDate: Date;
    aiCategories: string[];
    aiTags: string[];
    location?: string;
    people?: string[];
    event?: string;
    confidence: number;
    metadata: {
        width: number;
        height: number;
        size: number;
        format: string;
    };
}

interface AIEvent {
    id: string;
    name: string;
    images: AIImage[];
    date: Date;
    location?: string;
    confidence: number;
    aiGenerated: boolean;
}

interface AICollage {
    id: string;
    name: string;
    images: AIImage[];
    layout: 'grid' | 'mosaic' | 'story' | 'timeline';
    theme: string;
    aiGenerated: boolean;
    confidence: number;
}

interface UserAction {
    type: 'select' | 'edit' | 'categorize' | 'layout' | 'export';
    timestamp: Date;
    data: any;
}

const AIWorkflowPage: React.FC = () => {
    // State management
    const [uploadedImages, setUploadedImages] = useState<AIImage[]>([]);
    const [aiEvents, setAiEvents] = useState<AIEvent[]>([]);
    const [aiCollages, setAiCollages] = useState<AICollage[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [currentEditImage, setCurrentEditImage] = useState<AIImage | null>(null);
    const [userActions, setUserActions] = useState<UserAction[]>([]);
    const [aiLearningActive, setAiLearningActive] = useState(true);
    const [viewMode, setViewMode] = useState<'events' | 'dates' | 'people' | 'locations'>('events');
    const [showUploadZone, setShowUploadZone] = useState(true);
    const [processingProgress, setProcessingProgress] = useState(0);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Mock AI processing function
    const processImagesWithAI = useCallback(async (files: File[]): Promise<AIImage[]> => {
        setIsProcessing(true);
        setProcessingProgress(0);
        
        const processedImages: AIImage[] = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setProcessingProgress(((i + 1) / files.length) * 100);
            
            // Simulate AI processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const reader = new FileReader();
            const imageData = await new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
            
            // Mock AI analysis results
            const aiImage: AIImage = {
                id: `ai-img-${Date.now()}-${i}`,
                src: imageData,
                name: file.name,
                uploadDate: new Date(),
                aiCategories: ['Family', 'Outdoor', 'Vacation'][Math.floor(Math.random() * 3)] ? ['Family'] : ['Outdoor'],
                aiTags: ['beach', 'sunset', 'family', 'vacation', 'summer'].slice(0, Math.floor(Math.random() * 3) + 2),
                location: ['Beach Resort', 'Mountain View', 'City Park'][Math.floor(Math.random() * 3)],
                people: ['John', 'Sarah', 'Emma'].slice(0, Math.floor(Math.random() * 3) + 1),
                event: 'Summer Vacation 2023',
                confidence: 0.85 + Math.random() * 0.15,
                metadata: {
                    width: 1920,
                    height: 1080,
                    size: file.size,
                    format: file.type
                }
            };
            
            processedImages.push(aiImage);
        }
        
        setIsProcessing(false);
        setProcessingProgress(0);
        return processedImages;
    }, []);

    // Generate AI events from images
    const generateAIEvents = useCallback((images: AIImage[]): AIEvent[] => {
        const eventMap = new Map<string, AIImage[]>();
        
        images.forEach(image => {
            const eventName = image.event || 'Uncategorized';
            if (!eventMap.has(eventName)) {
                eventMap.set(eventName, []);
            }
            eventMap.get(eventName)!.push(image);
        });
        
        return Array.from(eventMap.entries()).map(([eventName, eventImages]) => ({
            id: `event-${eventName.toLowerCase().replace(/\s+/g, '-')}`,
            name: eventName,
            images: eventImages,
            date: new Date(Math.min(...eventImages.map(img => img.uploadDate.getTime()))),
            location: eventImages[0]?.location,
            confidence: eventImages.reduce((sum, img) => sum + img.confidence, 0) / eventImages.length,
            aiGenerated: true
        }));
    }, []);

    // Generate AI collages
    const generateAICollages = useCallback((images: AIImage[]): AICollage[] => {
        const layouts: AICollage['layout'][] = ['grid', 'mosaic', 'story', 'timeline'];
        const themes = ['Family Moments', 'Adventure Time', 'Peaceful Scenes', 'Celebration'];
        
        return themes.map((theme, index) => ({
            id: `collage-${index}`,
            name: theme,
            images: images.slice(index * 3, (index + 1) * 3),
            layout: layouts[index % layouts.length],
            theme,
            aiGenerated: true,
            confidence: 0.8 + Math.random() * 0.2
        }));
    }, []);

    // Handle file upload
    const handleFileUpload = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            toast.error('Please select valid image files');
            return;
        }
        
        try {
            toast.info(`Processing ${imageFiles.length} images with AI...`);
            const processedImages = await processImagesWithAI(imageFiles);
            
            setUploadedImages(prev => [...prev, ...processedImages]);
            
            // Generate AI events and collages
            const allImages = [...uploadedImages, ...processedImages];
            const events = generateAIEvents(allImages);
            const collages = generateAICollages(allImages);
            
            setAiEvents(events);
            setAiCollages(collages);
            
            // Record user action for AI learning
            const action: UserAction = {
                type: 'select',
                timestamp: new Date(),
                data: { imageCount: imageFiles.length, categories: processedImages.map(img => img.aiCategories).flat() }
            };
            setUserActions(prev => [...prev, action]);
            
            toast.success(`Successfully processed ${imageFiles.length} images!`);
            setShowUploadZone(false);
            
        } catch (error) {
            console.error('Error processing images:', error);
            toast.error('Failed to process images');
        }
    }, [uploadedImages, processImagesWithAI, generateAIEvents, generateAICollages]);

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files);
        }
    }, [handleFileUpload]);

    // Handle image selection
    const handleImageSelect = useCallback((imageId: string) => {
        setSelectedImages(prev => {
            const newSelection = prev.includes(imageId) 
                ? prev.filter(id => id !== imageId)
                : [...prev, imageId];
            
            // Record user action
            const action: UserAction = {
                type: 'select',
                timestamp: new Date(),
                data: { imageId, selected: !prev.includes(imageId) }
            };
            setUserActions(prevActions => [...prevActions, action]);
            
            return newSelection;
        });
    }, []);

    // Handle image editing
    const handleImageEdit = useCallback((image: AIImage, editType: string) => {
        setCurrentEditImage(image);
        setShowEditPanel(true);
        
        // Record user action
        const action: UserAction = {
            type: 'edit',
            timestamp: new Date(),
            data: { imageId: image.id, editType }
        };
        setUserActions(prev => [...prev, action]);
    }, []);

    // AI learning effect
    useEffect(() => {
        if (aiLearningActive && userActions.length > 0) {
            // Simulate AI learning from user actions
            const recentActions = userActions.slice(-5);
            console.log('AI Learning from recent actions:', recentActions);
        }
    }, [userActions, aiLearningActive]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-8 h-8 text-blue-600" />
                                <h1 className="text-2xl font-bold text-gray-900">AI Photo Workflow</h1>
                            </div>
                            {aiLearningActive && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                                    <Lightbulb className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-blue-700">Learning from your actions</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload More
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Categories */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Uploads</h2>
                            
                            {/* View Mode Toggle */}
                            <div className="mb-6">
                                <div className="flex flex-col gap-2">
                                    {[
                                        { key: 'events', label: 'Events', icon: Calendar },
                                        { key: 'dates', label: 'Dates', icon: Calendar },
                                        { key: 'people', label: 'People', icon: Users },
                                        { key: 'locations', label: 'Locations', icon: MapPin }
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setViewMode(key as any)}
                                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                                                viewMode === key 
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Events List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                    {viewMode === 'events' ? 'Events' : 
                                     viewMode === 'dates' ? 'Dates' : 
                                     viewMode === 'people' ? 'People' : 'Locations'}
                                </h3>
                                
                                {aiEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                            selectedEvent === event.id 
                                                ? 'border-blue-500 bg-blue-50' 
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            {event.images[0] && (
                                                <img
                                                    src={event.images[0].src}
                                                    alt={event.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                                                {event.aiGenerated && (
                                                    <Sparkles className="w-3 h-3 text-blue-500" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {event.images.length} images • {Math.round(event.confidence * 100)}% confidence
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {/* Upload Zone */}
                        {showUploadZone && uploadedImages.length === 0 && (
                            <div
                                ref={dropZoneRef}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            Upload Your Photos
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Drag and drop your images here, or click to browse
                                        </p>
                                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                <span>AI Auto-categorization</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Layout className="w-4 h-4" />
                                                <span>Smart Layouts</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-4 h-4" />
                                                <span>Instant Processing</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Processing Progress */}
                        {isProcessing && (
                            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        AI Processing Your Images...
                                    </h3>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${processingProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Analyzing images, detecting faces, categorizing events... {Math.round(processingProgress)}%
                                </p>
                            </div>
                        )}

                        {/* Image Grid */}
                        {uploadedImages.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {selectedEvent 
                                            ? aiEvents.find(e => e.id === selectedEvent)?.name 
                                            : 'All Images'
                                        }
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">
                                            {selectedImages.length} selected
                                        </span>
                                        {selectedImages.length > 0 && (
                                            <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                                <Layout className="w-4 h-4" />
                                                Create Collage
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {(selectedEvent 
                                        ? aiEvents.find(e => e.id === selectedEvent)?.images || []
                                        : uploadedImages
                                    ).map((image) => (
                                        <div
                                            key={image.id}
                                            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                                selectedImages.includes(image.id)
                                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                                    : 'border-transparent hover:border-gray-300'
                                            }`}
                                            onClick={() => handleImageSelect(image.id)}
                                        >
                                            <div className="aspect-square bg-gray-100">
                                                <img
                                                    src={image.src}
                                                    alt={image.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            {/* Selection Overlay */}
                                            {selectedImages.includes(image.id) && (
                                                <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Edit Controls */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageEdit(image, 'crop');
                                                        }}
                                                        className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                                                        title="Crop"
                                                    >
                                                        <Crop className="w-3 h-3 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageEdit(image, 'rotate');
                                                        }}
                                                        className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                                                        title="Rotate"
                                                    >
                                                        <RotateCcw className="w-3 h-3 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageEdit(image, 'filters');
                                                        }}
                                                        className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                                                        title="Adjust Filters"
                                                    >
                                                        <Sliders className="w-3 h-3 text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* AI Tags */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {image.aiTags.slice(0, 2).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-1.5 py-0.5 bg-white/20 text-white text-xs rounded backdrop-blur-sm"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {image.aiTags.length > 2 && (
                                                        <span className="px-1.5 py-0.5 bg-white/20 text-white text-xs rounded backdrop-blur-sm">
                                                            +{image.aiTags.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Learning Indicator */}
                        {userActions.length > 0 && (
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <Lightbulb className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-900">
                                            Your actions improve future suggestions
                                        </h3>
                                        <p className="text-xs text-blue-700 mt-1">
                                            AI has learned from {userActions.length} of your actions to provide better categorization and layouts
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Panel */}
            <AnimatePresence>
                {showEditPanel && currentEditImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Image</h3>
                                <button
                                    onClick={() => setShowEditPanel(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={currentEditImage.src}
                                                alt={currentEditImage.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <Crop className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm">Crop</span>
                                                </button>
                                                <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <RotateCcw className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm">Rotate</span>
                                                </button>
                                                <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <Sliders className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm">Filters</span>
                                                </button>
                                                <button className="flex items-center gap-2 p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="text-sm">Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">AI Analysis</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Confidence:</span>
                                                    <span className="font-medium">{Math.round(currentEditImage.confidence * 100)}%</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Event:</span>
                                                    <span className="font-medium">{currentEditImage.event}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Location:</span>
                                                    <span className="font-medium">{currentEditImage.location}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <h5 className="text-sm font-medium text-gray-900 mb-2">AI Tags</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {currentEditImage.aiTags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <h5 className="text-sm font-medium text-gray-900 mb-2">People Detected</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {currentEditImage.people?.map((person) => (
                                                        <span
                                                            key={person}
                                                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                                        >
                                                            {person}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                multiple
                onChange={(e) => {
                    if (e.target.files) {
                        handleFileUpload(e.target.files);
                    }
                }}
                className="hidden"
            />
        </div>
    );
};

export default AIWorkflowPage;
