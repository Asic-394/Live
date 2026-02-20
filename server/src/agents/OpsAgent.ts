import { AgentContext, SubAgent, SubAgentAnalysis } from './SubAgent';
import * as llmService from '../services/llmService';
import {
    MaintenanceAgent,
    InventoryAgent,
    SlottingAgent,
    SafetyAgent,
    LaborAgent
} from './specialists';

export interface Intent {
    category: string;
    target?: string;
    urgency?: 'low' | 'medium' | 'high';
    confidence: number;
}

export class OpsAgent {
    private subAgents: Map<string, SubAgent>;
    private conversationHistory: Array<{ role: string; content: string }>;

    constructor() {
        // Phase 2: Initialize all specialist sub-agents
        this.subAgents = new Map<string, SubAgent>([
            ['maintenance', new MaintenanceAgent()],
            ['inventory', new InventoryAgent()],
            ['slotting', new SlottingAgent()],
            ['safety', new SafetyAgent()],
            ['labor', new LaborAgent()],
        ]);

        this.conversationHistory = [];

        console.log('[OpsAgent] Initialized with 5 specialist sub-agents');
    }

    async processIntent(
        message: string,
        context: AgentContext
    ): Promise<{ message: string; actions: any[]; source: string; actionFlow?: any; subAgentAnalyses?: Map<string, SubAgentAnalysis> }> {
        console.log('[OpsAgent] Processing intent:', message);

        // Classify intent
        const intentCategory = await llmService.classifyIntent(message);
        const intent: Intent = {
            category: intentCategory,
            confidence: 0.8
        };
        console.log('[OpsAgent] Classified intent:', intent);

        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: message });

        // Phase 2: Delegate to relevant sub-agents
        const relevantAgents = this.selectRelevantAgents(intent);
        console.log('[OpsAgent] Selected agents:', Array.from(relevantAgents.keys()));

        // Execute sub-agents in parallel
        const subAgentAnalyses = await this.delegateToSubAgents(relevantAgents, context);

        // Build analysis summary for LLM
        const analysisSummary = this.buildAnalysisSummary(subAgentAnalyses);

        // Synthesize response with LLM
        const { message: response, actions } = await llmService.chatWithFunctions(
            this.conversationHistory,
            context,
            analysisSummary
        );

        // Add response to history
        this.conversationHistory.push({ role: 'assistant', content: response });

        // Trim history to last 10 messages
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }

        // Build action flow for UI
        const actionFlow = this.buildActionFlow(subAgentAnalyses, intent, actions);

        return {
            message: response,
            actions,
            source: 'llm',
            actionFlow,
            subAgentAnalyses
        };
    }

    async getShiftBriefing(context: AgentContext): Promise<{ message: string; analyses: Map<string, SubAgentAnalysis> }> {
        console.log('[OpsAgent] Generating shift briefing with all sub-agents');

        // Run all sub-agents in parallel
        const allAnalyses = await this.delegateToSubAgents(this.subAgents, context);

        // Build comprehensive briefing
        const briefingParts: string[] = [
            '# Shift Briefing',
            '',
            `**Overview:** ${context.entities?.length || 0} entities, ${context.zones?.length || 0} zones`,
            ''
        ];

        // Add each agent's summary
        allAnalyses.forEach((analysis, agentId) => {
            briefingParts.push(`**${this.capitalizeFirst(agentId)}:** ${analysis.summary}`);

            if (analysis.issues.length > 0) {
                const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
                const warningIssues = analysis.issues.filter(i => i.severity === 'warning');

                if (criticalIssues.length > 0) {
                    briefingParts.push(`  🚨 ${criticalIssues.length} critical issue(s)`);
                }
                if (warningIssues.length > 0) {
                    briefingParts.push(`  ⚠️ ${warningIssues.length} warning(s)`);
                }
            }
            briefingParts.push('');
        });

        // Add top recommendations
        const allRecommendations = Array.from(allAnalyses.values())
            .flatMap(a => a.recommendations)
            .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .slice(0, 5);

        if (allRecommendations.length > 0) {
            briefingParts.push('**Top Recommendations:**');
            allRecommendations.forEach((rec, idx) => {
                briefingParts.push(`${idx + 1}. ${rec.title}`);
            });
        }

        return {
            message: briefingParts.join('\n'),
            analyses: allAnalyses
        };
    }

    async getBriefing(context: AgentContext): Promise<string> {
        const { message } = await this.getShiftBriefing(context);
        return message;
    }

    async getSuggestions(context: AgentContext): Promise<Array<{ id: string; text: string; icon?: string }>> {
        // Run quick analysis to generate context-aware suggestions
        const quickAnalyses = await this.delegateToSubAgents(
            new Map([
                ['maintenance', this.subAgents.get('maintenance')!],
                ['safety', this.subAgents.get('safety')!]
            ]),
            context
        );

        const suggestions: Array<{ id: string; text: string; icon?: string }> = [
            { id: 'briefing', text: 'Show shift briefing', icon: 'FileText' }
        ];

        // Add suggestions based on critical issues
        quickAnalyses.forEach((analysis, agentId) => {
            const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
            if (criticalIssues.length > 0 && suggestions.length < 4) {
                suggestions.push({
                    id: `${agentId}-critical`,
                    text: criticalIssues[0].title,
                    icon: 'AlertTriangle'
                });
            }
        });

        // Fill remaining slots with generic suggestions
        if (suggestions.length < 4) {
            suggestions.push({ id: 'overview', text: 'Go to overview', icon: 'Maximize2' });
        }

        if (context.zones && context.zones.length > 0 && suggestions.length < 4) {
            const firstZone = context.zones[0];
            const zoneName = (firstZone as any).id || (firstZone as any).name || 'Zone A';
            suggestions.push({
                id: 'zone-nav',
                text: `Show ${zoneName}`,
                icon: 'MapPin'
            });
        }

        return suggestions.slice(0, 4);
    }

    private selectRelevantAgents(intent: Intent): Map<string, SubAgent> {
        const category = intent.category.toLowerCase();

        // For briefing/status: include all agents
        if (category === 'briefing' || category === 'status') {
            return this.subAgents;
        }

        // For specific queries: select based on keywords
        const relevantAgents = new Map<string, SubAgent>();

        // Always include safety and maintenance for critical monitoring
        relevantAgents.set('safety', this.subAgents.get('safety')!);
        relevantAgents.set('maintenance', this.subAgents.get('maintenance')!);

        // Add domain-specific agents based on intent
        if (category.includes('inventory') || category.includes('stock')) {
            relevantAgents.set('inventory', this.subAgents.get('inventory')!);
        }
        if (category.includes('slotting') || category.includes('layout') || category.includes('efficiency')) {
            relevantAgents.set('slotting', this.subAgents.get('slotting')!);
        }
        if (category.includes('labor') || category.includes('worker') || category.includes('staff')) {
            relevantAgents.set('labor', this.subAgents.get('labor')!);
        }

        return relevantAgents;
    }

    private async delegateToSubAgents(
        agents: Map<string, SubAgent>,
        context: AgentContext
    ): Promise<Map<string, SubAgentAnalysis>> {
        console.log(`[OpsAgent] Delegating to ${agents.size} sub-agents in parallel`);

        const analysisPromises = Array.from(agents.entries()).map(async ([name, agent]) => {
            try {
                const analysis = await agent.analyze(context);
                return [name, analysis] as [string, SubAgentAnalysis];
            } catch (error) {
                console.error(`[OpsAgent] Error in ${name} agent:`, error);
                return [name, {
                    agentId: name,
                    summary: 'Analysis failed',
                    issues: [],
                    recommendations: [],
                    confidence: 0
                }] as [string, SubAgentAnalysis];
            }
        });

        const results = await Promise.all(analysisPromises);
        return new Map(results);
    }

    private buildAnalysisSummary(analyses: Map<string, SubAgentAnalysis>): string {
        const parts: string[] = ['\n\nSub-agent Analysis:'];

        analyses.forEach((analysis, agentId) => {
            parts.push(`\n${this.capitalizeFirst(agentId)}: ${analysis.summary}`);

            if (analysis.issues.length > 0) {
                analysis.issues.forEach(issue => {
                    parts.push(`  - [${issue.severity}] ${issue.title}`);
                });
            }
        });

        return parts.join('\n');
    }

    private buildActionFlow(
        analyses: Map<string, SubAgentAnalysis>,
        intent: Intent,
        actions: any[]
    ): any {
        // Extract signals from issues
        const signals: string[] = [];
        analyses.forEach((analysis) => {
            analysis.issues.forEach(issue => {
                if (issue.severity === 'critical' || issue.severity === 'warning') {
                    signals.push(`${issue.severity === 'critical' ? '🚨' : '⚠️'} ${issue.title}`);
                }
            });
        });

        // Build context summary
        const contextSummary: Record<string, any> = {};
        analyses.forEach((analysis, agentId) => {
            contextSummary[agentId] = {
                summary: analysis.summary,
                issueCount: analysis.issues.length,
                recommendationCount: analysis.recommendations.length
            };
        });

        return {
            signals: signals.slice(0, 5), // Limit to top 5 signals
            context: contextSummary,
            intent: `${intent.category} (confidence: ${(intent.confidence * 100).toFixed(0)}%)`,
            actions
        };
    }

    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    clearHistory(): void {
        this.conversationHistory = [];
        console.log('[OpsAgent] Conversation history cleared');
    }
}
