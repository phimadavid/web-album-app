"use client";

import { useState, useEffect } from 'react';
import ImageAlbum from "./../../../public/images/image-album.jpg"
import Image from 'next/image';
import { generateTemplateImage } from '@/lib/services/hf.generate.template';
import RegisterPage from '@/app/register/register-component';

// Types
type PhotoCategory = {
    id: number;
    name: string;
    count: number;
    image: string;
};

type Testimonial = {
    id: number;
    name: string;
    role: string;
    comment: string;
    avatar: string;
};

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
    isLoading: boolean;
};

const PhotoWallPage = () => {
    // Sample data
    const categories: PhotoCategory[] = [
        { id: 1, name: "Nature", count: 243, image: "/api/placeholder/400/300" },
        { id: 2, name: "Portrait", count: 157, image: "/api/placeholder/400/300" },
        { id: 3, name: "Architecture", count: 112, image: "/api/placeholder/400/300" },
        { id: 4, name: "Travel", count: 198, image: "/api/placeholder/400/300" },
        { id: 5, name: "Abstract", count: 89, image: "/api/placeholder/400/300" },
        { id: 6, name: "Vintage", count: 134, image: "/api/placeholder/400/300" },
    ];

    const testimonials: Testimonial[] = [
        {
            id: 1,
            name: "Sarah Johnson",
            role: "Interior Designer",
            comment: "The AI-generated photo walls are incredible! I can create custom designs for my clients in minutes.",
            avatar: "/api/placeholder/64/64"
        },
        {
            id: 2,
            name: "Michael Chen",
            role: "Photographer",
            comment: "The quality of prints on different materials is outstanding. My clients love the aluminum prints!",
            avatar: "/api/placeholder/64/64"
        },
        {
            id: 3,
            name: "Emma Rodriguez",
            role: "Art Collector",
            comment: "From prompt to wall art in just a few clicks. The canvas prints look museum-quality.",
            avatar: "/api/placeholder/64/64"
        }
    ];

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

    // State management
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('modern');
    const [selectedProduct, setSelectedProduct] = useState<string>('canvas');
    const [selectedSize, setSelectedSize] = useState<string>('medium');
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Add demo images for testing
    const addDemoImages = async () => {
        setIsGenerating(true);

        try {
            const demoPrompts = [
                'A serene mountain landscape with sunset colors, modern style, high quality, photo realistic, suitable for wall image',
                'Abstract geometric patterns in vibrant colors, colorful style, high quality, photo realistic, suitable for wall image'
            ];

            const demoImages: GeneratedImage[] = [];

            for (let i = 0; i < demoPrompts.length; i++) {
                const prompt = demoPrompts[i];
                const basePrompt = i === 0 ? 'A serene mountain landscape with sunset colors' : 'Abstract geometric patterns in vibrant colors';

                try {
                    console.log(`Generating demo image ${i + 1}:`, prompt);
                    const response = await generateTemplateImage(prompt);

                    if (response && response.length > 0) {
                        demoImages.push({
                            id: `demo_${Date.now()}_${i}`,
                            url: response[0], // Use first generated image
                            prompt: basePrompt,
                            isLoading: false
                        });
                    }
                } catch (error) {
                    console.error(`Error generating demo image ${i + 1}:`, error);
                    // Continue with next image if one fails
                }
            }

            if (demoImages.length > 0) {
                setGeneratedImages(prev => [...demoImages, ...prev]);
            } else {
                // Fallback to original demo images if generation fails
                const fallbackImages: GeneratedImage[] = [
                    {
                        id: 'demo_1',
                        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1024&fit=crop',
                        prompt: 'A serene mountain landscape with sunset colors',
                        isLoading: false
                    },
                    {
                        id: 'demo_2',
                        url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1024&h=1024&fit=crop',
                        prompt: 'Abstract geometric patterns in vibrant colors',
                        isLoading: false
                    }
                ];
                setGeneratedImages(fallbackImages);
            }
        } catch (error) {
            console.error('Error in addDemoImages:', error);
            // Show fallback images on error
            const fallbackImages: GeneratedImage[] = [
                {
                    id: 'demo_1',
                    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1024&fit=crop',
                    prompt: 'A serene mountain landscape with sunset colors',
                    isLoading: false
                },
                {
                    id: 'demo_2',
                    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1024&h=1024&fit=crop',
                    prompt: 'Abstract geometric patterns in vibrant colors',
                    isLoading: false
                }
            ];
            setGeneratedImages(fallbackImages);
        } finally {
            setIsGenerating(false);
        }
    };

    const styles = [
        { id: 'modern', name: 'Modern', description: 'Clean, contemporary aesthetic' },
        { id: 'vintage', name: 'Vintage', description: 'Classic, timeless feel' },
        { id: 'abstract', name: 'Abstract', description: 'Artistic, creative expression' },
        { id: 'nature', name: 'Nature', description: 'Organic, natural elements' },
        { id: 'minimalist', name: 'Minimalist', description: 'Simple, elegant design' },
        { id: 'colorful', name: 'Colorful', description: 'Vibrant, bold colors' }
    ];

    // Animation states
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Generate AI images
    const handleGenerateImages = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);

        try {
            // Create the custom prompt word by combining prompt and selected style
            const customPromptWord = `${prompt}, ${selectedStyle} style, high quality, photo realistic, suitable for wall image`;

            // Use the generateTemplateImage function
            const response = await generateTemplateImage(customPromptWord);

            console.log('Generated images response:', response); // Debug log

            if (response && response.length > 0) {
                const newImages: GeneratedImage[] = response.map((imageUrl: string, index: number) => {
                    return {
                        id: `gen_${Date.now()}_${index}`,
                        url: imageUrl, // Base64 image URL from generateTemplateImage
                        prompt: prompt,
                        isLoading: false
                    };
                });

                console.log('Final processed images:', newImages); // Debug log

                setGeneratedImages(prev => [...newImages, ...prev]);
            } else {
                console.error('No images generated');
                alert('No images were generated. Please try again with a different prompt.');
            }
        } catch (error) {
            console.error('Error generating images:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred while generating images'}`);
        } finally {
            setIsGenerating(false);
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
        <>
            <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
                {/* Hero Section */}
                <section className="relative">
                    <div className="absolute inset-0 bg-black/60 z-10"></div>
                    <div className="relative h-screen max-h-[800px] w-full overflow-hidden">
                        <Image
                            src={ImageAlbum}
                            alt="AI-generated photo wall gallery"
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>

                    <div className={`absolute inset-0 z-20 flex items-center justify-center text-center px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="max-w-4xl">
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                                Create <span className="text-blue-400">AI-Generated</span> Photo Walls
                            </h1>
                            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                                Transform your ideas into stunning wall art with artificial intelligence. Generate unique images and print them on premium materials.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        document.getElementById('ai-generator')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300 shadow-lg hover:shadow-xl"
                                >
                                    Generate Your Wall Art
                                </button>
                                <button
                                    onClick={() => setShowPricing(true)}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg font-medium transition-colors duration-300"
                                >
                                    View Pricing
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Generator Section */}
                <section id="ai-generator" className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">AI-Powered Art Generation</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Describe your vision and let our AI create unique artwork for your space
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Generator Controls */}
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold mb-4">Create Your Design</h3>

                                {/* Prompt Input */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Describe your vision
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g., A serene mountain landscape with sunset colors, peaceful and calming atmosphere..."
                                        className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Style Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Choose Style
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {styles.map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => setSelectedStyle(style.id)}
                                                className={`p-3 rounded-lg border text-left transition-all ${selectedStyle === style.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="font-medium">{style.name}</div>
                                                <div className="text-xs text-gray-500">{style.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerateImages}
                                    disabled={!prompt.trim() || isGenerating}
                                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-300 mb-3"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Generating...
                                        </div>
                                    ) : (
                                        'Generate AI Image Wall'
                                    )}
                                </button>

                                {/* Demo Button for Testing */}
                                <button
                                    onClick={addDemoImages}
                                    disabled={isGenerating}
                                    className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-300 text-sm"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Generating Demo...
                                        </div>
                                    ) : (
                                        '🎨 Generate Demo AI Image Walls'
                                    )}
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Click above to generate demo AI images using the template generator
                                </p>
                            </div>

                            {/* Product & Size Selection */}
                            <div className="bg-gray-50 rounded-2xl p-6">
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
                    </div>
                </section>

                {/* Generated Images Gallery */}
                {generatedImages.length > 0 && (
                    <section className="py-16 px-4 bg-gray-50">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Your Generated Image Wall</h2>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                    See how your artwork looks on different materials
                                </p>
                            </div>

                            <div className="space-y-12">
                                {generatedImages.map((image) => (
                                    <div key={image.id} className="bg-white rounded-2xl p-6 shadow-lg">
                                        <div className="mb-6">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">"{image.prompt}"</h3>
                                            <p className="text-gray-600">
                                                Choose your preferred material and see the 3D preview |
                                                <span className="font-medium text-blue-600 ml-1">
                                                    {styles.find(s => s.id === selectedStyle)?.name} Style
                                                </span>
                                                {' • '}
                                                <span className="font-medium text-green-600">
                                                    {productOptions.find(p => p.id === selectedProduct)?.name} - {sizeOptions.find(s => s.id === selectedSize)?.name}
                                                </span>
                                            </p>
                                        </div>

                                        {/* 3D Material Previews */}
                                        <div className="grid md:grid-cols-3 gap-8">
                                            {/* Canvas Print */}
                                            <div className="text-center">
                                                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center gap-2">
                                                    🎨 Canvas Print
                                                </h4>
                                                <div className="relative perspective-1000">
                                                    <div className="canvas-mockup transform-gpu transition-transform duration-500 hover:rotate-y-12">
                                                        <div className="canvas-frame relative">
                                                            <img
                                                                src={image.url}
                                                                alt={`Canvas: ${image.prompt}`}
                                                                className="w-full h-full object-cover rounded-sm"
                                                            />
                                                            {/* Canvas texture overlay */}
                                                            <div className="absolute inset-0 bg-canvas-texture opacity-20 rounded-sm"></div>
                                                            {/* Canvas wrap edges */}
                                                            <div className="canvas-edge-right absolute top-0 right-0 w-2 h-full bg-gradient-to-r from-transparent to-black opacity-30"></div>
                                                            <div className="canvas-edge-bottom absolute bottom-0 left-0 w-full h-2 bg-gradient-to-b from-transparent to-black opacity-30"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-sm text-gray-600">Premium cotton canvas with gallery wrap</p>
                                                <p className="text-lg font-semibold text-blue-600 mt-2">from $49.99</p>
                                                <button onClick={() => setShowRegisterModal(true)} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300 shadow-md hover:shadow-lg">
                                                    Customize & Order Canvas Print
                                                </button>
                                            </div>

                                            {/* Glass Print */}
                                            <div className="text-center">
                                                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center gap-2">
                                                    🔍 Glass Print
                                                </h4>
                                                <div className="relative perspective-1000">
                                                    <div className="glass-mockup transform-gpu transition-transform duration-500 hover:rotate-y-12">
                                                        <div className="glass-frame relative">
                                                            <img
                                                                src={image.url}
                                                                alt={`Glass: ${image.prompt}`}
                                                                className="w-full h-full object-cover rounded-sm"
                                                            />
                                                            {/* Glass reflection overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-30 rounded-sm"></div>
                                                            <div className="absolute inset-0 bg-gradient-to-tl from-blue-200 via-transparent to-transparent opacity-20 rounded-sm"></div>
                                                            {/* Glass edge */}
                                                            <div className="glass-edge absolute inset-0 border-2 border-gray-300 rounded-sm shadow-inner"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-sm text-gray-600">Modern acrylic glass for vibrant colors</p>
                                                <p className="text-lg font-semibold text-blue-600 mt-2">from $79.99</p>
                                                <button
                                                    onClick={() => setShowRegisterModal(true)}
                                                    className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-300 shadow-md hover:shadow-lg"
                                                >
                                                    Customize & Order Glass Print
                                                </button>
                                            </div>

                                            {/* Aluminum Print */}
                                            <div className="text-center">
                                                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center gap-2">
                                                    ✨ Aluminum Print
                                                </h4>
                                                <div className="relative perspective-1000">
                                                    <div className="aluminum-mockup transform-gpu transition-transform duration-500 hover:rotate-y-12">
                                                        <div className="aluminum-frame relative">
                                                            <img
                                                                src={image.url}
                                                                alt={`Aluminum: ${image.prompt}`}
                                                                className="w-full h-full object-cover rounded-sm"
                                                            />
                                                            {/* Aluminum metallic overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-transparent to-gray-400 opacity-40 rounded-sm"></div>
                                                            <div className="absolute inset-0 bg-brushed-metal opacity-30 rounded-sm"></div>
                                                            {/* Aluminum edge */}
                                                            <div className="aluminum-edge absolute inset-0 border border-gray-400 rounded-sm shadow-lg"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-sm text-gray-600">Sleek metal finish for contemporary look</p>
                                                <p className="text-lg font-semibold text-blue-600 mt-2">from $89.99</p>
                                                <button onClick={() => setShowRegisterModal(true)} className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-300 shadow-md hover:shadow-lg">
                                                    Customize & Order Aluminum Print
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section >
                )}

                {/* Features Section */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose AI Photo Walls?</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Revolutionary technology meets premium quality printing
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-gray-50 rounded-xl p-6 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Generation</h3>
                                <p className="text-gray-600">
                                    Create unique artwork in seconds using advanced AI technology. No design skills required.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-gray-50 rounded-xl p-6 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Materials</h3>
                                <p className="text-gray-600">
                                    Choose from canvas, glass, or aluminum prints. All materials are museum-quality and built to last.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-gray-50 rounded-xl p-6 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom Sizes</h3>
                                <p className="text-gray-600">
                                    From small accent pieces to large statement walls. Find the perfect size for your space.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-20 px-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                From idea to wall art in just four simple steps
                            </p>
                        </div>

                        <div className="grid md:grid-cols-4 gap-8">
                            {/* Step 1 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">1</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Describe Your Vision</h3>
                                <p className="text-gray-600">
                                    Tell our AI what you want to see. Be as detailed or simple as you like.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">2</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Generates Art</h3>
                                <p className="text-gray-600">
                                    Our advanced AI creates unique artwork based on your description.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">3</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Choose Material & Size</h3>
                                <p className="text-gray-600">
                                    Select from canvas, glass, or aluminum in various sizes.
                                </p>
                            </div>

                            {/* Step 4 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">4</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Receive Your Art</h3>
                                <p className="text-gray-600">
                                    Your custom artwork is printed and shipped directly to your door.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Join thousands of satisfied customers who have transformed their spaces
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {testimonials.map(testimonial => (
                                <div key={testimonial.id} className="bg-white rounded-xl shadow-md p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                                            <Image
                                                src={testimonial.avatar}
                                                alt={testimonial.name}
                                                width={48}
                                                height={48}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                                            <p className="text-sm text-gray-500">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 italic">"{testimonial.comment}"</p>
                                    <div className="flex mt-4 text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 bg-blue-600 text-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Create Your AI Art?</h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of customers who have transformed their spaces with AI-generated artwork.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => {
                                    document.getElementById('ai-generator')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors duration-300 shadow-lg hover:shadow-xl"
                            >
                                Start Creating Now
                            </button>
                            <button
                                onClick={() => setShowPricing(true)}
                                className="px-8 py-4 bg-transparent hover:bg-white/10 border border-white rounded-lg font-medium transition-colors duration-300"
                            >
                                View Pricing
                            </button>
                        </div>
                        <p className="mt-6 text-blue-200 text-sm">Free to generate • Premium materials • Fast worldwide shipping</p>
                    </div>
                </section>
            </main >

            {/* Pricing Modal */}
            {
                showPricing && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">Pricing</h3>
                                    <button
                                        onClick={() => setShowPricing(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Material & Size Pricing</h4>
                                        <p className="text-gray-600">All prints include professional processing and quality guarantee</p>
                                    </div>

                                    <div className="grid gap-4">
                                        {productOptions.map((product) => (
                                            <div key={product.id} className="border rounded-lg p-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-2xl">{product.icon}</span>
                                                    <div>
                                                        <h5 className="font-semibold text-gray-900">{product.name}</h5>
                                                        <p className="text-sm text-gray-600">{product.description}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {sizeOptions.map((size) => (
                                                        <div key={size.id} className="flex justify-between py-1">
                                                            <span>{size.name} ({size.dimensions})</span>
                                                            <span className="font-medium">${(product.basePrice * size.multiplier).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <h5 className="font-semibold text-blue-900 mb-2">What's Included:</h5>
                                        <ul className="text-sm text-blue-800 space-y-1">
                                            <li>✓ High-resolution AI-generated artwork</li>
                                            <li>✓ Professional printing on premium materials</li>
                                            <li>✓ Ready-to-hang mounting hardware</li>
                                            <li>✓ Satisfaction guarantee</li>
                                            <li>✓ Free worldwide shipping on orders over $75</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Registration Modal */}
            {
                showRegisterModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold text-gray-900">Register to Order Glass Print</h3>
                                    <button
                                        onClick={() => setShowRegisterModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <RegisterPage />
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default PhotoWallPage;
