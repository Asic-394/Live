import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import { SuggestionChip } from './SuggestionChip';
import { ResponseBubble } from './ResponseBubble';
import type { AgentState, Suggestion } from '../../types/agent';
import { cn } from '../../utils/cn';

interface CommandBarProps {
    agentState: AgentState;
    suggestions: Suggestion[];
    lastResponse: string | null;
    isProcessing: boolean;
    onSubmit: (message: string) => void;
    onSuggestionClick: (text: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
    agentState,
    suggestions,
    lastResponse,
    isProcessing,
    onSubmit,
    onSuggestionClick
}) => {
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!input.trim() || isProcessing) {
            return;
        }

        onSubmit(input.trim());
        setInput('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSuggestionClick = (text: string) => {
        onSuggestionClick(text);
        setInput('');
    };

    const isExpanded = isFocused || input.length > 0 || agentState !== 'idle';

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
            {/* Response Bubble */}
            <ResponseBubble message={lastResponse} />

            {/* Suggestion Chips */}
            <AnimatePresence>
                {isExpanded && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="mb-3 flex flex-wrap gap-2 justify-center max-w-2xl"
                    >
                        {suggestions.map((suggestion) => (
                            <SuggestionChip
                                key={suggestion.id}
                                suggestion={suggestion}
                                onClick={handleSuggestionClick}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Command Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={cn(
                    'relative bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 transition-all duration-300',
                    isExpanded ? 'w-[600px] animate-rgb-border' : 'w-[500px] border-gray-700'
                )}
            >
                {/* Glow effect */}
                {isExpanded && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-20 blur-xl" />
                )}

                <div className="relative flex items-end gap-3 p-4">
                    {/* Agent Avatar */}
                    <div className="flex-shrink-0 mb-1">
                        <AgentAvatar state={agentState} />
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 min-w-0">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Ask me anything about the warehouse..."
                            disabled={isProcessing}
                            rows={1}
                            className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ maxHeight: '120px' }}
                        />
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isProcessing}
                        className={cn(
                            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 mb-1',
                            input.trim() && !isProcessing
                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/50 hover:scale-110'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        )}
                        aria-label="Send message"
                    >
                        {isProcessing ? (
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* Hint text */}
                {!isFocused && !input && agentState === 'idle' && (
                    <div className="absolute bottom-2 right-4 text-xs text-gray-500 pointer-events-none">
                        Press Enter to send
                    </div>
                )}
            </motion.div>
        </div>
    );
};
