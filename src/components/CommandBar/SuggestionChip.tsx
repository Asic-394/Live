import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { Suggestion } from '../../types/agent';

interface SuggestionChipProps {
    suggestion: Suggestion;
    onClick: (text: string) => void;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({ suggestion, onClick }) => {
    // Get icon component dynamically
    const IconComponent = suggestion.icon
        ? (LucideIcons as any)[suggestion.icon]
        : null;

    return (
        <button
            onClick={() => onClick(suggestion.text)}
            className="group px-4 py-2 rounded-full bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700 hover:border-purple-500/50 text-sm text-gray-200 hover:text-white transition-all duration-200 flex items-center gap-2 backdrop-blur-sm shadow-lg hover:shadow-purple-500/20 hover:scale-105"
        >
            {IconComponent && (
                <IconComponent className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
            )}
            <span>{suggestion.text}</span>
        </button>
    );
};
