import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Activity, Target, Zap } from 'lucide-react';

export interface Action {
    type: string;
    action: string;
    [key: string]: any;
}

export interface ActionFlowProps {
    signals: string[];
    context: Record<string, any>;
    intent: string;
    actions: Action[];
    onActionExecute?: (action: Action) => void;
}

export const ActionFlow: React.FC<ActionFlowProps> = ({
    signals,
    context,
    intent,
    actions,
    onActionExecute
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['signals', 'intent', 'actions']));
    const [visibleSections, setVisibleSections] = useState<string[]>([]);

    useEffect(() => {
        // Progressive reveal animation
        const sections = ['signals', 'context', 'intent', 'actions'];
        sections.forEach((section, index) => {
            setTimeout(() => {
                setVisibleSections(prev => [...prev, section]);
            }, index * 300);
        });
    }, []);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: 'easeOut'
            }
        }
    };

    return (
        <div className="action-flow-container">
            <AnimatePresence>
                {/* Signals Section */}
                {visibleSections.includes('signals') && signals.length > 0 && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="action-flow-section signals"
                    >
                        <div
                            className="section-header"
                            onClick={() => toggleSection('signals')}
                        >
                            <Activity size={18} />
                            <span className="section-title">Signals</span>
                            {expandedSections.has('signals') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {expandedSections.has('signals') && (
                            <motion.div
                                className="section-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <ul className="signal-list">
                                    {signals.map((signal, idx) => (
                                        <li key={idx} className="signal-item">
                                            {signal}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Arrow connector */}
                {visibleSections.includes('context') && (
                    <motion.div
                        className="flow-arrow"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        ↓
                    </motion.div>
                )}

                {/* Context Section */}
                {visibleSections.includes('context') && Object.keys(context).length > 0 && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="action-flow-section context"
                    >
                        <div
                            className="section-header"
                            onClick={() => toggleSection('context')}
                        >
                            <Activity size={18} />
                            <span className="section-title">Context</span>
                            {expandedSections.has('context') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {expandedSections.has('context') && (
                            <motion.div
                                className="section-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <div className="context-grid">
                                    {Object.entries(context).map(([key, value]) => (
                                        <div key={key} className="context-item">
                                            <span className="context-key">{key}:</span>
                                            <span className="context-value">
                                                {typeof value === 'object'
                                                    ? `${(value as any).issueCount || 0} issues, ${(value as any).recommendationCount || 0} recommendations`
                                                    : String(value)
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Arrow connector */}
                {visibleSections.includes('intent') && (
                    <motion.div
                        className="flow-arrow"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        ↓
                    </motion.div>
                )}

                {/* Intent Section */}
                {visibleSections.includes('intent') && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="action-flow-section intent"
                    >
                        <div
                            className="section-header"
                            onClick={() => toggleSection('intent')}
                        >
                            <Target size={18} />
                            <span className="section-title">Intent</span>
                            {expandedSections.has('intent') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {expandedSections.has('intent') && (
                            <motion.div
                                className="section-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <p className="intent-text">{intent}</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Arrow connector */}
                {visibleSections.includes('actions') && (
                    <motion.div
                        className="flow-arrow"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        ↓
                    </motion.div>
                )}

                {/* Actions Section */}
                {visibleSections.includes('actions') && actions.length > 0 && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="action-flow-section actions"
                    >
                        <div
                            className="section-header"
                            onClick={() => toggleSection('actions')}
                        >
                            <Zap size={18} />
                            <span className="section-title">Actions</span>
                            {expandedSections.has('actions') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {expandedSections.has('actions') && (
                            <motion.div
                                className="section-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <div className="action-buttons">
                                    {actions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            className="action-button"
                                            onClick={() => onActionExecute?.(action)}
                                        >
                                            <Zap size={14} />
                                            {action.action}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .action-flow-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 1rem;
                }

                .action-flow-section {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    user-select: none;
                    transition: background 0.2s;
                }

                .section-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .section-title {
                    flex: 1;
                    font-weight: 600;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .section-content {
                    padding: 0 1rem 0.75rem 1rem;
                }

                .signal-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .signal-item {
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 4px;
                    font-size: 0.875rem;
                    border-left: 3px solid var(--accent-color, #3b82f6);
                }

                .context-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 0.75rem;
                }

                .context-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 4px;
                    font-size: 0.875rem;
                }

                .context-key {
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: capitalize;
                }

                .context-value {
                    color: rgba(255, 255, 255, 0.9);
                }

                .intent-text {
                    margin: 0;
                    padding: 0.5rem;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 4px;
                    border-left: 3px solid #3b82f6;
                    font-size: 0.875rem;
                }

                .action-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .action-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-transform: capitalize;
                }

                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .flow-arrow {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 1.5rem;
                    line-height: 1;
                    margin: -0.25rem 0;
                }

                .signals .section-header {
                    color: #f59e0b;
                }

                .context .section-header {
                    color: #8b5cf6;
                }

                .intent .section-header {
                    color: #3b82f6;
                }

                .actions .section-header {
                    color: #10b981;
                }
            `}</style>
        </div>
    );
};
