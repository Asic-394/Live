import OpenAI from 'openai';
import { AgentContext } from '../agents/SubAgent';

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const SYSTEM_PROMPT = `You are an AI operations assistant for a warehouse management system. You help warehouse managers and operators by:
- Answering questions about warehouse status, inventory, equipment, and operations
- Providing insights and recommendations based on real-time data
- Executing camera navigation and visualization commands
- Highlighting issues and suggesting corrective actions

You have access to real-time warehouse data including entities (forklifts, workers, inventory), zones, KPIs, and alerts.

When responding:
- Be concise and action-oriented
- Prioritize safety and efficiency
- Use specific data points when available
- Suggest concrete next steps

You can execute actions by calling functions. Always prefer function calls over just describing what should happen.`;

const FUNCTION_SCHEMA = [
    {
        name: 'flyToZone',
        description: 'Navigate the camera to focus on a specific warehouse zone',
        parameters: {
            type: 'object',
            properties: {
                zoneId: { type: 'string', description: 'Zone identifier (e.g., "zone-a", "receiving", "shipping")' },
                duration: { type: 'number', description: 'Animation duration in milliseconds', default: 1500 }
            },
            required: ['zoneId']
        }
    },
    {
        name: 'focusOnEntity',
        description: 'Focus camera on a specific entity (forklift, worker, inventory item)',
        parameters: {
            type: 'object',
            properties: {
                entityId: { type: 'string', description: 'Entity identifier' },
                duration: { type: 'number', description: 'Animation duration in milliseconds', default: 1500 }
            },
            required: ['entityId']
        }
    },
    {
        name: 'goToOverview',
        description: 'Reset camera to warehouse overview position',
        parameters: {
            type: 'object',
            properties: {
                duration: { type: 'number', description: 'Animation duration in milliseconds', default: 2000 }
            }
        }
    },
    {
        name: 'showHeatMap',
        description: 'Display a heatmap visualization for a specific metric',
        parameters: {
            type: 'object',
            properties: {
                metric: { type: 'string', description: 'Metric to visualize (e.g., "activity", "utilization", "congestion")' }
            },
            required: ['metric']
        }
    },
    {
        name: 'showAlert',
        description: 'Highlight an alert or issue in the visualization',
        parameters: {
            type: 'object',
            properties: {
                alertId: { type: 'string', description: 'Alert identifier' },
                severity: { type: 'string', enum: ['critical', 'warning', 'info'] }
            },
            required: ['alertId']
        }
    }
];

export async function chat(
    messages: Array<{ role: string; content: string }>,
    context?: AgentContext
): Promise<string> {
    // Mock fallback mode when no API key
    if (!openai) {
        console.log('[LLM] Mock mode - no API key provided');
        return getMockResponse(messages[messages.length - 1]?.content || '');
    }

    try {
        const systemMessage = { role: 'system' as const, content: SYSTEM_PROMPT };
        const contextMessage = context ? buildContextMessage(context) : null;

        const allMessages = [
            systemMessage,
            ...(contextMessage ? [contextMessage] : []),
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: allMessages,
            temperature: 0.7,
            max_tokens: 500
        });

        return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error: any) {
        console.error('[LLM] Error:', error.message);
        return 'I encountered an error processing your request. Please try again.';
    }
}

export async function chatWithFunctions(
    messages: Array<{ role: string; content: string }>,
    context?: AgentContext,
    analysisSummary?: string
): Promise<{ message: string; actions: any[] }> {
    // Mock fallback mode
    if (!openai) {
        console.log('[LLM] Mock mode with functions - no API key provided');
        const mockMsg = getMockResponse(messages[messages.length - 1]?.content || '');
        return { message: mockMsg, actions: [] };
    }

    try {
        const systemMessage = { role: 'system' as const, content: SYSTEM_PROMPT };
        const contextMessage = context ? buildContextMessage(context) : null;

        const allMessages = [
            systemMessage,
            ...(contextMessage ? [contextMessage] : []),
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        ];

        // Add analysis summary if provided
        if (analysisSummary) {
            allMessages.push({
                role: 'system' as const,
                content: analysisSummary
            });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: allMessages,
            functions: FUNCTION_SCHEMA as any,
            function_call: 'auto',
            temperature: 0.7,
            max_tokens: 500
        });

        const choice = response.choices[0];
        const actions: any[] = [];

        // Check if function was called
        if (choice.message.function_call) {
            const functionName = choice.message.function_call.name;
            const functionArgs = JSON.parse(choice.message.function_call.arguments || '{}');

            actions.push(mapFunctionToAction(functionName, functionArgs));
        }

        const message = choice.message.content || 'Action executed.';
        return { message, actions };
    } catch (error: any) {
        console.error('[LLM] Error with functions:', error.message);
        return {
            message: 'I encountered an error processing your request. Please try again.',
            actions: []
        };
    }
}

export async function classifyIntent(message: string): Promise<string> {
    if (!openai) {
        return classifyIntentMock(message);
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Classify the user intent into one of: navigation, query, analysis, action, briefing. Respond with only the category name.'
                },
                { role: 'user', content: message }
            ],
            temperature: 0.3,
            max_tokens: 10
        });

        return response.choices[0]?.message?.content?.toLowerCase().trim() || 'query';
    } catch (error) {
        return 'query';
    }
}

function buildContextMessage(context: AgentContext): { role: 'system'; content: string } {
    const parts: string[] = ['Current warehouse state:'];

    if (context.entities && context.entities.length > 0) {
        parts.push(`\n- Entities: ${context.entities.length} tracked (forklifts, workers, inventory)`);
    }

    if (context.zones && context.zones.length > 0) {
        parts.push(`\n- Zones: ${context.zones.map((z: any) => z.id || z.name).join(', ')}`);
    }

    if (context.metrics) {
        parts.push(`\n- Metrics: ${JSON.stringify(context.metrics)}`);
    }

    if (context.alerts && context.alerts.length > 0) {
        parts.push(`\n- Active alerts: ${context.alerts.length}`);
    }

    return { role: 'system', content: parts.join('') };
}

function mapFunctionToAction(functionName: string, args: any): any {
    switch (functionName) {
        case 'flyToZone':
            return {
                type: 'camera',
                action: 'flyTo',
                target: args.zoneId,
                duration: args.duration || 1500
            };
        case 'focusOnEntity':
            return {
                type: 'camera',
                action: 'focus',
                target: args.entityId,
                duration: args.duration || 1500
            };
        case 'goToOverview':
            return {
                type: 'camera',
                action: 'overview',
                duration: args.duration || 2000
            };
        case 'showHeatMap':
            return {
                type: 'ui',
                action: 'heatmap',
                metric: args.metric
            };
        case 'showAlert':
            return {
                type: 'ui',
                action: 'alert',
                alertId: args.alertId,
                severity: args.severity
            };
        default:
            return { type: 'unknown', action: functionName, args };
    }
}

// Mock responses for demo mode
function getMockResponse(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('status') || lowerMsg.includes('overview')) {
        return 'The warehouse is operating normally. All zones are active with standard utilization levels.';
    }
    if (lowerMsg.includes('alert') || lowerMsg.includes('issue')) {
        return 'There are currently no critical alerts. All systems are functioning within normal parameters.';
    }
    if (lowerMsg.includes('inventory')) {
        return 'Inventory levels are healthy across all zones. No stockouts or overstock situations detected.';
    }
    if (lowerMsg.includes('equipment') || lowerMsg.includes('forklift')) {
        return 'All equipment is operational. Forklifts are distributed across active zones with normal utilization.';
    }

    return 'I understand your request. In demo mode, I can provide basic information. For full AI capabilities, please configure an OpenAI API key.';
}

function classifyIntentMock(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('show') || lowerMsg.includes('go to') || lowerMsg.includes('navigate')) {
        return 'navigation';
    }
    if (lowerMsg.includes('briefing') || lowerMsg.includes('summary')) {
        return 'briefing';
    }
    if (lowerMsg.includes('analyze') || lowerMsg.includes('why') || lowerMsg.includes('how')) {
        return 'analysis';
    }

    return 'query';
}
