import { create } from 'zustand';
import type { AgentState, AgentResponse, Suggestion, ConversationMessage, AgentContext } from '../types/agent';
import AgentService from '../services/AgentService';

export interface ActionFlow {
    signals: string[];
    context: Record<string, any>;
    intent: string;
    actions: any[];
}

export interface SubAgentAnalysis {
    agentId: string;
    summary: string;
    issues: any[];
    recommendations: any[];
    confidence: number;
}

interface AgentStore {
    // State
    agentState: AgentState;
    isProcessing: boolean;
    lastResponse: AgentResponse | null;
    suggestions: Suggestion[];
    conversationHistory: ConversationMessage[];
    isCommandBarVisible: boolean;
    error: string | null;

    // Phase 2: Multi-agent orchestration state
    actionFlow: ActionFlow | null;
    subAgentAnalyses: Map<string, SubAgentAnalysis> | null;
    showActionFlow: boolean;

    // Actions
    sendMessage: (message: string, context: AgentContext) => Promise<void>;
    getBriefing: (context: AgentContext) => Promise<void>;
    loadSuggestions: (context: AgentContext) => Promise<void>;
    clearHistory: () => void;
    toggleCommandBar: () => void;
    setAgentState: (state: AgentState) => void;
    setError: (error: string | null) => void;

    // Phase 2: New actions
    setActionFlow: (flow: ActionFlow | null) => void;
    setSubAgentAnalyses: (analyses: Map<string, SubAgentAnalysis> | null) => void;
    toggleActionFlow: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
    // Initial state
    agentState: 'idle',
    isProcessing: false,
    lastResponse: null,
    suggestions: [],
    conversationHistory: [],
    isCommandBarVisible: true,
    error: null,

    // Phase 2: Initial state
    actionFlow: null,
    subAgentAnalyses: null,
    showActionFlow: false,

    // Send a message to the agent
    sendMessage: async (message: string, context: AgentContext) => {
        const state = get();

        if (state.isProcessing) {
            console.warn('[AgentStore] Already processing a message');
            return;
        }

        try {
            // Set processing state
            set({
                isProcessing: true,
                agentState: 'analyzing',
                error: null
            });

            // Add user message to history
            const userMessage: ConversationMessage = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };

            set(state => ({
                conversationHistory: [...state.conversationHistory, userMessage]
            }));

            // Query the agent
            console.log('[AgentStore] Sending query:', message);

            // Phase 2: Set delegating state when sub-agents are working
            set({ agentState: 'delegating' });

            const response = await AgentService.query(message, context);
            console.log('[AgentStore] Received response:', response);

            // Phase 2: Extract actionFlow and subAgentAnalyses from response
            const actionFlow = (response as any).actionFlow || null;
            const subAgentAnalyses = (response as any).subAgentAnalyses || null;

            // Add assistant message to history
            const assistantMessage: ConversationMessage = {
                role: 'assistant',
                content: response.message,
                timestamp: new Date().toISOString()
            };

            set(state => ({
                conversationHistory: [...state.conversationHistory, assistantMessage],
                lastResponse: response,
                agentState: response.actions.length > 0 ? 'acting' : 'idle',
                suggestions: response.suggestions.length > 0 ? response.suggestions : state.suggestions,
                // Phase 2: Set actionFlow and subAgentAnalyses
                actionFlow,
                subAgentAnalyses,
                showActionFlow: actionFlow !== null
            }));

            // Return to idle after actions complete
            if (response.actions.length > 0) {
                setTimeout(() => {
                    set({ agentState: 'idle' });
                }, 2000);
            }

        } catch (error: any) {
            console.error('[AgentStore] Error sending message:', error);
            set({
                error: error.message || 'Failed to send message',
                agentState: 'idle'
            });
        } finally {
            set({ isProcessing: false });
        }
    },

    // Get shift briefing
    getBriefing: async (context: AgentContext) => {
        try {
            set({ isProcessing: true, agentState: 'analyzing' });

            const briefing = await AgentService.getBriefing(context);

            const assistantMessage: ConversationMessage = {
                role: 'assistant',
                content: briefing,
                timestamp: new Date().toISOString()
            };

            set(state => ({
                conversationHistory: [...state.conversationHistory, assistantMessage],
                lastResponse: {
                    message: briefing,
                    actions: [],
                    suggestions: []
                },
                agentState: 'idle',
                isProcessing: false
            }));

        } catch (error: any) {
            console.error('[AgentStore] Error getting briefing:', error);
            set({
                error: error.message || 'Failed to get briefing',
                agentState: 'idle',
                isProcessing: false
            });
        }
    },

    // Load contextual suggestions
    loadSuggestions: async (context: AgentContext) => {
        try {
            const suggestions = await AgentService.getSuggestions(context);
            set({ suggestions });
        } catch (error: any) {
            console.error('[AgentStore] Error loading suggestions:', error);
            // Keep existing suggestions on error
        }
    },

    // Clear conversation history
    clearHistory: () => {
        set({
            conversationHistory: [],
            lastResponse: null,
            error: null,
            actionFlow: null,
            subAgentAnalyses: null,
            showActionFlow: false
        });
    },

    // Toggle command bar visibility
    toggleCommandBar: () => {
        set(state => ({ isCommandBarVisible: !state.isCommandBarVisible }));
    },

    // Set agent state
    setAgentState: (agentState: AgentState) => {
        set({ agentState });
    },

    // Set error
    setError: (error: string | null) => {
        set({ error });
    },

    // Phase 2: New actions
    setActionFlow: (actionFlow: ActionFlow | null) => {
        set({ actionFlow });
    },

    setSubAgentAnalyses: (subAgentAnalyses: Map<string, SubAgentAnalysis> | null) => {
        set({ subAgentAnalyses });
    },

    toggleActionFlow: () => {
        set(state => ({ showActionFlow: !state.showActionFlow }));
    }
}));

