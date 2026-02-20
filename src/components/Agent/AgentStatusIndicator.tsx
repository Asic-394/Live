import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

export type AgentStatus = 'idle' | 'analyzing' | 'delegating' | 'responding';

export interface AgentStatusIndicatorProps {
    status: AgentStatus;
}

export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ status }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'idle':
                return {
                    icon: Circle,
                    color: '#6b7280',
                    label: 'Idle',
                    animate: { scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }
                };
            case 'analyzing':
                return {
                    icon: Loader2,
                    color: '#3b82f6',
                    label: 'Analyzing',
                    animate: { rotate: 360 }
                };
            case 'delegating':
                return {
                    icon: null, // Custom multi-orbit animation
                    color: '#8b5cf6',
                    label: 'Delegating',
                    animate: {}
                };
            case 'responding':
                return {
                    icon: CheckCircle2,
                    color: '#10b981',
                    label: 'Complete',
                    animate: { scale: [0, 1.2, 1], opacity: [0, 1, 1] }
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className="agent-status-indicator">
            <motion.div
                className="status-icon-container"
                animate={config.animate}
                transition={{
                    duration: status === 'analyzing' ? 1 : 0.5,
                    repeat: status === 'idle' || status === 'analyzing' ? Infinity : 0,
                    ease: status === 'analyzing' ? 'linear' : 'easeInOut'
                }}
            >
                {status === 'delegating' ? (
                    <div className="orbit-container">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                className="orbit-dot"
                                style={{
                                    background: `hsl(${i * 72}, 70%, 60%)`
                                }}
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.3, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: 'linear'
                                }}
                            />
                        ))}
                    </div>
                ) : Icon ? (
                    <Icon size={18} color={config.color} />
                ) : null}
            </motion.div>

            <span className="status-label" style={{ color: config.color }}>
                {config.label}
            </span>

            <style jsx>{`
                .agent-status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .status-icon-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                }

                .orbit-container {
                    position: relative;
                    width: 20px;
                    height: 20px;
                }

                .orbit-dot {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    top: 50%;
                    left: 50%;
                    transform-origin: 0 0;
                }

                .orbit-dot:nth-child(1) {
                    transform: translate(-50%, -50%) translateX(8px);
                }

                .orbit-dot:nth-child(2) {
                    transform: translate(-50%, -50%) translateX(8px) rotate(72deg);
                }

                .orbit-dot:nth-child(3) {
                    transform: translate(-50%, -50%) translateX(8px) rotate(144deg);
                }

                .orbit-dot:nth-child(4) {
                    transform: translate(-50%, -50%) translateX(8px) rotate(216deg);
                }

                .orbit-dot:nth-child(5) {
                    transform: translate(-50%, -50%) translateX(8px) rotate(288deg);
                }

                .status-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
            `}</style>
        </div>
    );
};
