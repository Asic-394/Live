import { SubAgent, AgentContext, SubAgentAnalysis, Issue, Recommendation } from '../SubAgent';

export class MaintenanceAgent extends SubAgent {
    private readonly BATTERY_LOW_THRESHOLD = 20;
    private readonly BATTERY_CRITICAL_THRESHOLD = 10;

    constructor() {
        super('maintenance', 'Monitors equipment health, battery levels, and maintenance needs');
    }

    async analyze(context: AgentContext): Promise<SubAgentAnalysis> {
        const issues: Issue[] = [];
        const recommendations: Recommendation[] = [];

        // Filter equipment entities (robots, forklifts)
        const equipment = (context.entities || []).filter((e: any) =>
            e.type === 'robot' || e.type === 'forklift' || e.type === 'equipment'
        );

        if (equipment.length === 0) {
            return {
                agentId: this.agentId,
                summary: 'No equipment data available for analysis',
                issues: [],
                recommendations: [],
                confidence: 0.5
            };
        }

        // Analyze battery levels
        const lowBatteryEntities = equipment.filter((e: any) =>
            e.battery !== undefined && e.battery < this.BATTERY_LOW_THRESHOLD
        );

        const criticalBatteryEntities = lowBatteryEntities.filter((e: any) =>
            e.battery < this.BATTERY_CRITICAL_THRESHOLD
        );

        if (criticalBatteryEntities.length > 0) {
            issues.push({
                id: 'critical-battery',
                severity: 'critical',
                title: `${criticalBatteryEntities.length} equipment unit(s) with critical battery`,
                description: `Equipment with battery below ${this.BATTERY_CRITICAL_THRESHOLD}% require immediate charging`,
                affectedEntities: criticalBatteryEntities.map((e: any) => e.id),
                suggestedActions: ['Route to charging station', 'Dispatch replacement unit']
            });

            recommendations.push({
                id: 'charge-critical',
                priority: 'high',
                title: 'Immediate charging required',
                description: `Route ${criticalBatteryEntities.map((e: any) => e.id).join(', ')} to nearest charging stations`,
                expectedImpact: 'Prevent equipment downtime and operational disruption',
                actions: criticalBatteryEntities.map((e: any) => ({
                    type: 'maintenance',
                    action: 'charge',
                    entityId: e.id
                }))
            });
        } else if (lowBatteryEntities.length > 0) {
            issues.push({
                id: 'low-battery',
                severity: 'warning',
                title: `${lowBatteryEntities.length} equipment unit(s) with low battery`,
                description: `Equipment with battery below ${this.BATTERY_LOW_THRESHOLD}% should be scheduled for charging`,
                affectedEntities: lowBatteryEntities.map((e: any) => e.id),
                suggestedActions: ['Schedule charging rotation']
            });

            recommendations.push({
                id: 'schedule-charging',
                priority: 'medium',
                title: 'Schedule charging rotation',
                description: `Plan charging for ${lowBatteryEntities.map((e: any) => e.id).join(', ')} during low-activity periods`,
                expectedImpact: 'Maintain operational readiness'
            });
        }

        // Analyze equipment status
        const errorEquipment = equipment.filter((e: any) =>
            e.status === 'error' || e.status === 'maintenance' || e.status === 'fault'
        );

        if (errorEquipment.length > 0) {
            issues.push({
                id: 'equipment-errors',
                severity: 'critical',
                title: `${errorEquipment.length} equipment unit(s) in error state`,
                description: 'Equipment requires immediate maintenance attention',
                affectedEntities: errorEquipment.map((e: any) => e.id),
                suggestedActions: ['Dispatch maintenance team', 'Run diagnostics']
            });

            recommendations.push({
                id: 'dispatch-maintenance',
                priority: 'high',
                title: 'Dispatch maintenance team',
                description: `Immediate maintenance required for ${errorEquipment.map((e: any) => e.id).join(', ')}`,
                expectedImpact: 'Restore equipment to operational status'
            });
        }

        // Calculate metrics
        const avgBattery = equipment.reduce((sum: number, e: any) =>
            sum + (e.battery || 100), 0) / equipment.length;

        const operationalCount = equipment.filter((e: any) =>
            e.status === 'active' || e.status === 'idle' || !e.status
        ).length;

        const uptime = (operationalCount / equipment.length) * 100;

        // Generate summary
        const summary = this.generateSummary(equipment.length, avgBattery, uptime, issues);

        return {
            agentId: this.agentId,
            summary,
            issues,
            recommendations,
            confidence: equipment.length > 0 ? 0.9 : 0.5
        };
    }

    private generateSummary(totalEquipment: number, avgBattery: number, uptime: number, issues: Issue[]): string {
        const parts: string[] = [];

        parts.push(`Monitoring ${totalEquipment} equipment units`);
        parts.push(`Average battery: ${avgBattery.toFixed(1)}%`);
        parts.push(`Uptime: ${uptime.toFixed(1)}%`);

        if (issues.length === 0) {
            parts.push('All equipment operational');
        } else {
            const criticalCount = issues.filter(i => i.severity === 'critical').length;
            if (criticalCount > 0) {
                parts.push(`⚠️ ${criticalCount} critical issue(s) detected`);
            }
        }

        return parts.join(' | ');
    }
}
