import { SubAgent, AgentContext, SubAgentAnalysis, Issue, Recommendation } from '../SubAgent';

export class InventoryAgent extends SubAgent {
    private readonly LOW_STOCK_THRESHOLD = 10; // percentage
    private readonly OVERSTOCK_THRESHOLD = 90; // percentage
    private readonly LOW_TURNOVER_THRESHOLD = 0.5; // turnover rate

    constructor() {
        super('inventory', 'Tracks stock levels, forecasts demand, and manages replenishment');
    }

    async analyze(context: AgentContext): Promise<SubAgentAnalysis> {
        const issues: Issue[] = [];
        const recommendations: Recommendation[] = [];

        // Filter inventory entities
        const inventoryItems = (context.entities || []).filter((e: any) =>
            e.type === 'pallet' || e.type === 'inventory' || e.type === 'stock'
        );

        if (inventoryItems.length === 0) {
            return {
                agentId: this.agentId,
                summary: 'No inventory data available for analysis',
                issues: [],
                recommendations: [],
                confidence: 0.5
            };
        }

        // Analyze stock levels
        const lowStockItems = inventoryItems.filter((item: any) => {
            const stockLevel = this.calculateStockLevel(item);
            return stockLevel !== null && stockLevel < this.LOW_STOCK_THRESHOLD;
        });

        const overstockItems = inventoryItems.filter((item: any) => {
            const stockLevel = this.calculateStockLevel(item);
            return stockLevel !== null && stockLevel > this.OVERSTOCK_THRESHOLD;
        });

        // Low stock issues
        if (lowStockItems.length > 0) {
            issues.push({
                id: 'low-stock',
                severity: 'warning',
                title: `${lowStockItems.length} item(s) below minimum stock level`,
                description: `Items below ${this.LOW_STOCK_THRESHOLD}% stock threshold require replenishment`,
                affectedEntities: lowStockItems.map((item: any) => item.id),
                suggestedActions: ['Trigger replenishment order', 'Check supplier availability']
            });

            recommendations.push({
                id: 'replenish-stock',
                priority: 'high',
                title: 'Initiate replenishment orders',
                description: `Order stock for ${lowStockItems.length} items to prevent stockouts`,
                expectedImpact: 'Prevent stockouts and maintain service levels',
                actions: lowStockItems.map((item: any) => ({
                    type: 'inventory',
                    action: 'replenish',
                    entityId: item.id
                }))
            });
        }

        // Overstock issues
        if (overstockItems.length > 0) {
            issues.push({
                id: 'overstock',
                severity: 'info',
                title: `${overstockItems.length} item(s) above maximum stock level`,
                description: `Items above ${this.OVERSTOCK_THRESHOLD}% capacity may indicate overstock`,
                affectedEntities: overstockItems.map((item: any) => item.id),
                suggestedActions: ['Review demand forecast', 'Consider redistribution']
            });

            recommendations.push({
                id: 'optimize-stock',
                priority: 'low',
                title: 'Optimize overstocked items',
                description: `Review ${overstockItems.length} overstocked items for redistribution or promotion`,
                expectedImpact: 'Free up warehouse capacity and reduce holding costs'
            });
        }

        // Analyze turnover rate from metrics
        if (context.metrics?.turnoverRate !== undefined) {
            const turnoverRate = context.metrics.turnoverRate;

            if (turnoverRate < this.LOW_TURNOVER_THRESHOLD) {
                issues.push({
                    id: 'low-turnover',
                    severity: 'warning',
                    title: 'Low inventory turnover detected',
                    description: `Turnover rate of ${turnoverRate.toFixed(2)} is below optimal threshold`,
                    suggestedActions: ['Review slow-moving items', 'Adjust ordering strategy']
                });

                recommendations.push({
                    id: 'improve-turnover',
                    priority: 'medium',
                    title: 'Improve inventory turnover',
                    description: 'Identify and address slow-moving inventory to improve cash flow',
                    expectedImpact: 'Reduce carrying costs and improve warehouse efficiency'
                });
            }
        }

        // Calculate metrics
        const totalCapacity = this.calculateTotalCapacity(context.zones);
        const currentLevel = context.metrics?.inventoryLevel ||
            (inventoryItems.length / Math.max(totalCapacity, 1)) * 100;

        const summary = this.generateSummary(inventoryItems.length, currentLevel, issues);

        return {
            agentId: this.agentId,
            summary,
            issues,
            recommendations,
            confidence: inventoryItems.length > 0 ? 0.85 : 0.5
        };
    }

    private calculateStockLevel(item: any): number | null {
        if (item.quantity !== undefined && item.capacity !== undefined) {
            return (item.quantity / item.capacity) * 100;
        }
        if (item.stockLevel !== undefined) {
            return item.stockLevel;
        }
        return null;
    }

    private calculateTotalCapacity(zones: any[] | undefined): number {
        if (!zones) return 100;
        return zones.reduce((sum, zone) => sum + (zone.capacity || 10), 0);
    }

    private generateSummary(itemCount: number, currentLevel: number, issues: Issue[]): string {
        const parts: string[] = [];

        parts.push(`Tracking ${itemCount} inventory items`);
        parts.push(`Overall level: ${currentLevel.toFixed(1)}%`);

        if (issues.length === 0) {
            parts.push('Stock levels healthy');
        } else {
            const warningCount = issues.filter(i => i.severity === 'warning' || i.severity === 'critical').length;
            if (warningCount > 0) {
                parts.push(`⚠️ ${warningCount} stock issue(s) detected`);
            }
        }

        return parts.join(' | ');
    }
}
