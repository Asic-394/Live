/**
 * Autonomy Framework
 * Classifies actions into 3 tiers based on impact × confidence matrix
 */

import { v4 as uuidv4 } from 'uuid';
import {
    ClassifiedAction,
    Recommendation,
    AutonomyTier,
} from '../types/phase3';
import { AgentContext } from '../agents/SubAgent';

class AutonomyFramework {
    // Thresholds for autonomy classification
    private readonly CONFIDENCE_THRESHOLDS = {
        high: 0.8,
        medium: 0.5,
    };

    private readonly IMPACT_THRESHOLDS = {
        high: 0.7,
        medium: 0.4,
    };

    // Gestation periods (milliseconds)
    private readonly GESTATION_PERIODS = {
        automated: 10000, // 10 seconds
        'semi-automated': 45000, // 45 seconds
        assisted: 0, // No gestation (requires explicit approval)
    };

    /**
     * Classify a recommendation into autonomy tier
     */
    classifyAction(
        recommendation: Recommendation,
        context: AgentContext
    ): ClassifiedAction {
        const confidence = recommendation.confidence;
        const impact = this.calculateImpact(recommendation, context);
        const tier = this.determineTier(confidence, impact);
        const gestationPeriod = this.determineGestationPeriod(tier, impact);
        const reasoning = this.generateReasoning(confidence, impact, tier);

        const classifiedAction: ClassifiedAction = {
            id: uuidv4(),
            tier,
            recommendation,
            classification: {
                confidence,
                impact,
                reasoning,
            },
            gestationPeriod: tier !== 'assisted' ? gestationPeriod : undefined,
            status: 'pending',
            queuedAt: Date.now(),
        };

        return classifiedAction;
    }

    /**
     * Calculate impact score for a recommendation
     */
    private calculateImpact(
        recommendation: Recommendation,
        context: AgentContext
    ): number {
        // Impact factors (weighted)
        const factors = {
            affectedEntityCount: 0.3,
            operationalCriticality: 0.3,
            reversibility: 0.2,
            costImplication: 0.2,
        };

        // Calculate affected entity count score
        const entityCount = this.estimateAffectedEntities(recommendation);
        const entityScore = Math.min(entityCount / 10, 1.0); // Normalize to 0-1

        // Calculate operational criticality
        const criticalityScore = this.calculateCriticality(recommendation);

        // Calculate reversibility (lower reversibility = higher impact)
        const reversibilityScore = this.calculateReversibility(recommendation);

        // Calculate cost implication
        const costScore = this.calculateCostImplication(recommendation);

        // Weighted sum
        const impact =
            entityScore * factors.affectedEntityCount +
            criticalityScore * factors.operationalCriticality +
            reversibilityScore * factors.reversibility +
            costScore * factors.costImplication;

        return Math.min(impact, 1.0);
    }

    /**
     * Estimate number of affected entities
     */
    private estimateAffectedEntities(recommendation: Recommendation): number {
        // Count entities mentioned in actions
        let count = 0;
        for (const action of recommendation.actions) {
            if (action.type === 'dispatch' || action.type === 'reallocate') {
                count += 1;
            }
            if (action.parameters.entities) {
                count += action.parameters.entities.length;
            }
        }
        return Math.max(count, 1);
    }

    /**
     * Calculate operational criticality score
     */
    private calculateCriticality(recommendation: Recommendation): number {
        // Higher priority = higher criticality
        const priorityScores = {
            critical: 1.0,
            high: 0.75,
            medium: 0.5,
            low: 0.25,
        };

        let score = priorityScores[recommendation.priority] || 0.5;

        // Safety category increases criticality
        if (recommendation.category === 'safety') {
            score = Math.min(score * 1.5, 1.0);
        }

        return score;
    }

    /**
     * Calculate reversibility score (0 = irreversible, 1 = easily reversible)
     */
    private calculateReversibility(recommendation: Recommendation): number {
        // Camera movements are highly reversible
        const cameraActions = recommendation.actions.filter(
            (a) => a.type === 'camera'
        );
        if (cameraActions.length === recommendation.actions.length) {
            return 0.1; // Low impact due to high reversibility
        }

        // Notifications are reversible
        const notifyActions = recommendation.actions.filter(
            (a) => a.type === 'notify'
        );
        if (notifyActions.length > 0) {
            return 0.2;
        }

        // Dispatch and reallocation are less reversible
        const dispatchActions = recommendation.actions.filter(
            (a) => a.type === 'dispatch' || a.type === 'reallocate'
        );
        if (dispatchActions.length > 0) {
            return 0.7; // Higher impact due to lower reversibility
        }

        return 0.5; // Default moderate reversibility
    }

    /**
     * Calculate cost implication score
     */
    private calculateCostImplication(recommendation: Recommendation): number {
        // Check for cost-related metrics in impact
        const costMetrics = recommendation.impact.metrics.filter(
            (m) => m.name.toLowerCase().includes('cost') || m.unit === '$'
        );

        if (costMetrics.length === 0) {
            return 0.3; // Low cost implication
        }

        // Calculate average cost change
        let totalCostChange = 0;
        for (const metric of costMetrics) {
            const change = Math.abs(metric.predicted - metric.current);
            const percentChange = change / Math.max(metric.current, 1);
            totalCostChange += percentChange;
        }

        const avgCostChange = totalCostChange / costMetrics.length;
        return Math.min(avgCostChange, 1.0);
    }

    /**
     * Determine autonomy tier based on confidence and impact
     */
    private determineTier(confidence: number, impact: number): AutonomyTier {
        const { high: highConf, medium: medConf } = this.CONFIDENCE_THRESHOLDS;
        const { high: highImpact, medium: medImpact } = this.IMPACT_THRESHOLDS;

        // Safety check: Never automate high-impact actions
        if (impact >= highImpact) {
            if (confidence >= highConf) {
                return 'semi-automated';
            }
            return 'assisted';
        }

        // High confidence
        if (confidence >= highConf) {
            if (impact < medImpact) {
                return 'automated'; // High conf + Low impact
            }
            return 'semi-automated'; // High conf + Medium impact
        }

        // Medium confidence
        if (confidence >= medConf) {
            if (impact < medImpact) {
                return 'automated'; // Medium conf + Low impact
            }
            return 'semi-automated'; // Medium conf + Medium impact
        }

        // Low confidence - always assisted
        return 'assisted';
    }

    /**
     * Determine appropriate gestation period
     */
    private determineGestationPeriod(tier: AutonomyTier, impact: number): number {
        const basePeriod = this.GESTATION_PERIODS[tier];

        // Increase gestation period for higher impact
        if (tier === 'semi-automated' && impact > 0.6) {
            return basePeriod * 1.5; // 67.5 seconds
        }

        return basePeriod;
    }

    /**
     * Generate reasoning for classification
     */
    private generateReasoning(
        confidence: number,
        impact: number,
        tier: AutonomyTier
    ): string {
        const confLevel =
            confidence >= this.CONFIDENCE_THRESHOLDS.high
                ? 'high'
                : confidence >= this.CONFIDENCE_THRESHOLDS.medium
                    ? 'medium'
                    : 'low';

        const impactLevel =
            impact >= this.IMPACT_THRESHOLDS.high
                ? 'high'
                : impact >= this.IMPACT_THRESHOLDS.medium
                    ? 'medium'
                    : 'low';

        let reasoning = `Classified as ${tier} based on ${confLevel} confidence (${(
            confidence * 100
        ).toFixed(0)}%) and ${impactLevel} impact (${(impact * 100).toFixed(0)}%). `;

        if (tier === 'automated') {
            reasoning +=
                'This action will execute automatically after a brief gestation period unless objected.';
        } else if (tier === 'semi-automated') {
            reasoning +=
                'This action requires acknowledgment before execution due to moderate impact.';
        } else {
            reasoning +=
                'This action requires explicit approval due to high impact or low confidence.';
        }

        return reasoning;
    }

    /**
     * Check if action is safe to auto-execute
     */
    isSafeForAutomation(recommendation: Recommendation): boolean {
        // Never automate if confidence is too low
        if (recommendation.confidence < this.CONFIDENCE_THRESHOLDS.medium) {
            return false;
        }

        // Never automate critical priority actions
        if (recommendation.priority === 'critical') {
            return false;
        }

        // Only automate camera and notify actions
        const safeActionTypes = ['camera', 'notify'];
        const allActionsSafe = recommendation.actions.every((action) =>
            safeActionTypes.includes(action.type)
        );

        return allActionsSafe;
    }
}

// Export singleton instance
export const autonomyFramework = new AutonomyFramework();
