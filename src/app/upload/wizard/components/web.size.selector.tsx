import React from 'react';
import { WebSizeSelectorProps } from '../types/album.wizard.types';

const WEB_SIZE_OPTIONS = [
    {
        id: "small",
        label: "Small Web Size",
        webSizePx: "800x600",
        webPhotoSizePx: "400x300",
        description: "Optimized for fast loading"
    },
    {
        id: "medium",
        label: "Medium Web Size",
        webSizePx: "1200x900",
        webPhotoSizePx: "600x450",
        description: "Balanced quality and performance"
    },
    {
        id: "large",
        label: "Large Web Size",
        webSizePx: "1920x1080",
        webPhotoSizePx: "960x720",
        description: "High quality for detailed viewing"
    },
    {
        id: "custom",
        label: "Custom Size",
        webSizePx: "custom",
        webPhotoSizePx: "custom",
        description: "Set your own dimensions"
    }
];

const WebSizeSelector: React.FC<WebSizeSelectorProps> = ({
    webSizePx,
    webPhotoSizePx,
    onChange
}) => {
    const selectedOption = WEB_SIZE_OPTIONS.find(
        option => option.webSizePx === webSizePx && option.webPhotoSizePx === webPhotoSizePx
    ) || WEB_SIZE_OPTIONS.find(option => option.id === "custom");

    const handlePresetSelect = (option: typeof WEB_SIZE_OPTIONS[0]) => {
        onChange({
            webSizePx: option.webSizePx,
            webPhotoSizePx: option.webPhotoSizePx
        });
    };

    const handleCustomChange = (field: 'webSizePx' | 'webPhotoSizePx', value: string) => {
        onChange({
            webSizePx: field === 'webSizePx' ? value : webSizePx,
            webPhotoSizePx: field === 'webPhotoSizePx' ? value : webPhotoSizePx
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Web Display Settings</h2>
            <p className="text-gray-600">Configure how your album will appear when viewed online</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WEB_SIZE_OPTIONS.filter(option => option.id !== "custom").map((option) => (
                    <button
                        key={option.id}
                        className={`p-6 border-2 rounded-lg transition-colors text-left
                            ${selectedOption?.id === option.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-200'
                            }`}
                        onClick={() => handlePresetSelect(option)}
                    >
                        <div className="text-lg font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600 mt-1">
                            Album: {option.webSizePx}px
                        </div>
                        <div className="text-sm text-gray-600">
                            Photos: {option.webPhotoSizePx}px
                        </div>
                        <div className="text-sm text-gray-500 mt-2">{option.description}</div>
                    </button>
                ))}
            </div>

            {/* Custom Size Section */}
            <div className="border-t pt-6">
                <button
                    className={`w-full p-4 border-2 rounded-lg transition-colors text-left mb-4
                        ${selectedOption?.id === "custom"
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                    onClick={() => handlePresetSelect(WEB_SIZE_OPTIONS[3])}
                >
                    <div className="text-lg font-medium">Custom Web Size</div>
                    <div className="text-sm text-gray-500 mt-1">Set your own dimensions</div>
                </button>

                {selectedOption?.id === "custom" && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Album Web Size (Width x Height in pixels)
                            </label>
                            <input
                                type="text"
                                value={webSizePx}
                                onChange={(e) => handleCustomChange('webSizePx', e.target.value)}
                                placeholder="e.g., 1920x1080"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Photo Web Size (Width x Height in pixels)
                            </label>
                            <input
                                type="text"
                                value={webPhotoSizePx}
                                onChange={(e) => handleCustomChange('webPhotoSizePx', e.target.value)}
                                placeholder="e.g., 960x720"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Format: WidthxHeight (e.g., 1920x1080). Higher values mean better quality but slower loading.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebSizeSelector;
