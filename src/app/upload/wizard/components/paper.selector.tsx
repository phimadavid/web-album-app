// src/components/album/PaperSelector.tsx
import React from 'react';
import { ALBUM_OPTIONS } from '../album.wizard';
import { PaperSelectorProps } from '../types/album.wizard.types';

const PaperSelector: React.FC<PaperSelectorProps> = ({ selected, onChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Select Paper Quality</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ALBUM_OPTIONS.paperQualities.map((paper) => (
                    <button
                        key={paper.id}
                        className={`p-6 border-2 rounded-lg transition-colors
              ${selected === paper.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-200'
                            }`}
                        onClick={() => onChange({ paperQuality: paper.id as 'matte' | 'glossy' | 'premium' })}
                    >
                        <div className="text-lg font-medium">{paper.label}</div>
                        <div className="mt-2 text-sm text-gray-500">
                            {getPaperDescription(paper.id)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

function getPaperDescription(paperId: string): string {
    const descriptions: Record<string, string> = {
        matte: 'Non-reflective finish, perfect for art prints',
        glossy: 'Vibrant colors with shine and depth',
        premium: 'Museum-quality archival paper',
    };
    return descriptions[paperId] || '';
}

export default PaperSelector;
