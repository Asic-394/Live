/**
 * Phase 3: Alerts, Autonomy Framework & Recommendations
 * Type definitions for alert system, autonomy framework, and recommendation engine
 */

import { AgentContext } from '../agents/SubAgent';

// ============================================================================
// Alert Types
// ============================================================================

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertCategory = 'safety' | 'maintenance' | 'inventory' | 'slotting' | 'labor';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
    id: string;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    description: string;
    detectedAt: number;
    source: string; // Which sub-agent detected it
    affectedEntities: string[];
    affectedZones: string[];
    confidence: number; // 0-1 confidence score
    impact: {
        scope: 'entity' | 'zone' | 'warehouse';
        magnitude: number; // 0-1 impact score
        timeWindow: number; // Minutes until critical
    };
    explainability: {
        dataFactors: Array<{
            factor: string;
            value: any;
            contribution: number; // 0-1 contribution to alert
        }>;
        reasoning: string; // Natural language explanation
    };
    recommendations: string[]; // Recommendation IDs
    status: AlertStatus;
}

// ============================================================================
// Explainability Types
// ============================================================================

export interface ExplainabilityData {
    alertId: string;
    summary: string; // Natural language explanation
    dataFactors: Array<{
        factor: string; // "Battery Level", "Zone Congestion"
        value: any; // Actual value
        threshold: any; // Threshold that triggered alert
        contribution: number; // 0-1 contribution to decision
        source: string; // Which sub-agent provided this
    }>;
    spatialContext: {
        affectedZones: Array<{
            zoneId: string;
            zoneName: string;
            relevance: number; // 0-1 relevance to alert
        }>;
        affectedEntities: Array<{
            entityId: string;
            entityType: string;
            status: string;
            relevance: number;
        }>;
    };
    temporalContext: {
        detectionTime: number;
        trendDirection: 'improving' | 'stable' | 'degrading';
        historicalOccurrences: number;
    };
    contributionChart: {
        labels: string[]; // Factor names
        values: number[]; // Contribution percentages
    };
}

// ============================================================================
// Recommendation Types
// ============================================================================

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Recommendation {
    id: string;
    alertId?: string; // Associated alert (if any)
    title: string;
    description: string;
    category: string; // Sub-agent domain
    priority: RecommendationPriority;
    confidence: number; // 0-1 confidence in recommendation
    impact: {
        positive: string[]; // Expected benefits
        negative: string[]; // Potential drawbacks
        metrics: Array<{
            name: string;
            current: number;
            predicted: number;
            unit: string;
        }>;
    };
    actions: Array<{
        type: string; // 'camera' | 'dispatch' | 'reallocate' | 'notify'
        target: string;
        parameters: Record<string, any>;
    }>;
    alternatives?: Recommendation[]; // Alternative approaches
    createdAt: number;
    expiresAt?: number; // Time-sensitive recommendations
}

// ============================================================================
// Autonomy Framework Types
// ============================================================================

export type AutonomyTier = 'automated' | 'semi-automated' | 'assisted';
export type ActionStatus = 'pending' | 'executing' | 'completed' | 'objected' | 'expired';

export interface ClassifiedAction {
    id: string;
    tier: AutonomyTier;
    recommendation: Recommendation;
    classification: {
        confidence: number;
        impact: number;
        reasoning: string;
    };
    gestationPeriod?: number; // Milliseconds (if automated/semi-auto)
    status: ActionStatus;
    queuedAt?: number;
    executedAt?: number;
    result?: ExecutionResult;
}

export interface ExecutionResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

// ============================================================================
// Gestation Types
// ============================================================================

export type GestationStatus = 'pending' | 'executing' | 'completed' | 'objected' | 'expired';

export interface GestationItem {
    id: string;
    action: ClassifiedAction;
    gestationPeriod: number; // Milliseconds
    queuedAt: number; // Timestamp
    executeAt: number; // queuedAt + gestationPeriod
    status: GestationStatus;
    objectionReason?: string;
    executionResult?: ExecutionResult;
}

// ============================================================================
// Outcome Tracking Types
// ============================================================================

export type OutcomeStatus = 'in-progress' | 'completed' | 'failed';

export interface Outcome {
    id: string;
    recommendationId: string;
    actionId: string;
    executedAt: number;
    completedAt?: number;
    status: OutcomeStatus;
    promised: {
        metrics: Array<{
            name: string;
            value: number;
            unit: string;
        }>;
        timeframe: number; // Minutes to achieve
    };
    achieved: {
        metrics: Array<{
            name: string;
            value: number;
            unit: string;
            variance: number; // % difference from promised
        }>;
        actualTimeframe: number;
    };
    accuracy: number; // 0-1 overall accuracy score
}

export interface OutcomeStats {
    totalOutcomes: number;
    averageAccuracy: number;
    successRate: number;
    byCategory: Record<string, { accuracy: number; count: number }>;
}

// ============================================================================
// Activity Feed Types
// ============================================================================

export type ActivityItemType = 'alert' | 'recommendation' | 'gestation' | 'outcome';
export type ActivityItemStatus = 'needs-attention' | 'monitoring' | 'handled' | 'gestation';

export interface ActivityItem {
    id: string;
    type: ActivityItemType;
    status: ActivityItemStatus;
    title: string;
    description: string;
    priority: RecommendationPriority;
    createdAt: number;
    updatedAt: number;
    relatedId: string; // Alert/Recommendation/Gestation ID
    actions: Array<{
        label: string;
        handler: string; // Action type
    }>;
}

// ============================================================================
// Sub-Agent Analysis Types (for alert detection)
// ============================================================================

export interface Issue {
    id: string;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    description: string;
    confidence: number;
    affectedEntities: string[];
    affectedZones: string[];
    dataFactors: Array<{
        factor: string;
        value: any;
        threshold?: any;
    }>;
}

export interface SubAgentAnalysis {
    agentName: string;
    issues: Issue[];
    confidence: number;
    timestamp: number;
}
