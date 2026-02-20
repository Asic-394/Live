import type { AgentResponse, AgentContext, Suggestion } from '../types/agent';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class AgentService {
    /**
     * Send a query to the agent
     */
    async query(message: string, context: AgentContext): Promise<AgentResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/agent/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, context }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[AgentService] Query error:', error);
            // Graceful fallback
            return {
                message: 'I\'m having trouble connecting to the backend. Please ensure the server is running.',
                actions: [],
                suggestions: [],
                source: 'llm'
            };
        }
    }

    /**
     * Get shift briefing
     */
    async getBriefing(context: AgentContext): Promise<string> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/agent/briefing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ context }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.message;
        } catch (error) {
            console.error('[AgentService] Briefing error:', error);
            return 'Unable to generate briefing at this time.';
        }
    }

    /**
     * Get contextual suggestions
     */
    async getSuggestions(context: AgentContext): Promise<Suggestion[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/agent/suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ context }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.suggestions;
        } catch (error) {
            console.error('[AgentService] Suggestions error:', error);
            // Default suggestions
            return [
                { id: 'briefing', text: 'Show shift briefing', icon: 'FileText' },
                { id: 'overview', text: 'Go to overview', icon: 'Maximize2' },
                { id: 'inventory', text: 'Check inventory', icon: 'Package' },
                { id: 'alerts', text: 'Show alerts', icon: 'AlertTriangle' }
            ];
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

export default new AgentService();
