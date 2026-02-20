/**
 * Outcome Tracker
 * Tracks promised vs. achieved metrics for executed recommendations
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Outcome,
    OutcomeStats,
    Recommendation,
    ClassifiedAction,
    OutcomeStatus,
} from '../types/phase3';

class OutcomeTracker {
    private outcomes: Map<string, Outcome> = new Map();

    /**
     * Start tracking an executed action
     */
    startTracking(
        recommendation: Recommendation,
        action: ClassifiedAction
    ): Outcome {
        const outcome: Outcome = {
            id: uuidv4(),
            recommendationId: recommendation.id,
            actionId: action.id,
            executedAt: Date.now(),
            status: 'in-progress',
            promised: {
                metrics: recommendation.impact.metrics.map((m) => ({
                    name: m.name,
                    value: m.predicted,
                    unit: m.unit,
                })),
                timeframe: this.estimateTimeframe(recommendation),
            },
            achieved: {
                metrics: [],
                actualTimeframe: 0,
            },
            accuracy: 0,
        };

        this.outcomes.set(outcome.id, outcome);

        // Schedule automatic completion check
        const timeframeMs = outcome.promised.timeframe * 60 * 1000;
        setTimeout(() => {
            this.checkCompletion(outcome.id);
        }, timeframeMs);

        console.log(
            `[OutcomeTracker] Started tracking outcome ${outcome.id} for recommendation ${recommendation.id}`
        );

        return outcome;
    }

    /**
     * Estimate timeframe for recommendation completion (in minutes)
     */
    private estimateTimeframe(recommendation: Recommendation): number {
        // Use expiration time if available
        if (recommendation.expiresAt) {
            const remainingMs = recommendation.expiresAt - Date.now();
            return Math.max(Math.floor(remainingMs / (60 * 1000)), 5);
        }

        // Estimate based on category
        const timeframeByCategory: Record<string, number> = {
            safety: 5, // 5 minutes
            maintenance: 30, // 30 minutes
            inventory: 60, // 1 hour
            slotting: 120, // 2 hours
            labor: 45, // 45 minutes
        };

        return timeframeByCategory[recommendation.category] || 30;
    }

    /**
     * Update outcome with achieved metrics
     */
    updateOutcome(
        outcomeId: string,
        achievedMetrics: Outcome['achieved']['metrics']
    ): Outcome {
        const outcome = this.outcomes.get(outcomeId);
        if (!outcome) {
            throw new Error(`Outcome ${outcomeId} not found`);
        }

        outcome.achieved.metrics = achievedMetrics;
        outcome.achieved.actualTimeframe = Math.floor(
            (Date.now() - outcome.executedAt) / (60 * 1000)
        );

        // Calculate accuracy
        outcome.accuracy = this.calculateAccuracy(
            outcome.promised.metrics,
            outcome.achieved.metrics
        );

        // Update status
        if (outcome.accuracy >= 0.7) {
            outcome.status = 'completed';
        } else {
            outcome.status = 'failed';
        }

        outcome.completedAt = Date.now();

        console.log(
            `[OutcomeTracker] Updated outcome ${outcomeId} with accuracy ${(
                outcome.accuracy * 100
            ).toFixed(1)}%`
        );

        return outcome;
    }

    /**
     * Calculate accuracy score
     */
    private calculateAccuracy(
        promised: Outcome['promised']['metrics'],
        achieved: Outcome['achieved']['metrics']
    ): number {
        if (achieved.length === 0) {
            return 0;
        }

        let totalAccuracy = 0;
        let matchedMetrics = 0;

        for (const promisedMetric of promised) {
            const achievedMetric = achieved.find(
                (a) => a.name === promisedMetric.name
            );
            if (!achievedMetric) {
                continue;
            }

            // Calculate accuracy for this metric
            const promisedValue = promisedMetric.value;
            const achievedValue = achievedMetric.value;

            // Handle zero values
            if (promisedValue === 0 && achievedValue === 0) {
                totalAccuracy += 1;
                matchedMetrics++;
                continue;
            }

            // Calculate percentage difference
            const difference = Math.abs(achievedValue - promisedValue);
            const baseline = Math.abs(promisedValue);
            const percentDiff = baseline > 0 ? difference / baseline : 1;

            // Convert to accuracy (1 - percentDiff, capped at 0)
            const metricAccuracy = Math.max(1 - percentDiff, 0);

            totalAccuracy += metricAccuracy;
            matchedMetrics++;
        }

        return matchedMetrics > 0 ? totalAccuracy / matchedMetrics : 0;
    }

    /**
     * Check completion and auto-update if possible
     */
    private async checkCompletion(outcomeId: string): Promise<void> {
        const outcome = this.outcomes.get(outcomeId);
        if (!outcome || outcome.status !== 'in-progress') {
            return;
        }

        // In a real implementation, this would query the warehouse state
        // to get actual achieved metrics. For now, simulate with mock data.
        const achievedMetrics = this.simulateAchievedMetrics(outcome);

        this.updateOutcome(outcomeId, achievedMetrics);
    }

    /**
     * Simulate achieved metrics (for demo purposes)
     */
    private simulateAchievedMetrics(
        outcome: Outcome
    ): Outcome['achieved']['metrics'] {
        return outcome.promised.metrics.map((promised) => {
            // Simulate 80-120% achievement with some randomness
            const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            const achievedValue = promised.value * variance;
            const variancePercent =
                ((achievedValue - promised.value) / promised.value) * 100;

            return {
                name: promised.name,
                value: Math.round(achievedValue * 100) / 100,
                unit: promised.unit,
                variance: Math.round(variancePercent * 100) / 100,
            };
        });
    }

    /**
     * Get outcome statistics
     */
    getOutcomeStats(filters?: {
        category?: string;
        timeRange?: [number, number];
    }): OutcomeStats {
        let outcomes = Array.from(this.outcomes.values());

        // Apply filters
        if (filters) {
            if (filters.timeRange) {
                const [start, end] = filters.timeRange;
                outcomes = outcomes.filter(
                    (o) => o.executedAt >= start && o.executedAt <= end
                );
            }
        }

        // Calculate overall stats
        const completedOutcomes = outcomes.filter(
            (o) => o.status === 'completed' || o.status === 'failed'
        );

        const totalOutcomes = completedOutcomes.length;
        const successfulOutcomes = completedOutcomes.filter(
            (o) => o.status === 'completed'
        ).length;

        const averageAccuracy =
            totalOutcomes > 0
                ? completedOutcomes.reduce((sum, o) => sum + o.accuracy, 0) /
                totalOutcomes
                : 0;

        const successRate = totalOutcomes > 0 ? successfulOutcomes / totalOutcomes : 0;

        // Calculate by category (would need recommendation data)
        const byCategory: Record<string, { accuracy: number; count: number }> = {};

        // For now, return mock category data
        byCategory['maintenance'] = { accuracy: 0.92, count: 8 };
        byCategory['safety'] = { accuracy: 0.85, count: 5 };
        byCategory['inventory'] = { accuracy: 0.9, count: 7 };
        byCategory['slotting'] = { accuracy: 0.8, count: 3 };
        byCategory['labor'] = { accuracy: 0.88, count: 2 };

        return {
            totalOutcomes,
            averageAccuracy,
            successRate,
            byCategory,
        };
    }

    /**
     * Get all outcomes
     */
    getOutcomes(filters?: {
        status?: OutcomeStatus[];
        minAccuracy?: number;
        timeRange?: [number, number];
    }): Outcome[] {
        let outcomes = Array.from(this.outcomes.values());

        if (filters) {
            if (filters.status && filters.status.length > 0) {
                outcomes = outcomes.filter((o) => filters.status!.includes(o.status));
            }
            if (filters.minAccuracy !== undefined) {
                outcomes = outcomes.filter((o) => o.accuracy >= filters.minAccuracy!);
            }
            if (filters.timeRange) {
                const [start, end] = filters.timeRange;
                outcomes = outcomes.filter(
                    (o) => o.executedAt >= start && o.executedAt <= end
                );
            }
        }

        // Sort by execution time (most recent first)
        outcomes.sort((a, b) => b.executedAt - a.executedAt);

        return outcomes;
    }

    /**
     * Get outcome by ID
     */
    getOutcomeById(outcomeId: string): Outcome | undefined {
        return this.outcomes.get(outcomeId);
    }

    /**
     * Clear all outcomes (for testing)
     */
    clearOutcomes(): void {
        this.outcomes.clear();
    }
}

// Export singleton instance
export const outcomeTracker = new OutcomeTracker();
