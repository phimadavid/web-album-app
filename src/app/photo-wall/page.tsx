"use client";

import { useState, useEffect } from 'react';
import ImageAlbum from "./../../../public/images/image-album.jpg"
import Image from 'next/image';

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

const PhotoWallPage = () => {
    // Sample data
    const categories: PhotoCategory[] = [
        { id: 1, name: "Nature", count: 243, image: "/api/placeholder/400/300" },
        { id: 2, name: "Portrait", count: 157, image: "/api/placeholder/400/300" },
        { id: 3, name: "Architecture", count: 112, image: "/api/placeholder/400/300" },
        { id: 4, name: "Travel", count: 198, image: "/api/placeholder/400/300" },
    ];

    const testimonials: Testimonial[] = [
        {
            id: 1,
            name: "Sarah Johnson",
            role: "Photographer",
            comment: "MemoryAI has completely transformed how I organize my photo collections. The AI tagging is impressively accurate!",
            avatar: "/api/placeholder/64/64"
        },
        {
            id: 2,
            name: "Michael Chen",
            role: "Designer",
            comment: "The automatic collages save me hours of work. This tool has become essential for my design process.",
            avatar: "/api/placeholder/64/64"
        },
        {
            id: 3,
            name: "Emma Rodriguez",
            role: "Blogger",
            comment: "I manage thousands of photos for my travel blog, and this platform makes it effortless to find exactly what I need.",
            avatar: "/api/placeholder/64/64"
        }
    ];

    // Animation states
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <>
            <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
                {/* Hero Section */}
                <section className="relative">
                    {/* Background with overlay */}
                    <div className="absolute inset-0 bg-black/60 z-10"></div>
                    <div className="relative h-screen max-h-[800px] w-full overflow-hidden">
                        <Image
                            src={ImageAlbum}
                            alt="Beautiful gallery of photos"
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>

                    {/* Hero Content */}
                    <div className={`absolute inset-0 z-20 flex items-center justify-center text-center px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="max-w-4xl">
                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                                Your Memories, <span className="text-blue-400">Intelligently</span> Arranged
                            </h1>
                            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                                Create stunning photo walls and organize your entire collection with the power of AI
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300 shadow-lg hover:shadow-xl">
                                    Get Started — It's Free
                                </button>
                                <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg font-medium transition-colors duration-300">
                                    Watch Demo
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powered by AI</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Our intelligent platform helps you organize, enhance, and showcase your photos
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Tagging</h3>
                                    <p className="text-gray-600">
                                        Our AI automatically tags your photos with relevant keywords, making organization effortless.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto Enhance</h3>
                                    <p className="text-gray-600">
                                        One-click enhancement improves lighting, color balance, and sharpness of your photos automatically.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Layouts</h3>
                                    <p className="text-gray-600">
                                        Generate beautiful layouts for your photo walls based on image content and composition.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-16 px-4 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Explore Categories</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Discover collections organized by our intelligent categorization system
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {categories.map(category => (
                                <div key={category.id} className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="aspect-w-4 aspect-h-3 w-full">
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4">
                                        <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                                        <p className="text-gray-300">{category.count} photos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Create your photo wall in just three simple steps
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            {/* Step 1 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">1</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Your Photos</h3>
                                <p className="text-gray-600">
                                    Upload your photos from your device, Google Photos, Dropbox, or social media.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">2</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Let AI Work Its Magic</h3>
                                <p className="text-gray-600">
                                    Our AI analyzes, enhances, and organizes your photos automatically.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-blue-600">3</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Create & Share</h3>
                                <p className="text-gray-600">
                                    Choose from beautiful layouts and share your photo wall with friends and family.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Join thousands of happy users who love our platform
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
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 bg-blue-500 text-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Photo Collection?</h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of users who are creating beautiful photo walls with our AI-powered platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors duration-300 shadow-lg hover:shadow-xl">
                                Get Started for Free
                            </button>
                            <button className="px-8 py-4 bg-transparent hover:bg-white/10 border border-white rounded-lg font-medium transition-colors duration-300">
                                View Pricing
                            </button>
                        </div>
                        <p className="mt-6 text-blue-200 text-sm">No credit card required. Start with our free plan today.</p>
                    </div>
                </section>
            </main>
        </>
    );
};

export default PhotoWallPage;