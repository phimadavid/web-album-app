"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { generateTemplateImage } from '@/lib/services/hf.generate.template';
import axios from 'axios';
import { Palette, Sparkles, Save, History, Heart } from 'lucide-react';

type ProductOption = {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    icon: string;
    material: string;
};

type SizeOption = {
    id: string;
    name: string;
    dimensions: string;
    multiplier: number;
};

type GeneratedImage = {
    id: string;
    url: string;
    prompt: string;
    style: string;
    isLoading: boolean;
    isSaved?: boolean;
    createdAt: Date;
};

const AIArtGeneratorPage = () => {
    const { data: session } = useSession();
    
    // State management
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('modern');
    const [selectedProduct, setSelectedProduct] = useState<string>('canvas');
    const [selectedSize, setSelectedSize] = useState<string>('medium');
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showStyleSelector, setShowStyleSelector] = useState(false);
    const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);
    const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'saved'>('generate');
    const [isLoadingSavedImages, setIsLoadingSavedImages] = useState(false);

    // Load saved images when component mounts
    useEffect(() => {
        const loadSavedImages = async () => {
            if (!session?.user) return;

            setIsLoadingSavedImages(true);
            try {
                const response = await axios.get('/api/me/ai-art');
                if (response.data.success && response.data.data) {
                    const savedArtData = response.data.data.map((art: any) => ({
                        id: art.id,
                        url: art.imageUrl || art.s3Url,
                        prompt: art.prompt,
                        style: art.style,
                        isLoading: false,
                        isSaved: true,
                        createdAt: new Date(art.createdAt)
                    }));
                    setSavedImages(savedArtData);
                }
            } catch (error) {
                console.error('Error loading saved images:', error);
            } finally {
                setIsLoadingSavedImages(false);
            }
        };

        loadSavedImages();
    }, [session]);

    const productOptions: ProductOption[] = [
        {
            id: 'canvas',
            name: 'Canvas Print',
            description: 'Premium quality canvas with gallery wrap',
            basePrice: 49.99,
            icon: '🎨',
            material: 'Cotton Canvas'
        },
        {
            id: 'glass',
            name: 'Glass Print',
            description: 'Modern acrylic glass for vibrant colors',
            basePrice: 79.99,
            icon: '🔍',
            material: 'Acrylic Glass'
        },
        {
            id: 'aluminum',
            name: 'Aluminum Print',
            description: 'Sleek metal finish for contemporary look',
            basePrice: 89.99,
            icon: '✨',
            material: 'Brushed Aluminum'
        }
    ];

    const sizeOptions: SizeOption[] = [
        { id: 'small', name: 'Small', dimensions: '12" x 16"', multiplier: 1.0 },
        { id: 'medium', name: 'Medium', dimensions: '16" x 20"', multiplier: 1.4 },
        { id: 'large', name: 'Large', dimensions: '20" x 24"', multiplier: 1.8 },
        { id: 'xlarge', name: 'Extra Large', dimensions: '24" x 32"', multiplier: 2.2 },
        { id: 'xxlarge', name: 'Wall Size', dimensions: '32" x 40"', multiplier: 3.0 }
    ];

    const styles = [
        { id: 'modern', name: 'Modern', description: 'Clean, contemporary aesthetic' },
        { id: 'vintage', name: 'Vintage', description: 'Classic, timeless feel' },
        { id: 'abstract', name: 'Abstract', description: 'Artistic, creative expression' },
        { id: 'nature', name: 'Nature', description: 'Organic, natural elements' },
        { id: 'minimalist', name: 'Minimalist', description: 'Simple, elegant design' },
        { id: 'colorful', name: 'Colorful', description: 'Vibrant, bold colors' }
    ];

    // Function to detect if text contains non-English characters
    const containsNonEnglishChars = (text: string): boolean => {
        const nonEnglishRegex = /[^\x00-\x7F]/;
        return nonEnglishRegex.test(text);
    };

    // Function to translate text to English
    const translateToEnglish = async (text: string): Promise<string> => {
        if (!text.trim()) return '';

        try {
            const response = await axios.post('/api/translate', {
                text: text,
                targetLanguage: 'en'
            });

            if (response.data && response.data.translatedText) {
                return response.data.translatedText;
            }

            return text;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    };

    // Generate AI images
    const handleGenerateImages = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);

        try {
            let promptToUse = prompt.trim();

            // Check if the prompt contains non-English characters
            if (containsNonEnglishChars(promptToUse)) {
                const translated = await translateToEnglish(promptToUse);
                promptToUse = translated.trim() ? translated : promptToUse;
                console.log(`Translated prompt: "${prompt}" → "${promptToUse}"`);
            }

            // Create the custom prompt word by combining prompt and selected style
            const customPromptWord = `${promptToUse}, ${selectedStyle} style, high quality, photo realistic, suitable for wall image`;

            // Use the generateTemplateImage function
            const response = await generateTemplateImage(customPromptWord);

            if (response && response.length > 0) {
                const newImages: GeneratedImage[] = response.map((imageUrl: string, index: number) => {
                    return {
                        id: `gen_${Date.now()}_${index}`,
                        url: imageUrl,
                        prompt: prompt,
                        style: selectedStyle,
                        isLoading: false,
                        isSaved: false,
                        createdAt: new Date()
                    };
                });

                setGeneratedImages(prev => [...newImages, ...prev]);
                
                // Automatically switch to history tab to show the newly generated images
                setActiveTab('history');
            } else {
                alert('No images were generated. Please try again with a different prompt.');
            }
        } catch (error) {
            console.error('Error generating images:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred while generating images'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Save image to user's collection
    const saveImageToCollection = async (image: GeneratedImage) => {
        try {
            // Show loading state
            setGeneratedImages(prev => 
                prev.map(img => 
                    img.id === image.id ? { ...img, isLoading: true } : img
                )
            );

            // First, upload the base64 image to S3
            const uploadResponse = await axios.post('/api/me/ai-art/upload', {
                base64Image: image.url,
                prompt: image.prompt,
                style: image.style
            });

            if (!uploadResponse.data.success) {
                throw new Error(uploadResponse.data.error || 'Failed to upload image');
            }

            const { imageUrl, s3Key } = uploadResponse.data;

            // Then save the metadata with the S3 URL
            const saveResponse = await axios.post('/api/me/ai-art', {
                imageUrl: imageUrl,
                s3Key: s3Key,
                prompt: image.prompt,
                style: image.style
            });

            if (saveResponse.data.success) {
                // Update the image as saved with the new S3 URL
                const updatedImage = { ...image, url: imageUrl, isSaved: true, isLoading: false };
                
                setGeneratedImages(prev => 
                    prev.map(img => 
                        img.id === image.id ? updatedImage : img
                    )
                );
                
                // Add to saved images
                setSavedImages(prev => [...prev, updatedImage]);
                
                alert('Image saved to your collection!');
            } else {
                throw new Error(saveResponse.data.error || 'Failed to save image metadata');
            }
        } catch (error) {
            console.error('Error saving image:', error);
            
            // Reset loading state
            setGeneratedImages(prev => 
                prev.map(img => 
                    img.id === image.id ? { ...img, isLoading: false } : img
                )
            );
            
            const errorMessage = error instanceof Error ? error.message : 'Failed to save image. Please try again.';
            alert(`Error: ${errorMessage}`);
        }
    };

    // Add image to cart for ordering
    const addToCart = async (image: GeneratedImage) => {
        try {
            const product = productOptions.find(p => p.id === selectedProduct);
            const size = sizeOptions.find(s => s.id === selectedSize);

            if (!product || !size) {
                alert('Please select product and size options');
                return;
            }

            const response = await axios.post('/api/me/ai-art-cart', {
                imageUrl: image.url,
                prompt: image.prompt,
                style: image.style,
                productType: selectedProduct,
                size: selectedSize,
                dimensions: size.dimensions,
                price: calculatePrice(),
                quantity: 1
            });

            if (response.data.message) {
                alert('Item added to cart! You can proceed to checkout.');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add item to cart. Please try again.');
        }
    };

    // Calculate total price
    const calculatePrice = () => {
        const product = productOptions.find(p => p.id === selectedProduct);
        const size = sizeOptions.find(s => s.id === selectedSize);

        if (!product || !size) return 0;

        return (product.basePrice * size.multiplier).toFixed(2);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Palette className="h-8 w-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">AI Art Generator</h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Create stunning wall art with AI. Generate, save, and order professional prints.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('generate')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'generate'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Generate Art
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'history'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Recent ({generatedImages.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('saved')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'saved'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4" />
                                    Saved ({savedImages.length})
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Generate Tab */}
                {activeTab === 'generate' && (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Generator Controls */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Create Your Design</h3>

                                {/* Style Selection */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowStyleSelector(!showStyleSelector)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors shadow-sm"
                                    >
                                        <span className="text-sm font-medium text-gray-700">
                                            Style: {styles.find(s => s.id === selectedStyle)?.name}
                                        </span>
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Style selector dropdown */}
                                    {showStyleSelector && (
                                        <div className="absolute top-12 right-0 z-30 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-80">
                                            <div className="text-xs font-medium text-gray-700 mb-3 px-1">Choose Style:</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {styles.map((style) => (
                                                    <button
                                                        key={style.id}
                                                        onClick={() => {
                                                            setSelectedStyle(style.id);
                                                            setShowStyleSelector(false);
                                                        }}
                                                        className={`p-2 rounded-md transition-all hover:scale-105 relative ${
                                                            selectedStyle === style.id
                                                                ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                                                                : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {/* Style Preview */}
                                                        <div className="w-full h-16 rounded mb-1 relative overflow-hidden">
                                                            {style.id === 'modern' && (
                                                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                                                                    <div className="w-8 h-8 bg-gray-600 rounded-sm"></div>
                                                                </div>
                                                            )}
                                                            {style.id === 'vintage' && (
                                                                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                                                    <div className="w-8 h-8 bg-amber-600 rounded-full border-2 border-amber-800"></div>
                                                                </div>
                                                            )}
                                                            {style.id === 'abstract' && (
                                                                <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                                                                    <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                                                                    <div className="w-4 h-4 bg-pink-500 rounded-full -ml-2 mt-2"></div>
                                                                </div>
                                                            )}
                                                            {style.id === 'nature' && (
                                                                <div className="w-full h-full bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center">
                                                                    <div className="w-6 h-8 bg-green-600 rounded-full"></div>
                                                                    <div className="w-4 h-6 bg-green-700 rounded-full -ml-1"></div>
                                                                </div>
                                                            )}
                                                            {style.id === 'minimalist' && (
                                                                <div className="w-full h-full bg-white flex items-center justify-center border border-gray-200">
                                                                    <div className="w-6 h-1 bg-gray-800"></div>
                                                                </div>
                                                            )}
                                                            {style.id === 'colorful' && (
                                                                <div className="w-full h-full bg-gradient-to-br from-red-200 via-yellow-200 to-blue-200 flex items-center justify-center">
                                                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="text-left">
                                                            <div className="font-medium text-sm text-gray-900">{style.name}</div>
                                                            <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                                                        </div>

                                                        {selectedStyle === style.id && (
                                                            <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                                <span className="text-xs text-white">✓</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Prompt Input */}
                            <div className="mb-6">
                                <label className="block text-lg font-semibold text-gray-800 mb-3">
                                    ✨ Describe your vision for AI-generated art
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe your perfect wall art in detail... For example: 'A serene mountain landscape with sunset colors, peaceful and calming atmosphere, soft warm lighting, beautiful nature scenery perfect for a living room wall'"
                                        className="w-full h-40 px-6 py-4 text-lg border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-blue-50/30 placeholder-gray-500 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-300"
                                    />
                                    <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                                        {prompt.length} characters
                                    </div>
                                </div>
                                <p className="text-sm text-blue-600 mt-2 font-medium">
                                    💡 Tip: Be detailed and specific for the best AI results. Mention style, mood, colors, and setting.
                                </p>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateImages}
                                disabled={!prompt.trim() || isGenerating}
                                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-300"
                            >
                                {isGenerating ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </div>
                                ) : (
                                    'Generate AI Art'
                                )}
                            </button>
                        </div>

                        {/* Product & Size Selection */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="text-xl font-semibold mb-4">Product Options</h3>

                            {/* Material Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Print Material
                                </label>
                                <div className="space-y-2">
                                    {productOptions.map((product) => (
                                        <label key={product.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="product"
                                                value={product.id}
                                                checked={selectedProduct === product.id}
                                                onChange={(e) => setSelectedProduct(e.target.value)}
                                                className="mr-3"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{product.icon}</span>
                                                    <span className="font-medium">{product.name}</span>
                                                    <span className="text-sm text-gray-500">from ${product.basePrice}</span>
                                                </div>
                                                <div className="text-sm text-gray-600">{product.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Size Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Size
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {sizeOptions.map((size) => (
                                        <label key={size.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="size"
                                                    value={size.id}
                                                    checked={selectedSize === size.id}
                                                    onChange={(e) => setSelectedSize(e.target.value)}
                                                    className="mr-3"
                                                />
                                                <div>
                                                    <span className="font-medium">{size.name}</span>
                                                    <span className="text-sm text-gray-500 ml-2">{size.dimensions}</span>
                                                </div>
                                            </div>
                                            <span className="font-medium text-blue-600">${calculatePrice()}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Total Price */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total:</span>
                                    <span className="text-2xl font-bold text-blue-600">${calculatePrice()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-6">
                        {generatedImages.length === 0 ? (
                            <div className="text-center py-12">
                                <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No generated images yet</h3>
                                <p className="text-gray-500">Start generating AI art to see your history here.</p>
                            </div>
                        ) : (
                            generatedImages.map((image) => (
                                <div key={image.id} className="bg-white rounded-2xl p-6 shadow-sm">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="aspect-[4/3] rounded-xl overflow-hidden">
                                            <img
                                                src={image.url}
                                                alt={`Generated art: ${image.prompt}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 mb-2">"{image.prompt}"</h4>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                                        {styles.find(s => s.id === image.style)?.name} Style
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                                        {image.createdAt.toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveImageToCollection(image)}
                                                    disabled={image.isSaved || image.isLoading}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                                        image.isSaved
                                                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                            : image.isLoading
                                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    }`}
                                                >
                                                    {image.isLoading ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4" />
                                                            {image.isSaved ? 'Saved' : 'Save'}
                                                        </>
                                                    )}
                                                </button>
                                                <button 
                                                    onClick={() => addToCart(image)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    Order Print - ${calculatePrice()}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Saved Tab */}
                {activeTab === 'saved' && (
                    <div className="space-y-6">
                        {savedImages.length === 0 ? (
                            <div className="text-center py-12">
                                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved images yet</h3>
                                <p className="text-gray-500">Save your favorite generated art to see it here.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {savedImages.map((image) => (
                                    <div key={image.id} className="bg-white rounded-xl p-4 shadow-sm">
                                        <div className="aspect-square rounded-lg overflow-hidden mb-3">
                                            <img
                                                src={image.url}
                                                alt={`Saved art: ${image.prompt}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">"{image.prompt}"</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {styles.find(s => s.id === image.style)?.name}
                                            </span>
                                            <button 
                                                onClick={() => addToCart(image)}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
                                            >
                                                Order
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIArtGeneratorPage;
