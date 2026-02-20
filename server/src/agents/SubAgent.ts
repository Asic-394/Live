export interface AgentContext {
    entities?: any[];
    zones?: any[];
    metrics?: any;
    alerts?: any[];
    timestamp?: string;
}

export interface SubAgentAnalysis {
    agentId: string;
    summary: string;
    issues: Issue[];
    recommendations: Recommendation[];
    confidence: number;
}

export interface Issue {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    affectedEntities?: string[];
    suggestedActions?: string[];
}

export interface Recommendation {
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact?: string;
    actions?: any[];
}

export interface ExecutionResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

export abstract class SubAgent {
    protected agentId: string;
    protected description: string;

    constructor(agentId: string, description: string) {
        this.agentId = agentId;
        this.description = description;
    }

    abstract analyze(context: AgentContext): Promise<SubAgentAnalysis>;

    async execute(action: any, context: AgentContext): Promise<ExecutionResult> {
        return {
            success: false,
            message: 'Not implemented',
            error: 'Execute method not implemented for this agent'
        };
    }

    getAgentId(): string {
        return this.agentId;
    }

    getDescription(): string {
        return this.description;
    }
}
