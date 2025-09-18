"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const AIWorkflowDemo: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const demoSteps = [
        {
            title: "Upload Photos",
            description: "Drag and drop your images or click to browse. Our AI instantly begins analyzing each photo.",
            image: "/images/demo-upload.png",
            features: ["Batch upload support", "Real-time processing", "Format detection"]
        },
        {
            title: "AI Auto-Categorization",
            description: "Advanced AI automatically categorizes your photos by events, dates, people, and locations.",
            image: "/images/demo-categorization.png",
            features: ["Event detection", "Face recognition", "Location tagging", "Smart grouping"]
        },
        {
            title: "Smart Image Selection",
            description: "AI suggests the best photos for your album based on quality, composition, and relevance.",
            image: "/images/demo-selection.png",
            features: ["Quality analysis", "Duplicate detection", "Best shot selection", "Composition scoring"]
        },
        {
            title: "Dynamic Collage Generation",
            description: "Create beautiful layouts automatically with AI-powered design suggestions.",
            image: "/images/demo-collage.png",
            features: ["Multiple layout options", "Smart positioning", "Color harmony", "Balance optimization"]
        },
        {
            title: "Continuous Learning",
            description: "The AI learns from your preferences to provide better suggestions over time.",
            image: "/images/demo-learning.png",
            features: ["User preference tracking", "Improved suggestions", "Personalized layouts", "Smart recommendations"]
        }
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        setCurrentStep(current => (current + 1) % demoSteps.length);
                        return 0;
                    }
                    return prev + 2;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, demoSteps.length]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentStep(0);
        setProgress(0);
    };

    const handleStepClick = (stepIndex: number) => {
        setCurrentStep(stepIndex);
        setProgress(0);
        setIsPlaying(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">AI Photo Workflow Demo</h1>
                        </div>
                        <Link
                            href="/ai-workflow"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try It Now
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Experience AI-Powered Photo Organization
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Watch how our advanced AI transforms your photo collection into beautifully organized albums 
                        with automatic categorization, smart selection, and dynamic layout generation.
                    </p>
                </div>

                {/* Demo Controls */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <button
                        onClick={handlePlayPause}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        {isPlaying ? 'Pause Demo' : 'Play Demo'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Reset
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                            style={{ width: `${(currentStep * 100 + progress) / demoSteps.length}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step Navigation */}
                <div className="flex justify-center mb-12">
                    <div className="flex gap-2 p-2 bg-white rounded-lg shadow-sm">
                        {demoSteps.map((step, index) => (
                            <button
                                key={index}
                                onClick={() => handleStepClick(index)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentStep === index
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                Step {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Demo Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Demo Visualization */}
                    <div className="order-2 lg:order-1">
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-6 flex items-center justify-center">
                                {/* Placeholder for demo visualization */}
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        {demoSteps[currentStep].title}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Interactive demo visualization
                                    </p>
                                </div>
                            </div>
                            
                            {/* Progress indicator for current step */}
                            <div className="w-full bg-gray-200 rounded-full h-1">
                                <div 
                                    className="bg-blue-600 h-1 rounded-full transition-all duration-100"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Step Information */}
                    <div className="order-1 lg:order-2">
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {currentStep + 1}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {demoSteps[currentStep].title}
                                </h3>
                            </div>
                            <p className="text-lg text-gray-600 mb-6">
                                {demoSteps[currentStep].description}
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-gray-900">Key Features:</h4>
                            {demoSteps[currentStep].features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span className="text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <div className="mt-8">
                            <Link
                                href="/ai-workflow"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Experience This Step
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="mt-20">
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Choose AI-Powered Workflow?
                        </h3>
                        <p className="text-lg text-gray-600">
                            Transform your photo management experience with intelligent automation
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Save Time",
                                description: "Reduce manual sorting time by 90% with intelligent auto-categorization",
                                icon: "⚡"
                            },
                            {
                                title: "Better Organization",
                                description: "AI understands context and relationships between your photos",
                                icon: "🧠"
                            },
                            {
                                title: "Continuous Improvement",
                                description: "The system learns from your preferences to get better over time",
                                icon: "📈"
                            }
                        ].map((benefit, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm p-6 text-center">
                                <div className="text-4xl mb-4">{benefit.icon}</div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h4>
                                <p className="text-gray-600">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="mt-20 text-center">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
                        <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
                        <p className="text-xl mb-8 opacity-90">
                            Experience the future of photo album creation with AI-powered workflow
                        </p>
                        <Link
                            href="/ai-workflow"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
                        >
                            Start Creating Now
                            <ArrowRight className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIWorkflowDemo;
