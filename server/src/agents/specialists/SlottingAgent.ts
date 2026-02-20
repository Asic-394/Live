import { SubAgent, AgentContext, SubAgentAnalysis, Issue, Recommendation } from '../SubAgent';

export class SlottingAgent extends SubAgent {
    private readonly HIGH_TRAVEL_THRESHOLD = 100; // arbitrary distance units
    private readonly LOW_EFFICIENCY_THRESHOLD = 70; // percentage

    constructor() {
        super('slotting', 'Optimizes storage locations and pick paths for efficiency');
    }

    async analyze(context: AgentContext): Promise<SubAgentAnalysis> {
        const issues: Issue[] = [];
        const recommendations: Recommendation[] = [];

        const zones = context.zones || [];
        const entities = context.entities || [];

        if (zones.length === 0) {
            return {
                agentId: this.agentId,
                summary: 'No zone data available for slotting analysis',
                issues: [],
                recommendations: [],
                confidence: 0.5
            };
        }

        // Analyze zone utilization
        const utilizationIssues = this.analyzeZoneUtilization(zones);
        issues.push(...utilizationIssues);

        // Analyze pick path efficiency
        if (context.metrics?.pickEfficiency !== undefined) {
            const pickEfficiency = context.metrics.pickEfficiency;

            if (pickEfficiency < this.LOW_EFFICIENCY_THRESHOLD) {
                issues.push({
                    id: 'low-pick-efficiency',
                    severity: 'warning',
                    title: 'Suboptimal pick path efficiency',
                    description: `Current pick efficiency at ${pickEfficiency.toFixed(1)}% is below target`,
                    suggestedActions: ['Analyze pick patterns', 'Re-slot high-velocity items']
                });

                recommendations.push({
                    id: 'optimize-slotting',
                    priority: 'medium',
                    title: 'Optimize item slotting',
                    description: 'Re-slot high-velocity items closer to shipping areas to reduce travel time',
                    expectedImpact: `Potential to improve pick efficiency by ${(100 - pickEfficiency).toFixed(1)}%`
                });
            }
        }

        // Analyze travel distance
        if (context.metrics?.travelDistance !== undefined) {
            const travelDistance = context.metrics.travelDistance;

            if (travelDistance > this.HIGH_TRAVEL_THRESHOLD) {
                issues.push({
                    id: 'high-travel-distance',
                    severity: 'info',
                    title: 'High average travel distance',
                    description: `Average travel distance of ${travelDistance.toFixed(1)} units suggests layout optimization opportunity`,
                    suggestedActions: ['Review storage layout', 'Implement zone-based picking']
                });

                recommendations.push({
                    id: 'reduce-travel',
                    priority: 'medium',
                    title: 'Reduce travel distance',
                    description: 'Implement zone-based picking strategy to minimize worker travel',
                    expectedImpact: 'Reduce labor costs and improve throughput'
                });
            }
        }

        // Identify unbalanced zones
        const unbalancedZones = this.identifyUnbalancedZones(zones);
        if (unbalancedZones.length > 0) {
            issues.push({
                id: 'unbalanced-zones',
                severity: 'info',
                title: `${unbalancedZones.length} zone(s) with unbalanced utilization`,
                description: 'Some zones are significantly over or under-utilized',
                affectedEntities: unbalancedZones.map(z => z.id),
                suggestedActions: ['Redistribute inventory', 'Adjust zone assignments']
            });

            recommendations.push({
                id: 'balance-zones',
                priority: 'low',
                title: 'Balance zone utilization',
                description: `Redistribute inventory across ${unbalancedZones.length} zones for better balance`,
                expectedImpact: 'Improve space utilization and reduce congestion'
            });
        }

        const summary = this.generateSummary(zones.length, context.metrics, issues);

        return {
            agentId: this.agentId,
            summary,
            issues,
            recommendations,
            confidence: zones.length > 0 ? 0.8 : 0.5
        };
    }

    private analyzeZoneUtilization(zones: any[]): Issue[] {
        const issues: Issue[] = [];
        const overutilizedZones = zones.filter(z =>
            z.utilization !== undefined && z.utilization > 95
        );

        if (overutilizedZones.length > 0) {
            issues.push({
                id: 'overutilized-zones',
                severity: 'warning',
                title: `${overutilizedZones.length} zone(s) near capacity`,
                description: 'Zones above 95% utilization may cause operational bottlenecks',
                affectedEntities: overutilizedZones.map(z => z.id),
                suggestedActions: ['Expand zone capacity', 'Redistribute to adjacent zones']
            });
        }

        return issues;
    }

    private identifyUnbalancedZones(zones: any[]): any[] {
        if (zones.length < 2) return [];

        const utilizationValues = zones
            .map(z => z.utilization)
            .filter(u => u !== undefined);

        if (utilizationValues.length === 0) return [];

        const avgUtilization = utilizationValues.reduce((a, b) => a + b, 0) / utilizationValues.length;
        const threshold = 30; // 30% deviation from average

        return zones.filter(z =>
            z.utilization !== undefined &&
            Math.abs(z.utilization - avgUtilization) > threshold
        );
    }

    private generateSummary(zoneCount: number, metrics: any, issues: Issue[]): string {
        const parts: string[] = [];

        parts.push(`Analyzing ${zoneCount} zones`);

        if (metrics?.pickEfficiency !== undefined) {
            parts.push(`Pick efficiency: ${metrics.pickEfficiency.toFixed(1)}%`);
        }

        if (issues.length === 0) {
            parts.push('Layout optimized');
        } else {
            const warningCount = issues.filter(i => i.severity === 'warning').length;
            if (warningCount > 0) {
                parts.push(`${warningCount} optimization opportunity(ies)`);
            }
        }

        return parts.join(' | ');
    }
}
