/**
 * Alert Detection Service
 * Detects, classifies, and prioritizes warehouse issues from sub-agent analyses
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Alert,
    AlertSeverity,
    AlertStatus,
    SubAgentAnalysis,
    Issue,
    ExplainabilityData,
} from '../types/phase3';
import { AgentContext } from '../agents/SubAgent';

class AlertDetectionService {
    private alerts: Map<string, Alert> = new Map();

    /**
     * Analyze sub-agent results and detect alerts
     */
    async detectAlerts(
        context: AgentContext,
        subAgentAnalyses: Map<string, SubAgentAnalysis>
    ): Promise<Alert[]> {
        const detectedAlerts: Alert[] = [];
        const allIssues: Issue[] = [];

        // Extract all issues from sub-agent analyses
        for (const [agentName, analysis] of subAgentAnalyses.entries()) {
            allIssues.push(...analysis.issues);
        }

        // Deduplicate similar issues
        const uniqueIssues = this.deduplicateIssues(allIssues);

        // Create alerts from unique issues
        for (const issue of uniqueIssues) {
            const alert = await this.createAlert(issue, context);
            this.alerts.set(alert.id, alert);
            detectedAlerts.push(alert);
        }

        return detectedAlerts;
    }

    /**
     * Create an alert from an issue
     */
    private async createAlert(issue: Issue, context: AgentContext): Promise<Alert> {
        const severity = this.classifySeverity(issue, context);
        const impact = this.calculateImpact(issue, context);
        const explainability = this.buildExplainability(issue, context);

        const alert: Alert = {
            id: uuidv4(),
            severity,
            category: issue.category,
            title: issue.title,
            description: issue.description,
            detectedAt: Date.now(),
            source: issue.category, // Sub-agent name
            affectedEntities: issue.affectedEntities,
            affectedZones: issue.affectedZones,
            confidence: issue.confidence,
            impact,
            explainability,
            recommendations: [], // Will be populated by recommendation engine
            status: 'active',
        };

        return alert;
    }

    /**
     * Classify alert severity based on impact and urgency
     */
    private classifySeverity(issue: Issue, context: AgentContext): AlertSeverity {
        // Use the issue's severity if already classified
        if (issue.severity) {
            return issue.severity;
        }

        // Calculate based on confidence and affected scope
        const entityCount = issue.affectedEntities.length;
        const zoneCount = issue.affectedZones.length;
        const confidence = issue.confidence;

        // Critical: High confidence + multiple zones OR safety category
        if (issue.category === 'safety' && confidence > 0.8) {
            return 'critical';
        }
        if (confidence > 0.9 && zoneCount > 2) {
            return 'critical';
        }

        // High: Medium-high confidence + significant scope
        if (confidence > 0.7 && (zoneCount > 1 || entityCount > 3)) {
            return 'high';
        }

        // Medium: Moderate confidence or scope
        if (confidence > 0.5 || entityCount > 1) {
            return 'medium';
        }

        // Low: Everything else
        return 'low';
    }

    /**
     * Calculate impact metrics for an issue
     */
    private calculateImpact(
        issue: Issue,
        context: AgentContext
    ): Alert['impact'] {
        const entityCount = issue.affectedEntities.length;
        const zoneCount = issue.affectedZones.length;

        // Determine scope
        let scope: 'entity' | 'zone' | 'warehouse';
        if (zoneCount > 2) {
            scope = 'warehouse';
        } else if (zoneCount > 0) {
            scope = 'zone';
        } else {
            scope = 'entity';
        }

        // Calculate magnitude (0-1)
        let magnitude = 0;
        if (scope === 'warehouse') {
            magnitude = 0.8 + (Math.min(zoneCount, 5) / 5) * 0.2;
        } else if (scope === 'zone') {
            magnitude = 0.4 + (Math.min(zoneCount, 3) / 3) * 0.4;
        } else {
            magnitude = Math.min(entityCount / 10, 0.4);
        }

        // Adjust by category criticality
        const criticalityMultiplier = {
            safety: 1.5,
            maintenance: 1.2,
            inventory: 1.0,
            slotting: 0.8,
            labor: 1.1,
        };
        magnitude = Math.min(
            magnitude * (criticalityMultiplier[issue.category] || 1.0),
            1.0
        );

        // Estimate time window (minutes until critical)
        let timeWindow = 60; // Default 1 hour
        if (issue.category === 'safety') {
            timeWindow = 5; // Immediate
        } else if (issue.category === 'maintenance') {
            timeWindow = 30;
        } else if (magnitude > 0.7) {
            timeWindow = 15;
        }

        return {
            scope,
            magnitude,
            timeWindow,
        };
    }

    /**
     * Build explainability data for an alert
     */
    private buildExplainability(
        issue: Issue,
        context: AgentContext
    ): Alert['explainability'] {
        // Calculate contributions for each data factor
        const totalFactors = issue.dataFactors.length;
        const baseContribution = totalFactors > 0 ? 1 / totalFactors : 0;

        const dataFactors = issue.dataFactors.map((factor) => ({
            factor: factor.factor,
            value: factor.value,
            contribution: baseContribution, // Equal contribution for now
        }));

        // Generate natural language reasoning
        const reasoning = this.generateReasoning(issue, dataFactors);

        return {
            dataFactors,
            reasoning,
        };
    }

    /**
     * Generate natural language reasoning for an alert
     */
    private generateReasoning(
        issue: Issue,
        dataFactors: Alert['explainability']['dataFactors']
    ): string {
        const factorDescriptions = dataFactors
            .map((f) => `${f.factor}: ${f.value}`)
            .join(', ');

        const entityCount = issue.affectedEntities.length;
        const zoneCount = issue.affectedZones.length;

        let reasoning = `${issue.description}. `;

        if (entityCount > 0) {
            reasoning += `This affects ${entityCount} ${entityCount === 1 ? 'entity' : 'entities'
                }`;
            if (zoneCount > 0) {
                reasoning += ` across ${zoneCount} ${zoneCount === 1 ? 'zone' : 'zones'}`;
            }
            reasoning += '. ';
        }

        if (dataFactors.length > 0) {
            reasoning += `Key factors: ${factorDescriptions}.`;
        }

        return reasoning;
    }

    /**
     * Deduplicate similar issues
     */
    private deduplicateIssues(issues: Issue[]): Issue[] {
        const uniqueIssues: Issue[] = [];
        const seenSignatures = new Set<string>();

        for (const issue of issues) {
            // Create a signature based on category, affected entities, and title
            const signature = `${issue.category}:${issue.affectedEntities.sort().join(',')}:${issue.title}`;

            if (!seenSignatures.has(signature)) {
                seenSignatures.add(signature);
                uniqueIssues.push(issue);
            } else {
                // If duplicate, merge confidence scores (take max)
                const existing = uniqueIssues.find((u) => {
                    const existingSignature = `${u.category}:${u.affectedEntities.sort().join(',')}:${u.title}`;
                    return existingSignature === signature;
                });
                if (existing && issue.confidence > existing.confidence) {
                    existing.confidence = issue.confidence;
                }
            }
        }

        return uniqueIssues;
    }

    /**
     * Update alert status
     */
    async updateAlertStatus(alertId: string, status: AlertStatus): Promise<void> {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.status = status;
        }
    }

    /**
     * Get active alerts filtered by criteria
     */
    async getActiveAlerts(filters?: {
        severity?: AlertSeverity[];
        category?: string[];
        minConfidence?: number;
    }): Promise<Alert[]> {
        let alerts = Array.from(this.alerts.values()).filter(
            (a) => a.status === 'active'
        );

        if (filters) {
            if (filters.severity && filters.severity.length > 0) {
                alerts = alerts.filter((a) => filters.severity!.includes(a.severity));
            }
            if (filters.category && filters.category.length > 0) {
                alerts = alerts.filter((a) => filters.category!.includes(a.category));
            }
            if (filters.minConfidence !== undefined) {
                alerts = alerts.filter((a) => a.confidence >= filters.minConfidence!);
            }
        }

        // Sort by severity (critical first) then by confidence
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        alerts.sort((a, b) => {
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0) return severityDiff;
            return b.confidence - a.confidence;
        });

        return alerts;
    }

    /**
     * Get alert by ID
     */
    async getAlertById(alertId: string): Promise<Alert | undefined> {
        return this.alerts.get(alertId);
    }

    /**
     * Clear all alerts (for testing)
     */
    clearAlerts(): void {
        this.alerts.clear();
    }
}

// Export singleton instance
export const alertDetectionService = new AlertDetectionService();
