// Agent state types
export type AgentState = 'idle' | 'analyzing' | 'delegating' | 'acting';

// Agent response from backend
export interface AgentResponse {
    message: string;
    actions: CameraAction[];
    suggestions: Suggestion[];
    source?: 'rule' | 'llm';
    ruleId?: string;
    confidence?: number;
    timestamp?: string;
}

// Suggestion chip
export interface Suggestion {
    id: string;
    text: string;
    icon?: string;
}

// Camera action types
export interface CameraAction {
    type: 'camera' | 'ui';
    action: 'flyTo' | 'focus' | 'follow' | 'overview' | 'heatmap' | 'alert';
    target?: string;
    duration?: number;
    metric?: string;
    alertId?: string;
    severity?: 'critical' | 'warning' | 'info';
}

// Context sent to backend
export interface AgentContext {
    entities?: any[];
    zones?: any[];
    metrics?: Record<string, any>;
    alerts?: any[];
    timestamp?: string;
}

// Conversation message
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
