import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ResponseBubbleProps {
    message: string | null;
    onDismiss?: () => void;
    autoDismissMs?: number;
}

export const ResponseBubble: React.FC<ResponseBubbleProps> = ({
    message,
    onDismiss,
    autoDismissMs = 5000
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);

            // Auto-dismiss after timeout
            if (autoDismissMs > 0) {
                const timer = setTimeout(() => {
                    setIsVisible(false);
                    onDismiss?.();
                }, autoDismissMs);

                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
        }
    }, [message, autoDismissMs, onDismiss]);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="mb-3 max-w-2xl"
                >
                    <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl px-5 py-3 shadow-2xl border border-gray-700/50 relative">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="pr-8 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {message}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
