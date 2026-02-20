import { SubAgent, AgentContext, SubAgentAnalysis, Issue, Recommendation } from '../SubAgent';

export class LaborAgent extends SubAgent {
    private readonly LOW_UTILIZATION_THRESHOLD = 50; // percentage
    private readonly HIGH_UTILIZATION_THRESHOLD = 90; // percentage
    private readonly LOW_PRODUCTIVITY_THRESHOLD = 70; // percentage

    constructor() {
        super('labor', 'Manages worker allocation, productivity, and scheduling optimization');
    }

    async analyze(context: AgentContext): Promise<SubAgentAnalysis> {
        const issues: Issue[] = [];
        const recommendations: Recommendation[] = [];

        // Filter worker entities
        const workers = (context.entities || []).filter((e: any) =>
            e.type === 'worker' || e.type === 'operator' || e.type === 'staff'
        );

        if (workers.length === 0) {
            return {
                agentId: this.agentId,
                summary: 'No worker data available for analysis',
                issues: [],
                recommendations: [],
                confidence: 0.5
            };
        }

        // Analyze worker utilization
        const utilizationIssues = this.analyzeUtilization(workers, context.metrics);
        issues.push(...utilizationIssues);

        // Analyze productivity
        if (context.metrics?.productivity !== undefined) {
            const productivity = context.metrics.productivity;

            if (productivity < this.LOW_PRODUCTIVITY_THRESHOLD) {
                issues.push({
                    id: 'low-productivity',
                    severity: 'warning',
                    title: 'Below-target productivity detected',
                    description: `Current productivity at ${productivity.toFixed(1)}% is below ${this.LOW_PRODUCTIVITY_THRESHOLD}% target`,
                    suggestedActions: ['Review task assignments', 'Identify bottlenecks', 'Provide additional training']
                });

                recommendations.push({
                    id: 'improve-productivity',
                    priority: 'medium',
                    title: 'Improve worker productivity',
                    description: 'Analyze workflow bottlenecks and optimize task assignments',
                    expectedImpact: `Potential to increase productivity by ${(this.LOW_PRODUCTIVITY_THRESHOLD - productivity).toFixed(1)}%`
                });
            }
        }

        // Analyze zone-level staffing
        const staffingIssues = this.analyzeZoneStaffing(workers, context.zones);
        issues.push(...staffingIssues);

        // Analyze worker status
        const statusIssues = this.analyzeWorkerStatus(workers);
        issues.push(...statusIssues);

        // Generate recommendations based on issues
        if (staffingIssues.length > 0) {
            recommendations.push({
                id: 'rebalance-staff',
                priority: 'medium',
                title: 'Rebalance workforce allocation',
                description: 'Redistribute workers to match zone activity levels',
                expectedImpact: 'Improve operational efficiency and reduce wait times'
            });
        }

        const summary = this.generateSummary(workers.length, context.metrics, issues);

        return {
            agentId: this.agentId,
            summary,
            issues,
            recommendations,
            confidence: workers.length > 0 ? 0.85 : 0.5
        };
    }

    private analyzeUtilization(workers: any[], metrics: any): Issue[] {
        const issues: Issue[] = [];

        // Calculate average utilization
        const utilizationValues = workers
            .map(w => w.utilization)
            .filter(u => u !== undefined);

        let avgUtilization: number;

        if (utilizationValues.length > 0) {
            avgUtilization = utilizationValues.reduce((a, b) => a + b, 0) / utilizationValues.length;
        } else if (metrics?.utilization !== undefined) {
            avgUtilization = metrics.utilization;
        } else {
            return issues; // No utilization data available
        }

        // Check for low utilization
        if (avgUtilization < this.LOW_UTILIZATION_THRESHOLD) {
            issues.push({
                id: 'low-utilization',
                severity: 'info',
                title: 'Low worker utilization detected',
                description: `Average utilization at ${avgUtilization.toFixed(1)}% suggests potential overstaffing`,
                suggestedActions: ['Review staffing levels', 'Reassign workers to high-demand areas', 'Adjust shift schedules']
            });
        }

        // Check for high utilization
        if (avgUtilization > this.HIGH_UTILIZATION_THRESHOLD) {
            issues.push({
                id: 'high-utilization',
                severity: 'warning',
                title: 'High worker utilization detected',
                description: `Average utilization at ${avgUtilization.toFixed(1)}% may lead to fatigue and errors`,
                suggestedActions: ['Add additional staff', 'Implement break rotations', 'Review workload distribution']
            });
        }

        return issues;
    }

    private analyzeZoneStaffing(workers: any[], zones: any[] | undefined): Issue[] {
        const issues: Issue[] = [];

        if (!zones || zones.length === 0) return issues;

        // Group workers by zone
        const workersByZone = new Map<string, any[]>();

        workers.forEach(worker => {
            const zoneId = worker.zone || worker.location?.zone || 'unassigned';
            if (!workersByZone.has(zoneId)) {
                workersByZone.set(zoneId, []);
            }
            workersByZone.get(zoneId)!.push(worker);
        });

        // Identify understaffed zones (zones with high activity but few workers)
        const understaffedZones: string[] = [];
        const overstaffedZones: string[] = [];

        zones.forEach(zone => {
            const zoneWorkers = workersByZone.get(zone.id) || [];
            const workerCount = zoneWorkers.length;
            const activity = zone.activity || zone.utilization || 50;

            // Simple heuristic: high activity (>70) should have at least 2 workers
            if (activity > 70 && workerCount < 2) {
                understaffedZones.push(zone.id);
            }

            // Low activity (<30) with multiple workers suggests overstaffing
            if (activity < 30 && workerCount > 2) {
                overstaffedZones.push(zone.id);
            }
        });

        if (understaffedZones.length > 0) {
            issues.push({
                id: 'understaffed-zones',
                severity: 'warning',
                title: `${understaffedZones.length} zone(s) appear understaffed`,
                description: 'High-activity zones have insufficient worker allocation',
                affectedEntities: understaffedZones,
                suggestedActions: ['Reassign workers from low-activity zones', 'Request additional staff']
            });
        }

        if (overstaffedZones.length > 0) {
            issues.push({
                id: 'overstaffed-zones',
                severity: 'info',
                title: `${overstaffedZones.length} zone(s) may be overstaffed`,
                description: 'Low-activity zones have excess worker allocation',
                affectedEntities: overstaffedZones,
                suggestedActions: ['Redistribute workers to high-demand areas']
            });
        }

        return issues;
    }

    private analyzeWorkerStatus(workers: any[]): Issue[] {
        const issues: Issue[] = [];

        // Check for workers in error or idle state
        const idleWorkers = workers.filter(w => w.status === 'idle');
        const errorWorkers = workers.filter(w => w.status === 'error' || w.status === 'offline');

        if (idleWorkers.length > workers.length * 0.3) {
            issues.push({
                id: 'excessive-idle',
                severity: 'info',
                title: `${idleWorkers.length} worker(s) currently idle`,
                description: `${((idleWorkers.length / workers.length) * 100).toFixed(1)}% of workforce is idle`,
                affectedEntities: idleWorkers.map(w => w.id),
                suggestedActions: ['Assign tasks to idle workers', 'Review task queue']
            });
        }

        if (errorWorkers.length > 0) {
            issues.push({
                id: 'worker-errors',
                severity: 'warning',
                title: `${errorWorkers.length} worker(s) in error state`,
                description: 'Workers require attention or system reset',
                affectedEntities: errorWorkers.map(w => w.id),
                suggestedActions: ['Check worker devices', 'Provide technical support']
            });
        }

        return issues;
    }

    private generateSummary(workerCount: number, metrics: any, issues: Issue[]): string {
        const parts: string[] = [];

        parts.push(`Managing ${workerCount} workers`);

        if (metrics?.utilization !== undefined) {
            parts.push(`Utilization: ${metrics.utilization.toFixed(1)}%`);
        }

        if (metrics?.productivity !== undefined) {
            parts.push(`Productivity: ${metrics.productivity.toFixed(1)}%`);
        }

        if (issues.length === 0) {
            parts.push('Workforce optimized');
        } else {
            const warningCount = issues.filter(i => i.severity === 'warning').length;
            if (warningCount > 0) {
                parts.push(`${warningCount} staffing issue(s)`);
            }
        }

        return parts.join(' | ');
    }
}
