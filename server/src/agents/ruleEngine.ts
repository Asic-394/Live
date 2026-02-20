interface RulePattern {
    id: string;
    patterns: string[];
    response: string;
    actions?: any[];
    confidence: number;
}

const RULE_PATTERNS: RulePattern[] = [
    {
        id: 'shift-briefing',
        patterns: ['briefing', 'shift brief', 'shift summary', 'shift status', 'start of shift'],
        response: 'Here\'s your shift briefing: All zones operational, {entityCount} active entities, {alertCount} alerts requiring attention.',
        confidence: 0.9
    },
    {
        id: 'show-alerts',
        patterns: ['show alerts', 'what alerts', 'any issues', 'any problems', 'what\'s wrong'],
        response: 'Checking current alerts...',
        actions: [{ type: 'ui', action: 'showAlerts' }],
        confidence: 0.85
    },
    {
        id: 'navigate-zone',
        patterns: ['show zone', 'go to zone', 'navigate to zone', 'take me to zone', 'zone'],
        response: 'Taking you there now...',
        actions: [{ type: 'camera', action: 'flyTo', target: '{zone}' }],
        confidence: 0.85
    },
    {
        id: 'navigate-area',
        patterns: ['show receiving', 'show shipping', 'show storage', 'go to receiving', 'go to shipping'],
        response: 'Navigating to {area}...',
        actions: [{ type: 'camera', action: 'flyTo', target: '{area}' }],
        confidence: 0.85
    },
    {
        id: 'inventory-status',
        patterns: ['inventory', 'stock levels', 'what\'s in stock', 'inventory status', 'stock status'],
        response: 'Analyzing inventory levels across all zones...',
        confidence: 0.8
    },
    {
        id: 'equipment-status',
        patterns: ['equipment', 'forklifts', 'machinery', 'equipment status', 'forklift status'],
        response: 'Checking equipment status...',
        confidence: 0.8
    },
    {
        id: 'overview',
        patterns: ['overview', 'show all', 'zoom out', 'full view', 'reset view', 'go back'],
        response: 'Returning to overview...',
        actions: [{ type: 'camera', action: 'overview' }],
        confidence: 0.9
    },
    {
        id: 'safety-check',
        patterns: ['safety', 'safety check', 'any safety issues', 'safety status'],
        response: 'Running safety check across all zones...',
        confidence: 0.8
    },
    {
        id: 'labor-status',
        patterns: ['workers', 'labor', 'staff', 'employees', 'worker status'],
        response: 'Analyzing workforce distribution...',
        confidence: 0.8
    },
    {
        id: 'recommendations',
        patterns: ['recommend', 'suggest', 'what should i', 'advice', 'recommendations'],
        response: 'Analyzing current operations for recommendations...',
        confidence: 0.75
    }
];

export interface RuleMatch {
    matched: boolean;
    ruleId?: string;
    response?: string;
    actions?: any[];
    confidence?: number;
}

export function matchRule(message: string, context?: any): RuleMatch {
    const lowerMsg = message.toLowerCase().trim();

    // Try to match each rule pattern
    for (const rule of RULE_PATTERNS) {
        for (const pattern of rule.patterns) {
            if (lowerMsg.includes(pattern.toLowerCase())) {
                // Extract target if needed
                const response = interpolateResponse(rule.response, lowerMsg, context);
                const actions = interpolateActions(rule.actions || [], lowerMsg, context);

                return {
                    matched: true,
                    ruleId: rule.id,
                    response,
                    actions,
                    confidence: rule.confidence
                };
            }
        }
    }

    return { matched: false };
}

function interpolateResponse(template: string, message: string, context?: any): string {
    let result = template;

    // Replace {entityCount}
    if (result.includes('{entityCount}')) {
        const count = context?.entities?.length || 0;
        result = result.replace('{entityCount}', count.toString());
    }

    // Replace {alertCount}
    if (result.includes('{alertCount}')) {
        const count = context?.alerts?.length || 0;
        result = result.replace('{alertCount}', count.toString());
    }

    // Replace {zone}
    if (result.includes('{zone}')) {
        const zone = extractTarget(message, 'zone');
        result = result.replace('{zone}', zone || 'zone-a');
    }

    // Replace {area}
    if (result.includes('{area}')) {
        const area = extractArea(message);
        result = result.replace('{area}', area || 'receiving');
    }

    return result;
}

function interpolateActions(actions: any[], message: string, context?: any): any[] {
    return actions.map(action => {
        const newAction = { ...action };

        // Interpolate target
        if (newAction.target && typeof newAction.target === 'string') {
            if (newAction.target.includes('{zone}')) {
                const zone = extractTarget(message, 'zone');
                newAction.target = zone || 'zone-a';
            }
            if (newAction.target.includes('{area}')) {
                const area = extractArea(message);
                newAction.target = area || 'receiving';
            }
        }

        return newAction;
    });
}

function extractTarget(message: string, type: 'zone' | 'entity'): string | null {
    const lowerMsg = message.toLowerCase();

    if (type === 'zone') {
        // Match "zone a", "zone-a", "zone A", etc.
        const zoneMatch = lowerMsg.match(/zone[\s-]?([a-z])/i);
        if (zoneMatch) {
            return `zone-${zoneMatch[1].toLowerCase()}`;
        }

        // Match specific zone names
        if (lowerMsg.includes('receiving')) return 'receiving';
        if (lowerMsg.includes('shipping')) return 'shipping';
        if (lowerMsg.includes('storage')) return 'storage';
    }

    return null;
}

function extractArea(message: string): string | null {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('receiving')) return 'receiving';
    if (lowerMsg.includes('shipping')) return 'shipping';
    if (lowerMsg.includes('storage')) return 'storage';
    if (lowerMsg.includes('packing')) return 'packing';

    return null;
}
