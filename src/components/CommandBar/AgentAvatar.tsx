import React from 'react';
import { Bot, Loader2, Zap } from 'lucide-react';
import type { AgentState } from '../../types/agent';

interface AgentAvatarProps {
    state: AgentState;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({ state }) => {
    const getIcon = () => {
        switch (state) {
            case 'analyzing':
                return <Loader2 className="w-5 h-5 animate-spin" />;
            case 'acting':
                return <Zap className="w-5 h-5" />;
            default:
                return <Bot className="w-5 h-5" />;
        }
    };

    const getBackgroundColor = () => {
        switch (state) {
            case 'analyzing':
                return 'bg-blue-500';
            case 'acting':
                return 'bg-green-500';
            default:
                return 'bg-purple-500';
        }
    };

    const getStatusColor = () => {
        switch (state) {
            case 'analyzing':
                return 'bg-blue-400';
            case 'acting':
                return 'bg-green-400';
            default:
                return 'bg-green-400';
        }
    };

    return (
        <div className="relative">
            <div className={`w-10 h-10 rounded-full ${getBackgroundColor()} flex items-center justify-center text-white transition-all duration-300`}>
                {getIcon()}
            </div>

            {/* Status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900">
                <div className={`w-full h-full rounded-full ${getStatusColor()} ${state !== 'idle' ? 'animate-pulse' : ''}`} />
            </div>

            {/* Pulse ring animation when active */}
            {state !== 'idle' && (
                <div className="absolute inset-0 rounded-full border-2 border-current opacity-75 animate-ping" />
            )}
        </div>
    );
};
