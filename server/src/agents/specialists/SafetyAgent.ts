import { SubAgent, AgentContext, SubAgentAnalysis, Issue, Recommendation } from '../SubAgent';

export class SafetyAgent extends SubAgent {
    private readonly CONGESTION_THRESHOLD = 5; // entities per zone
    private readonly PROXIMITY_THRESHOLD = 2; // distance units for near-miss detection
    private readonly SPEED_THRESHOLD = 15; // speed units for unsafe operation

    constructor() {
        super('safety', 'Monitors safety hazards, compliance, and incident prevention');
    }

    async analyze(context: AgentContext): Promise<SubAgentAnalysis> {
        const issues: Issue[] = [];
        const recommendations: Recommendation[] = [];

        const entities = context.entities || [];
        const zones = context.zones || [];
        const alerts = (context.alerts || []).filter((a: any) =>
            a.type === 'safety' || a.category === 'safety'
        );

        // Analyze congestion
        const congestionIssues = this.analyzeCongestion(entities, zones);
        issues.push(...congestionIssues);

        // Analyze proximity/near-miss risks
        const proximityIssues = this.analyzeProximity(entities);
        issues.push(...proximityIssues);

        // Analyze unsafe speeds
        const speedIssues = this.analyzeSpeed(entities);
        issues.push(...speedIssues);

        // Process existing safety alerts
        if (alerts.length > 0) {
            issues.push({
                id: 'active-safety-alerts',
                severity: 'critical',
                title: `${alerts.length} active safety alert(s)`,
                description: 'Safety alerts require immediate attention',
                suggestedActions: ['Review alerts', 'Implement safety protocols']
            });

            recommendations.push({
                id: 'address-alerts',
                priority: 'high',
                title: 'Address active safety alerts',
                description: `Investigate and resolve ${alerts.length} safety alerts immediately`,
                expectedImpact: 'Prevent potential incidents and ensure compliance'
            });
        }

        // Generate recommendations based on issues
        if (congestionIssues.length > 0) {
            recommendations.push({
                id: 'reduce-congestion',
                priority: 'high',
                title: 'Reduce zone congestion',
                description: 'Redistribute traffic to prevent collision risks in congested zones',
                expectedImpact: 'Reduce collision risk and improve safety compliance'
            });
        }

        if (proximityIssues.length > 0) {
            recommendations.push({
                id: 'implement-spacing',
                priority: 'high',
                title: 'Enforce safety spacing',
                description: 'Implement automated spacing controls to prevent near-miss incidents',
                expectedImpact: 'Prevent collisions and improve worker safety'
            });
        }

        const summary = this.generateSummary(entities.length, issues, alerts.length);

        return {
            agentId: this.agentId,
            summary,
            issues,
            recommendations,
            confidence: entities.length > 0 ? 0.85 : 0.6
        };
    }

    private analyzeCongestion(entities: any[], zones: any[]): Issue[] {
        const issues: Issue[] = [];

        // Group entities by zone
        const entitiesByZone = new Map<string, any[]>();

        entities.forEach(entity => {
            const zoneId = entity.zone || entity.location?.zone || 'unknown';
            if (!entitiesByZone.has(zoneId)) {
                entitiesByZone.set(zoneId, []);
            }
            entitiesByZone.get(zoneId)!.push(entity);
        });

        // Check for congestion
        const congestedZones: string[] = [];
        entitiesByZone.forEach((zoneEntities, zoneId) => {
            if (zoneEntities.length > this.CONGESTION_THRESHOLD) {
                congestedZones.push(zoneId);
            }
        });

        if (congestedZones.length > 0) {
            issues.push({
                id: 'zone-congestion',
                severity: 'warning',
                title: `${congestedZones.length} congested zone(s) detected`,
                description: `Zones with more than ${this.CONGESTION_THRESHOLD} entities pose collision risks`,
                affectedEntities: congestedZones,
                suggestedActions: ['Redirect traffic', 'Implement traffic control', 'Reduce zone activity']
            });
        }

        return issues;
    }

    private analyzeProximity(entities: any[]): Issue[] {
        const issues: Issue[] = [];
        const nearMissPairs: Array<[string, string]> = [];

        // Check for entities that are too close to each other
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entity1 = entities[i];
                const entity2 = entities[j];

                const distance = this.calculateDistance(entity1, entity2);

                if (distance !== null && distance < this.PROXIMITY_THRESHOLD) {
                    nearMissPairs.push([entity1.id, entity2.id]);
                }
            }
        }

        if (nearMissPairs.length > 0) {
            issues.push({
                id: 'proximity-risk',
                severity: 'warning',
                title: `${nearMissPairs.length} near-miss situation(s) detected`,
                description: `Entities operating within ${this.PROXIMITY_THRESHOLD} units of each other`,
                affectedEntities: Array.from(new Set(nearMissPairs.flat())),
                suggestedActions: ['Increase spacing', 'Reduce speeds in area', 'Implement collision avoidance']
            });
        }

        return issues;
    }

    private analyzeSpeed(entities: any[]): Issue[] {
        const issues: Issue[] = [];

        const highSpeedEntities = entities.filter(e =>
            e.speed !== undefined && e.speed > this.SPEED_THRESHOLD
        );

        if (highSpeedEntities.length > 0) {
            issues.push({
                id: 'unsafe-speed',
                severity: 'warning',
                title: `${highSpeedEntities.length} entity(ies) exceeding safe speed`,
                description: `Entities operating above ${this.SPEED_THRESHOLD} speed units pose safety risks`,
                affectedEntities: highSpeedEntities.map(e => e.id),
                suggestedActions: ['Reduce speed limits', 'Implement speed governors', 'Review operator training']
            });
        }

        return issues;
    }

    private calculateDistance(entity1: any, entity2: any): number | null {
        const pos1 = entity1.position || entity1.location;
        const pos2 = entity2.position || entity2.location;

        if (!pos1 || !pos2) return null;

        const dx = (pos1.x || 0) - (pos2.x || 0);
        const dy = (pos1.y || 0) - (pos2.y || 0);
        const dz = (pos1.z || 0) - (pos2.z || 0);

        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private generateSummary(entityCount: number, issues: Issue[], alertCount: number): string {
        const parts: string[] = [];

        parts.push(`Monitoring ${entityCount} entities`);

        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;

        if (criticalCount > 0) {
            parts.push(`🚨 ${criticalCount} critical safety issue(s)`);
        } else if (warningCount > 0) {
            parts.push(`⚠️ ${warningCount} safety warning(s)`);
        } else if (alertCount > 0) {
            parts.push(`${alertCount} alert(s) active`);
        } else {
            parts.push('No safety issues detected');
        }

        return parts.join(' | ');
    }
}
