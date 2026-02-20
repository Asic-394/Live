/**
 * Recommendation Engine
 * Generates actionable recommendations with impact analysis
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Recommendation,
    Alert,
    SubAgentAnalysis,
    RecommendationPriority,
} from '../types/phase3';
import { AgentContext } from '../agents/SubAgent';
import * as llmService from '../services/llmService';

class RecommendationEngine {
    private recommendations: Map<string, Recommendation> = new Map();

    /**
     * Generate recommendations from alert
     */
    async generateRecommendations(
        alert: Alert,
        context: AgentContext
    ): Promise<Recommendation[]> {
        const recommendations: Recommendation[] = [];

        // Generate primary recommendation based on alert category
        const primary = await this.generatePrimaryRecommendation(alert, context);
        recommendations.push(primary);

        // Generate 1-2 alternative recommendations
        const alternatives = await this.generateAlternatives(primary, context);
        primary.alternatives = alternatives;
        recommendations.push(...alternatives);

        // Store all recommendations
        for (const rec of recommendations) {
            this.recommendations.set(rec.id, rec);
        }

        return recommendations;
    }

    /**
     * Generate primary recommendation for an alert
     */
    private async generatePrimaryRecommendation(
        alert: Alert,
        context: AgentContext
    ): Promise<Recommendation> {
        // Generate recommendation based on alert category
        let recommendation: Recommendation;

        switch (alert.category) {
            case 'maintenance':
                recommendation = this.generateMaintenanceRecommendation(alert, context);
                break;
            case 'safety':
                recommendation = this.generateSafetyRecommendation(alert, context);
                break;
            case 'inventory':
                recommendation = this.generateInventoryRecommendation(alert, context);
                break;
            case 'slotting':
                recommendation = this.generateSlottingRecommendation(alert, context);
                break;
            case 'labor':
                recommendation = this.generateLaborRecommendation(alert, context);
                break;
            default:
                recommendation = this.generateGenericRecommendation(alert, context);
        }

        // Calculate impact metrics
        recommendation.impact.metrics = this.calculateImpactMetrics(
            recommendation,
            context
        );

        return recommendation;
    }

    /**
     * Generate maintenance recommendation
     */
    private generateMaintenanceRecommendation(
        alert: Alert,
        context: AgentContext
    ): Recommendation {
        const isLowBattery = alert.title.toLowerCase().includes('battery');
        const affectedEntities = alert.affectedEntities;

        return {
            id: uuidv4(),
            alertId: alert.id,
            title: isLowBattery
                ? 'Route Robots to Charging Stations'
                : 'Dispatch Maintenance to Affected Equipment',
            description: isLowBattery
                ? `Send ${affectedEntities.length} robot(s) to nearest charging stations to prevent operational disruption.`
                : `Dispatch maintenance team to inspect and repair affected equipment.`,
            category: 'maintenance',
            priority: alert.severity as RecommendationPriority,
            confidence: alert.confidence * 0.9, // Slightly lower than alert confidence
            impact: {
                positive: isLowBattery
                    ? [
                        'Prevent operational downtime',
                        'Maintain zone operations',
                        'Extend robot lifespan',
                    ]
                    : ['Prevent equipment failure', 'Maintain operational efficiency'],
                negative: isLowBattery
                    ? ['Temporary capacity reduction during charging']
                    : ['Maintenance cost', 'Temporary equipment unavailability'],
                metrics: [], // Will be calculated
            },
            actions: isLowBattery
                ? affectedEntities.map((entityId) => ({
                    type: 'dispatch',
                    target: entityId,
                    parameters: {
                        destination: 'charging-station',
                        priority: 'high',
                    },
                }))
                : [
                    {
                        type: 'notify',
                        target: 'maintenance-team',
                        parameters: {
                            message: alert.description,
                            priority: alert.severity,
                            affectedEntities,
                        },
                    },
                ],
            createdAt: Date.now(),
            expiresAt: Date.now() + alert.impact.timeWindow * 60 * 1000,
        };
    }

    /**
     * Generate safety recommendation
     */
    private generateSafetyRecommendation(
        alert: Alert,
        context: AgentContext
    ): Recommendation {
        return {
            id: uuidv4(),
            alertId: alert.id,
            title: 'Navigate to Safety Hazard and Alert Personnel',
            description: `Focus camera on affected zone and notify safety team immediately.`,
            category: 'safety',
            priority: 'critical',
            confidence: alert.confidence,
            impact: {
                positive: [
                    'Prevent safety incidents',
                    'Enable immediate response',
                    'Document hazard location',
                ],
                negative: ['Requires immediate attention'],
                metrics: [],
            },
            actions: [
                {
                    type: 'camera',
                    target: alert.affectedZones[0] || 'warehouse',
                    parameters: {
                        focus: true,
                        highlight: alert.affectedEntities,
                    },
                },
                {
                    type: 'notify',
                    target: 'safety-team',
                    parameters: {
                        message: alert.description,
                        priority: 'critical',
                        affectedZones: alert.affectedZones,
                    },
                },
            ],
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        };
    }

    /**
     * Generate inventory recommendation
     */
    private generateInventoryRecommendation(
        alert: Alert,
        context: AgentContext
    ): Recommendation {
        const isStockout = alert.title.toLowerCase().includes('stock');
        const isOverstock = alert.title.toLowerCase().includes('overstock');

        return {
            id: uuidv4(),
            alertId: alert.id,
            title: isStockout
                ? 'Initiate Inventory Replenishment'
                : isOverstock
                    ? 'Reallocate Excess Inventory'
                    : 'Adjust Inventory Levels',
            description: isStockout
                ? 'Order replenishment for low-stock items to prevent stockouts.'
                : isOverstock
                    ? 'Redistribute excess inventory to optimize storage.'
                    : 'Adjust inventory levels to maintain optimal stock.',
            category: 'inventory',
            priority: alert.severity as RecommendationPriority,
            confidence: alert.confidence * 0.85,
            impact: {
                positive: isStockout
                    ? ['Prevent stockouts', 'Maintain order fulfillment']
                    : ['Optimize storage space', 'Reduce holding costs'],
                negative: isStockout
                    ? ['Replenishment cost', 'Lead time required']
                    : ['Reallocation effort'],
                metrics: [],
            },
            actions: [
                {
                    type: 'reallocate',
                    target: alert.affectedZones[0] || 'warehouse',
                    parameters: {
                        action: isStockout ? 'replenish' : 'redistribute',
                        affectedEntities: alert.affectedEntities,
                    },
                },
            ],
            createdAt: Date.now(),
        };
    }

    /**
     * Generate slotting recommendation
     */
    private generateSlottingRecommendation(
        alert: Alert,
        context: AgentContext
    ): Recommendation {
        return {
            id: uuidv4(),
            alertId: alert.id,
            title: 'Optimize Slotting Configuration',
            description: 'Reorganize product placement to improve picking efficiency.',
            category: 'slotting',
            priority: alert.severity as RecommendationPriority,
            confidence: alert.confidence * 0.8,
            impact: {
                positive: [
                    'Improve picking efficiency',
                    'Reduce travel time',
                    'Optimize space utilization',
                ],
                negative: ['Reorganization effort', 'Temporary disruption'],
                metrics: [],
            },
            actions: [
                {
                    type: 'reallocate',
                    target: alert.affectedZones[0] || 'warehouse',
                    parameters: {
                        action: 'optimize-slotting',
                        affectedZones: alert.affectedZones,
                    },
                },
            ],
            createdAt: Date.now(),
        };
    }

    /**
     * Generate labor recommendation
     */
    private generateLaborRecommendation(
        alert: Alert,
        context: AgentContext
    ): Recommendation {
        const isUnderstaffed = alert.title.toLowerCase().includes('understaff');

        return {
            id: uuidv4(),
            alertId: alert.id,
            title: isUnderstaffed
                ? 'Reallocate Workers to High-Demand Zones'
                : 'Optimize Labor Distribution',
            description: isUnderstaffed
                ? 'Redistribute workers from low-activity zones to high-demand areas.'
                : 'Adjust labor allocation to match workload distribution.',
            category: 'labor',
            priority: alert.severity as RecommendationPriority,
            confidence: alert.confidence * 0.85,
            impact: {
                positive: [
                    'Improve productivity',
                    'Reduce bottlenecks',
                    'Balance workload',
                ],
                negative: ['Requires coordination', 'Potential worker disruption'],
                metrics: [],
            },
            actions: [
                {
                    type: 'reallocate',
                    target: alert.affectedZones[0] || 'warehouse',
                    parameters: {
                        action: 'reallocate-workers',
                        affectedZones: alert.affectedZones,
                    },
                },
            ],
            createdAt: Date.now(),
        };
    }

    /**
     * Generate generic recommendation
     */
    private generateGenericRecommendation(
        alert: Alert,
        context: AgentContext
    ): Recommendation {
        return {
            id: uuidv4(),
            alertId: alert.id,
            title: 'Investigate and Address Issue',
            description: alert.description,
            category: alert.category,
            priority: alert.severity as RecommendationPriority,
            confidence: alert.confidence * 0.7,
            impact: {
                positive: ['Resolve identified issue'],
                negative: ['Requires investigation'],
                metrics: [],
            },
            actions: [
                {
                    type: 'notify',
                    target: 'operations-team',
                    parameters: {
                        message: alert.description,
                        priority: alert.severity,
                    },
                },
            ],
            createdAt: Date.now(),
        };
    }

    /**
     * Calculate impact metrics for a recommendation
     */
    private calculateImpactMetrics(
        recommendation: Recommendation,
        context: AgentContext
    ): Recommendation['impact']['metrics'] {
        const metrics: Recommendation['impact']['metrics'] = [];

        // Generate metrics based on category
        switch (recommendation.category) {
            case 'maintenance':
                if (recommendation.title.includes('Battery')) {
                    metrics.push({
                        name: 'Robot Uptime',
                        current: 92,
                        predicted: 98,
                        unit: '%',
                    });
                    metrics.push({
                        name: 'Available Capacity',
                        current: 100,
                        predicted: 85,
                        unit: '%',
                    });
                }
                break;

            case 'safety':
                metrics.push({
                    name: 'Safety Incidents',
                    current: 1,
                    predicted: 0,
                    unit: 'count',
                });
                break;

            case 'inventory':
                metrics.push({
                    name: 'Stock Level',
                    current: 15,
                    predicted: 85,
                    unit: '%',
                });
                metrics.push({
                    name: 'Order Fulfillment',
                    current: 88,
                    predicted: 98,
                    unit: '%',
                });
                break;

            case 'slotting':
                metrics.push({
                    name: 'Picking Efficiency',
                    current: 75,
                    predicted: 88,
                    unit: '%',
                });
                metrics.push({
                    name: 'Travel Time',
                    current: 100,
                    predicted: 75,
                    unit: 'relative',
                });
                break;

            case 'labor':
                metrics.push({
                    name: 'Productivity',
                    current: 80,
                    predicted: 95,
                    unit: '%',
                });
                metrics.push({
                    name: 'Workload Balance',
                    current: 65,
                    predicted: 90,
                    unit: '%',
                });
                break;
        }

        return metrics;
    }

    /**
     * Generate alternative recommendations
     */
    private async generateAlternatives(
        primaryRecommendation: Recommendation,
        context: AgentContext
    ): Promise<Recommendation[]> {
        const alternatives: Recommendation[] = [];

        // Generate one alternative with different approach
        const alternative: Recommendation = {
            ...primaryRecommendation,
            id: uuidv4(),
            title: `Alternative: ${primaryRecommendation.title}`,
            description: `Alternative approach to ${primaryRecommendation.description.toLowerCase()}`,
            confidence: primaryRecommendation.confidence * 0.8,
            priority:
                primaryRecommendation.priority === 'critical'
                    ? 'high'
                    : primaryRecommendation.priority === 'high'
                        ? 'medium'
                        : 'low',
        };

        alternatives.push(alternative);

        return alternatives;
    }

    /**
     * Generate proactive recommendations (no alert)
     */
    async generateProactiveRecommendations(
        context: AgentContext,
        subAgentAnalyses: Map<string, SubAgentAnalysis>
    ): Promise<Recommendation[]> {
        // For now, return empty array
        // Future: Analyze trends and suggest optimizations
        return [];
    }

    /**
     * Tune recommendation based on natural language input
     */
    async tuneRecommendation(
        recommendationId: string,
        tuningInput: string,
        context: AgentContext
    ): Promise<Recommendation> {
        const original = this.recommendations.get(recommendationId);
        if (!original) {
            throw new Error(`Recommendation ${recommendationId} not found`);
        }

        // Use LLM to interpret tuning input
        const prompt = `Given this recommendation:
Title: ${original.title}
Description: ${original.description}
Actions: ${JSON.stringify(original.actions, null, 2)}

The user wants to modify it with this input: "${tuningInput}"

Generate a modified recommendation that incorporates the user's request. Return a JSON object with updated title, description, and actions.`;

        try {
            const response = await llmService.chat(
                [{ role: 'user', content: prompt }],
                context
            );

            // Parse LLM response and update recommendation
            // For now, create a simple modification
            const tuned: Recommendation = {
                ...original,
                id: uuidv4(),
                title: `${original.title} (Modified)`,
                description: `${original.description} Modified based on: ${tuningInput}`,
                confidence: original.confidence * 0.9, // Slightly lower confidence for tuned recommendations
            };

            this.recommendations.set(tuned.id, tuned);
            return tuned;
        } catch (error) {
            console.error('Error tuning recommendation:', error);
            // Return original if tuning fails
            return original;
        }
    }

    /**
     * Get recommendation by ID
     */
    getRecommendationById(id: string): Recommendation | undefined {
        return this.recommendations.get(id);
    }

    /**
     * Clear all recommendations (for testing)
     */
    clearRecommendations(): void {
        this.recommendations.clear();
    }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
