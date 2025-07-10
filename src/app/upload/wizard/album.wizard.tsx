"use client"
import React, { useState } from 'react';
import FormatSelector from './components/format.selector';
import CoverSelector from './components/cover.selector';
import PaperSelector from './components/paper.selector';
import PhotoSizeSelector from './components/photo.size.selector';
import WebSizeSelector from './components/web.size.selector';
import { AlbumWizardData, AlbumWizardProps } from './types/album.wizard.types';

export const ALBUM_OPTIONS = {
    formats: [
        { id: "square", label: "Square", dimensions: ["20x20", "30x30"] },
        { id: "rectangular", label: "Rectangular", dimensions: ["20x30", "25x35"] },
        { id: "panoramic", label: "Panoramic", dimensions: ["20x40", "30x60"] },
    ],
    coverTypes: [
        { id: "hard", label: "Hard Cover" },
        { id: "soft", label: "Soft Cover" },
        { id: "spiral", label: "Spiral Bound" },
        { id: "premium", label: "Premium Cover" },
    ],
    paperQualities: [
        { id: "matte", label: "Matte Finish" },
        { id: "glossy", label: "Glossy Finish" },
        { id: "premium", label: "Premium Quality" },
    ],
};


const getStepTitle = (step: number): string => {
    const titles = {
        1: "Album Format",
        2: "Cover Type",
        3: "Paper Quality",
        4: "Photo Size",
        5: "Web Settings"
    };
    return titles[step as keyof typeof titles] || "";
};

const AlbumWizard: React.FC<AlbumWizardProps> = ({ onComplete, params }) => {
    const [step, setStep] = useState(1);
    const [albumData, setAlbumData] = useState<AlbumWizardData>({
        format: 'square',
        dimensions: '20x20',
        coverType: 'hard',
        paperQuality: 'matte',
        photosize: 'medium',
        webSizePx: '1200x900',
        webPhotoSizePx: '600x450',
        albumId: params.id,
    });

    const handleNext = () => {
        if (step < 5) {
            setStep(step + 1);
        } else {
            onComplete(albumData);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const updateAlbumData = (data: Partial<typeof albumData>) => {
        setAlbumData({ ...albumData, ...data });
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-8 h-8 rounded-full flex items-center justify-center
                ${i + 1 === step ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">
                    Step {step} of 5: {getStepTitle(step)}
                </div>
            </div>

            <div className="mb-8">
                {step === 1 && (
                    <FormatSelector
                        selected={albumData.format}
                        dimensions={albumData.dimensions}
                        onChange={updateAlbumData}
                    />
                )}
                {step === 2 && (
                    <CoverSelector
                        selected={albumData.coverType}
                        onChange={updateAlbumData}
                    />
                )}
                {step === 3 && (
                    <PaperSelector
                        selected={albumData.paperQuality}
                        onChange={updateAlbumData}
                    />
                )}
                {step === 4 && (
                    <PhotoSizeSelector
                        selected={albumData.photosize}
                        onChange={updateAlbumData}
                    />
                )}
                {step === 5 && (
                    <WebSizeSelector
                        webSizePx={albumData.webSizePx}
                        webPhotoSizePx={albumData.webPhotoSizePx}
                        onChange={updateAlbumData}
                    />
                )}
            </div>

            <div className="flex justify-between">
                <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    {step === 5 ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default AlbumWizard;
