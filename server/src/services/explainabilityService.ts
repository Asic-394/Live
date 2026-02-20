/**
 * Explainability Service
 * Provides glass-box transparency into agent reasoning
 */

import { Alert, ExplainabilityData, SubAgentAnalysis } from '../types/phase3';
import { AgentContext } from '../agents/SubAgent';

class ExplainabilityService {
    /**
     * Build explainability data for an alert
     */
    buildExplainability(
        alert: Alert,
        context: AgentContext,
        subAgentAnalysis?: SubAgentAnalysis
    ): ExplainabilityData {
        const dataFactors = this.buildDataFactors(alert, subAgentAnalysis);
        const spatialContext = this.buildSpatialContext(alert, context);
        const temporalContext = this.buildTemporalContext(alert);
        const contributionChart = this.buildContributionChart(dataFactors);
        const summary = this.generateExplanation(alert, dataFactors);

        return {
            alertId: alert.id,
            summary,
            dataFactors,
            spatialContext,
            temporalContext,
            contributionChart,
        };
    }

    /**
     * Build data factors with thresholds and contributions
     */
    private buildDataFactors(
        alert: Alert,
        subAgentAnalysis?: SubAgentAnalysis
    ): ExplainabilityData['dataFactors'] {
        const factors: ExplainabilityData['dataFactors'] = [];

        // Use existing explainability data from alert
        if (alert.explainability && alert.explainability.dataFactors) {
            for (const factor of alert.explainability.dataFactors) {
                factors.push({
                    factor: factor.factor,
                    value: factor.value,
                    threshold: this.determineThreshold(factor.factor, factor.value),
                    contribution: factor.contribution,
                    source: alert.source,
                });
            }
        }

        // Add additional factors from sub-agent analysis if available
        if (subAgentAnalysis) {
            for (const issue of subAgentAnalysis.issues) {
                for (const dataFactor of issue.dataFactors) {
                    // Check if factor already exists
                    const exists = factors.some((f) => f.factor === dataFactor.factor);
                    if (!exists) {
                        factors.push({
                            factor: dataFactor.factor,
                            value: dataFactor.value,
                            threshold: dataFactor.threshold || this.determineThreshold(dataFactor.factor, dataFactor.value),
                            contribution: 1 / (alert.explainability.dataFactors.length + 1),
                            source: subAgentAnalysis.agentName,
                        });
                    }
                }
            }
        }

        // Normalize contributions to sum to 1
        const totalContribution = factors.reduce(
            (sum, f) => sum + f.contribution,
            0
        );
        if (totalContribution > 0) {
            factors.forEach((f) => {
                f.contribution = f.contribution / totalContribution;
            });
        }

        return factors;
    }

    /**
     * Determine threshold for a factor
     */
    private determineThreshold(factor: string, value: any): any {
        const factorLower = factor.toLowerCase();

        // Battery thresholds
        if (factorLower.includes('battery')) {
            if (typeof value === 'string' && value.includes('%')) {
                return '20%'; // Low battery threshold
            }
            if (typeof value === 'number') {
                return 20;
            }
        }

        // Temperature thresholds
        if (factorLower.includes('temperature')) {
            return 75; // Degrees
        }

        // Congestion thresholds
        if (factorLower.includes('congestion')) {
            return 80; // Percentage
        }

        // Stock level thresholds
        if (factorLower.includes('stock')) {
            return 25; // Percentage
        }

        // Default: no specific threshold
        return null;
    }

    /**
     * Build spatial context (affected zones/entities)
     */
    private buildSpatialContext(
        alert: Alert,
        context: AgentContext
    ): ExplainabilityData['spatialContext'] {
        const affectedZones = alert.affectedZones.map((zoneId, index) => ({
            zoneId,
            zoneName: this.getZoneName(zoneId, context),
            relevance: 1 - index * 0.2, // First zone is most relevant
        }));

        const affectedEntities = alert.affectedEntities.map((entityId, index) => ({
            entityId,
            entityType: this.getEntityType(entityId),
            status: this.getEntityStatus(entityId, alert),
            relevance: 1 - index * 0.15,
        }));

        return {
            affectedZones,
            affectedEntities,
        };
    }

    /**
     * Get zone name from zone ID
     */
    private getZoneName(zoneId: string, context: AgentContext): string {
        // Try to extract zone name from context
        // For now, format the zone ID nicely
        return zoneId
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Get entity type from entity ID
     */
    private getEntityType(entityId: string): string {
        if (entityId.startsWith('R-')) return 'robot';
        if (entityId.startsWith('W-')) return 'worker';
        if (entityId.startsWith('E-')) return 'equipment';
        if (entityId.startsWith('P-')) return 'product';
        return 'entity';
    }

    /**
     * Get entity status from alert
     */
    private getEntityStatus(entityId: string, alert: Alert): string {
        const titleLower = alert.title.toLowerCase();
        const descLower = alert.description.toLowerCase();

        if (titleLower.includes('battery') || descLower.includes('battery')) {
            return 'low-battery';
        }
        if (titleLower.includes('collision') || descLower.includes('collision')) {
            return 'collision-risk';
        }
        if (titleLower.includes('malfunction') || descLower.includes('malfunction')) {
            return 'malfunction';
        }

        return 'active';
    }

    /**
     * Build temporal context
     */
    private buildTemporalContext(
        alert: Alert
    ): ExplainabilityData['temporalContext'] {
        return {
            detectionTime: alert.detectedAt,
            trendDirection: this.determineTrendDirection(alert),
            historicalOccurrences: 0, // Would require historical data
        };
    }

    /**
     * Determine trend direction
     */
    private determineTrendDirection(
        alert: Alert
    ): 'improving' | 'stable' | 'degrading' {
        // For now, assume degrading for critical/high alerts
        if (alert.severity === 'critical' || alert.severity === 'high') {
            return 'degrading';
        }
        return 'stable';
    }

    /**
     * Build contribution chart data
     */
    private buildContributionChart(
        dataFactors: ExplainabilityData['dataFactors']
    ): ExplainabilityData['contributionChart'] {
        const labels = dataFactors.map((f) => f.factor);
        const values = dataFactors.map((f) => Math.round(f.contribution * 100));

        return {
            labels,
            values,
        };
    }

    /**
     * Generate natural language explanation
     */
    private generateExplanation(
        alert: Alert,
        dataFactors: ExplainabilityData['dataFactors']
    ): string {
        let explanation = alert.description + ' ';

        // Add affected scope
        const entityCount = alert.affectedEntities.length;
        const zoneCount = alert.affectedZones.length;

        if (entityCount > 0) {
            explanation += `This affects ${entityCount} ${entityCount === 1 ? 'entity' : 'entities'
                }`;
            if (zoneCount > 0) {
                explanation += ` across ${zoneCount} ${zoneCount === 1 ? 'zone' : 'zones'
                    }`;
            }
            explanation += '. ';
        }

        // Add time window
        if (alert.impact.timeWindow < 60) {
            explanation += `Estimated ${alert.impact.timeWindow} minutes until critical impact. `;
        }

        // Add key factors
        if (dataFactors.length > 0) {
            const topFactors = dataFactors
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 3);

            explanation += 'Key contributing factors: ';
            explanation += topFactors
                .map((f) => {
                    let factorDesc = `${f.factor} (${f.value}`;
                    if (f.threshold) {
                        factorDesc += `, threshold: ${f.threshold}`;
                    }
                    factorDesc += ')';
                    return factorDesc;
                })
                .join(', ');
            explanation += '.';
        }

        return explanation;
    }

    /**
     * Calculate factor contributions based on deviation from threshold
     */
    calculateContributions(
        dataFactors: Array<{
            factor: string;
            value: any;
            threshold?: any;
        }>
    ): number[] {
        const contributions: number[] = [];

        for (const factor of dataFactors) {
            let contribution = 1; // Default equal contribution

            // If threshold exists, calculate based on deviation
            if (factor.threshold !== null && factor.threshold !== undefined) {
                const value = this.parseNumericValue(factor.value);
                const threshold = this.parseNumericValue(factor.threshold);

                if (value !== null && threshold !== null) {
                    const deviation = Math.abs(value - threshold) / Math.max(threshold, 1);
                    contribution = Math.min(deviation, 2); // Cap at 2x
                }
            }

            contributions.push(contribution);
        }

        // Normalize to sum to 1
        const total = contributions.reduce((sum, c) => sum + c, 0);
        return contributions.map((c) => (total > 0 ? c / total : 1 / contributions.length));
    }

    /**
     * Parse numeric value from string or number
     */
    private parseNumericValue(value: any): number | null {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            // Remove % and other units
            const cleaned = value.replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    }
}

// Export singleton instance
export const explainabilityService = new ExplainabilityService();
