import React from 'react';
import { ALBUM_OPTIONS } from '../album.wizard';
import { FormatSelectorProps } from '../types/album.wizard.types';

const FormatSelector: React.FC<FormatSelectorProps> = ({
    selected,
    dimensions,
    onChange,
}) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Select Album Format</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ALBUM_OPTIONS.formats.map((format) => (
                    <div key={format.id} className="space-y-4">
                        <button
                            className={`w-full p-4 border-2 rounded-lg transition-colors
                ${selected === format.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-200'
                                }`}
                            onClick={() => onChange({ format: format.id as 'square' | 'rectangular' | 'panoramic', dimensions: format.dimensions[0] })}
                        >
                            <div className="text-lg font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">
                                Available sizes: {format.dimensions.join(', ')} cm
                            </div>
                        </button>

                        {selected === format.id && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Select Size
                                </label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={dimensions}
                                    onChange={(e) =>
                                        onChange({ format: format.id as 'square' | 'rectangular' | 'panoramic', dimensions: e.target.value })
                                    }
                                >
                                    {format.dimensions.map((dim) => (
                                        <option key={dim} value={dim}>
                                            {dim} cm
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FormatSelector;
