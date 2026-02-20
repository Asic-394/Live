/**
 * Phase 4: KPI Analytics Service
 * Analyzes KPI spatial correlations and generates visualization recommendations
 */

import type {
    KPIData,
    WarehouseState,
    KPISpatialContext,
    AffectedZones,
    HeatMapMode,
    OverlayType,
    CameraTarget,
    Recommendation,
    ZoneData
} from '../types/phase4';
import * as llmService from './llmService';

export class KPIAnalyticsService {

    /**
     * Analyze spatial context for a KPI
     * Returns affected zones, overlay type, and camera recommendations
     */
    async analyzeSpatialContext(
        kpi: KPIData,
        warehouseState: WarehouseState
    ): Promise<KPISpatialContext> {
        // 1. Identify affected zones based on KPI category
        const affectedZones = this.identifyAffectedZones(kpi, warehouseState);

        // 2. Calculate intensity data for heat map
        const intensityData = this.calculateZoneIntensities(
            kpi,
            affectedZones,
            warehouseState
        );

        // 3. Determine optimal overlay type
        const overlayType = this.determineOverlayType(kpi.category);

        // 4. Select visualization mode based on data characteristics
        const visualizationMode = this.selectVisualizationMode(
            intensityData,
            affectedZones.primary.length + affectedZones.secondary.length
        );

        // 5. Calculate optimal camera target
        const cameraTarget = this.calculateCameraTarget(affectedZones, warehouseState);

        return {
            primaryZones: affectedZones.primary,
            secondaryZones: affectedZones.secondary,
            overlayType,
            visualizationMode,
            cameraTarget,
            intensityData,
            metadata: {
                confidence: 0.85,
                analysisTimestamp: Date.now()
            }
        };
    }

    /**
     * Identify zones affected by KPI
     */
    private identifyAffectedZones(
        kpi: KPIData,
        warehouseState: WarehouseState
    ): AffectedZones {
        // Category-specific zone identification logic
        switch (kpi.category.toLowerCase()) {
            case 'congestion':
                return this.identifyCongestionZones(kpi, warehouseState);
            case 'utilization':
                return this.identifyUtilizationZones(kpi, warehouseState);
            case 'throughput':
                return this.identifyThroughputZones(kpi, warehouseState);
            case 'safety':
                return this.identifySafetyZones(kpi, warehouseState);
            default:
                return this.identifyGenericZones(kpi, warehouseState);
        }
    }

    /**
     * Identify congestion-related zones
     */
    private identifyCongestionZones(
        kpi: KPIData,
        warehouseState: WarehouseState
    ): AffectedZones {
        const primary: string[] = [];
        const secondary: string[] = [];

        // Find zones with high entity density
        warehouseState.zones.forEach(zone => {
            const entitiesInZone = warehouseState.entities.filter(
                e => e.zoneId === zone.id
            ).length;

            const zoneArea = zone.dimensions.width * zone.dimensions.depth;
            const density = entitiesInZone / zoneArea;

            // High density zones are primary
            if (density > 0.5 || zone.metrics?.congestion && zone.metrics.congestion > 0.7) {
                primary.push(zone.id);
            }
            // Medium density zones are secondary
            else if (density > 0.2 || zone.metrics?.congestion && zone.metrics.congestion > 0.4) {
                secondary.push(zone.id);
            }
        });

        return { primary, secondary };
    }

    /**
     * Identify utilization-related zones
     */
    private identifyUtilizationZones(
        kpi: KPIData,
        warehouseState: WarehouseState
    ): AffectedZones {
        const primary: string[] = [];
        const secondary: string[] = [];

        warehouseState.zones.forEach(zone => {
            const utilization = zone.metrics?.utilization || 0;

            if (utilization > 0.8) {
                primary.push(zone.id);
            } else if (utilization > 0.5) {
                secondary.push(zone.id);
            }
        });

        return { primary, secondary };
    }

    /**
     * Identify throughput-related zones
     */
    private identifyThroughputZones(
        kpi: KPIData,
        warehouseState: WarehouseState
    ): AffectedZones {
        const primary: string[] = [];
        const secondary: string[] = [];

        warehouseState.zones.forEach(zone => {
            const throughput = zone.metrics?.throughput || 0;

            if (throughput > 0.7) {
                primary.push(zone.id);
            } else if (throughput > 0.4) {
                secondary.push(zone.id);
            }
        });

        return { primary, secondary };
    }

    /**
     * Identify safety-related zones
     */
    private identifySafetyZones(
        kpi: KPIData,
        warehouseState: WarehouseState
    ): AffectedZones {
        const primary: string[] = [];
        const secondary: string[] = [];

        warehouseState.zones.forEach(zone => {
            const safety = zone.metrics?.safety || 1.0;

            // Lower safety score = higher concern
            if (safety < 0.5) {
                primary.push(zone.id);
            } else if (safety < 0.7) {
                secondary.push(zone.id);
            }
        });

        return { primary, secondary };
    }

    /**
     * Generic zone identification based on KPI label
     */
    private identifyGenericZones(
        kpi: KPIData,
        warehouseState: WarehouseState
    ): AffectedZones {
        // Try to extract zone information from KPI label
        const zoneMatch = kpi.label.match(/zone[- ]([a-z0-9]+)/i);

        if (zoneMatch) {
            const zoneName = zoneMatch[1].toLowerCase();
            const matchedZone = warehouseState.zones.find(
                z => z.name.toLowerCase().includes(zoneName) || z.id.toLowerCase().includes(zoneName)
            );

            if (matchedZone) {
                return {
                    primary: [matchedZone.id],
                    secondary: this.getAdjacentZones(matchedZone, warehouseState.zones)
                };
            }
        }

        // Fallback: return all zones with equal weight
        return {
            primary: warehouseState.zones.slice(0, 3).map(z => z.id),
            secondary: warehouseState.zones.slice(3).map(z => z.id)
        };
    }

    /**
     * Get zones adjacent to a given zone
     */
    private getAdjacentZones(zone: ZoneData, allZones: ZoneData[]): string[] {
        const adjacentDistance = 15; // Units
        const adjacent: string[] = [];

        allZones.forEach(otherZone => {
            if (otherZone.id === zone.id) return;

            const dx = zone.position.x - otherZone.position.x;
            const dz = zone.position.z - otherZone.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < adjacentDistance) {
                adjacent.push(otherZone.id);
            }
        });

        return adjacent;
    }

    /**
     * Calculate intensity values for each zone
     */
    private calculateZoneIntensities(
        kpi: KPIData,
        affectedZones: AffectedZones,
        warehouseState: WarehouseState
    ): Record<string, number> {
        const intensities: Record<string, number> = {};

        // Primary zones get intensity based on KPI value
        affectedZones.primary.forEach(zoneId => {
            intensities[zoneId] = this.calculatePrimaryIntensity(
                kpi,
                zoneId,
                warehouseState
            );
        });

        // Secondary zones get reduced intensity
        affectedZones.secondary.forEach(zoneId => {
            intensities[zoneId] = this.calculateSecondaryIntensity(
                kpi,
                zoneId,
                warehouseState
            );
        });

        return intensities;
    }

    /**
     * Calculate primary zone intensity
     */
    private calculatePrimaryIntensity(
        kpi: KPIData,
        zoneId: string,
        warehouseState: WarehouseState
    ): number {
        const zone = warehouseState.zones.find(z => z.id === zoneId);
        if (!zone) return 0.5;

        // Use zone metrics if available
        const category = kpi.category.toLowerCase();
        if (zone.metrics) {
            if (category === 'congestion' && zone.metrics.congestion !== undefined) {
                return zone.metrics.congestion;
            }
            if (category === 'utilization' && zone.metrics.utilization !== undefined) {
                return zone.metrics.utilization;
            }
            if (category === 'throughput' && zone.metrics.throughput !== undefined) {
                return zone.metrics.throughput;
            }
            if (category === 'safety' && zone.metrics.safety !== undefined) {
                return 1 - zone.metrics.safety; // Invert safety (lower = worse)
            }
        }

        // Fallback: use KPI value
        return Math.min(1, Math.max(0, kpi.value));
    }

    /**
     * Calculate secondary zone intensity
     */
    private calculateSecondaryIntensity(
        kpi: KPIData,
        zoneId: string,
        warehouseState: WarehouseState
    ): number {
        // Secondary zones have 40-60% of primary intensity
        const primaryIntensity = this.calculatePrimaryIntensity(kpi, zoneId, warehouseState);
        return primaryIntensity * 0.5;
    }

    /**
     * Determine overlay type based on KPI category
     */
    private determineOverlayType(category: string): OverlayType {
        const cat = category.toLowerCase();

        if (cat.includes('congestion')) return 'heat_congestion';
        if (cat.includes('utilization')) return 'heat_utilization';
        if (cat.includes('throughput')) return 'heat_throughput';
        if (cat.includes('safety')) return 'heat_safety';

        // Default to congestion
        return 'heat_congestion';
    }

    /**
     * Select optimal visualization mode
     */
    private selectVisualizationMode(
        intensityData: Record<string, number>,
        zoneCount: number
    ): HeatMapMode {
        const values = Object.values(intensityData);
        const avgIntensity = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = this.calculateVariance(values);

        // High variance + few zones → Column (dramatic differences)
        if (variance > 0.3 && zoneCount <= 5) {
            return 'column';
        }

        // Many zones + medium intensity → Particle (density visualization)
        if (zoneCount > 5 && avgIntensity > 0.5) {
            return 'particle';
        }

        // Default: Gradient (universal, performant)
        return 'gradient';
    }

    /**
     * Calculate variance of values
     */
    private calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Calculate optimal camera target to frame zones
     */
    private calculateCameraTarget(
        affectedZones: AffectedZones,
        warehouseState: WarehouseState
    ): CameraTarget {
        const allZoneIds = [...affectedZones.primary, ...affectedZones.secondary];
        const zones = warehouseState.zones.filter(z => allZoneIds.includes(z.id));

        if (zones.length === 0) {
            // Fallback to default view
            return {
                position: [20, 15, 20],
                lookAt: [0, 0, 0],
                zoom: 1
            };
        }

        // Calculate bounding box
        const bounds = this.calculateBounds(zones);

        // Position camera at 45° angle above and to the side
        const center = bounds.center;
        const size = bounds.size;
        const distance = Math.max(size.x, size.z) * 1.5;

        const position: [number, number, number] = [
            center.x + distance * 0.7,
            distance * 0.8,
            center.z + distance * 0.7
        ];

        const lookAt: [number, number, number] = [center.x, 0, center.z];

        return {
            position,
            lookAt,
            zoom: 1
        };
    }

    /**
     * Calculate bounding box for zones
     */
    private calculateBounds(zones: ZoneData[]) {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        zones.forEach(zone => {
            const halfWidth = zone.dimensions.width / 2;
            const halfDepth = zone.dimensions.depth / 2;

            minX = Math.min(minX, zone.position.x - halfWidth);
            maxX = Math.max(maxX, zone.position.x + halfWidth);
            minZ = Math.min(minZ, zone.position.z - halfDepth);
            maxZ = Math.max(maxZ, zone.position.z + halfDepth);
        });

        return {
            center: {
                x: (minX + maxX) / 2,
                y: 0,
                z: (minZ + maxZ) / 2
            },
            size: {
                x: maxX - minX,
                y: 0,
                z: maxZ - minZ
            }
        };
    }

    /**
     * Generate KPI improvement recommendations
     */
    async generateRecommendations(
        kpiId: string,
        warehouseState: WarehouseState
    ): Promise<Recommendation[]> {
        // Build context for LLM
        const context = this.buildRecommendationContext(kpiId, warehouseState);

        try {
            // Use LLM to generate contextual recommendations
            const llmResponse = await llmService.chat([
                {
                    role: 'system',
                    content: 'You are a warehouse operations expert. Generate 3 actionable recommendations to improve the given KPI.'
                },
                {
                    role: 'user',
                    content: `KPI Context:\n${JSON.stringify(context, null, 2)}\n\nProvide 3 specific recommendations with estimated impact.`
                }
            ]);

            // Parse LLM response into recommendations
            return this.parseRecommendations(llmResponse);
        } catch (error) {
            console.error('Failed to generate recommendations:', error);
            // Return fallback recommendations
            return this.getFallbackRecommendations(kpiId);
        }
    }

    /**
     * Build recommendation context
     */
    private buildRecommendationContext(kpiId: string, warehouseState: WarehouseState) {
        return {
            kpiId,
            totalZones: warehouseState.zones.length,
            totalEntities: warehouseState.entities.length,
            entityBreakdown: this.getEntityBreakdown(warehouseState.entities),
            zoneMetrics: warehouseState.zones.map(z => ({
                id: z.id,
                name: z.name,
                type: z.type,
                metrics: z.metrics
            }))
        };
    }

    /**
     * Get entity breakdown by type
     */
    private getEntityBreakdown(entities: any[]) {
        const breakdown: Record<string, number> = {};
        entities.forEach(e => {
            breakdown[e.type] = (breakdown[e.type] || 0) + 1;
        });
        return breakdown;
    }

    /**
     * Parse LLM response into recommendations
     */
    private parseRecommendations(llmResponse: string): Recommendation[] {
        // Simple parsing - in production, use structured output
        const recommendations: Recommendation[] = [];

        // For now, return mock recommendations
        // TODO: Implement proper LLM response parsing
        return this.getFallbackRecommendations('default');
    }

    /**
     * Get fallback recommendations
     */
    private getFallbackRecommendations(kpiId: string): Recommendation[] {
        return [
            {
                id: `rec-${kpiId}-1`,
                title: 'Optimize Zone Allocation',
                description: 'Redistribute inventory to balance utilization across zones',
                impact: {
                    metric: 'Utilization',
                    before: 0.85,
                    after: 0.72,
                    improvement: 15
                },
                actions: [
                    {
                        type: 'reallocate',
                        label: 'Rebalance Inventory',
                        payload: { action: 'rebalance' }
                    }
                ],
                confidence: 0.75
            },
            {
                id: `rec-${kpiId}-2`,
                title: 'Increase Workforce in High-Traffic Zones',
                description: 'Deploy additional workers to congested areas',
                impact: {
                    metric: 'Congestion',
                    before: 0.78,
                    after: 0.55,
                    improvement: 30
                },
                actions: [
                    {
                        type: 'dispatch',
                        label: 'Dispatch Workers',
                        payload: { action: 'dispatch_workers' }
                    }
                ],
                confidence: 0.82
            },
            {
                id: `rec-${kpiId}-3`,
                title: 'Implement Safety Protocols',
                description: 'Add safety measures in high-risk zones',
                impact: {
                    metric: 'Safety',
                    before: 0.65,
                    after: 0.88,
                    improvement: 35
                },
                actions: [
                    {
                        type: 'notify',
                        label: 'Alert Safety Team',
                        payload: { action: 'safety_alert' }
                    }
                ],
                confidence: 0.70
            }
        ];
    }
}
