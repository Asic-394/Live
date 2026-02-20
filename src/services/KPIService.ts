/**
 * Phase 4: KPI Service
 * Frontend service for KPI spatial analysis and recommendations
 */

import type { KPI } from '../types';
import type {
    KPISpatialContext,
    Recommendation,
    WarehouseStatePayload,
    ZonePayload,
    EntityPayload
} from '../types/phase4';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class KPIService {
    /**
     * Analyze spatial context for a KPI
     * Returns zones, overlay type, camera target, and visualization mode
     */
    static async analyzeKPISpatialContext(
        kpi: KPI,
        warehouseState: WarehouseStatePayload
    ): Promise<KPISpatialContext> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/kpi/spatial-context`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    kpi: {
                        id: kpi.id,
                        category: this.extractCategory(kpi),
                        value: kpi.value,
                        label: kpi.label,
                    },
                    warehouseState,
                }),
            });

            if (!response.ok) {
                throw new Error(`Spatial analysis failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('KPI spatial analysis error:', error);
            // Return fallback context
            return this.getFallbackContext(kpi);
        }
    }

    /**
     * Get recommendations for KPI improvement
     */
    static async getKPIRecommendations(
        kpiId: string,
        warehouseState: WarehouseStatePayload
    ): Promise<Recommendation[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/kpi/recommendations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    kpiId,
                    warehouseState,
                }),
            });

            if (!response.ok) {
                throw new Error(`Recommendations failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.recommendations || [];
        } catch (error) {
            console.error('KPI recommendations error:', error);
            return [];
        }
    }

    /**
     * Extract category from KPI label
     */
    private static extractCategory(kpi: KPI): string {
        const label = kpi.label.toLowerCase();

        if (label.includes('congestion') || label.includes('traffic')) {
            return 'congestion';
        }
        if (label.includes('utilization') || label.includes('capacity')) {
            return 'utilization';
        }
        if (label.includes('throughput') || label.includes('flow')) {
            return 'throughput';
        }
        if (label.includes('safety') || label.includes('incident')) {
            return 'safety';
        }

        // Default based on overlay type
        if (kpi.overlayType) {
            if (kpi.overlayType.includes('congestion')) return 'congestion';
            if (kpi.overlayType.includes('utilization')) return 'utilization';
            if (kpi.overlayType.includes('throughput')) return 'throughput';
            if (kpi.overlayType.includes('safety')) return 'safety';
        }

        return 'generic';
    }

    /**
     * Get fallback context when backend is unavailable
     */
    private static getFallbackContext(kpi: KPI): KPISpatialContext {
        const category = this.extractCategory(kpi);

        return {
            primaryZones: ['zone-a'],
            secondaryZones: ['zone-b', 'zone-c'],
            overlayType: kpi.overlayType || 'heat_congestion',
            visualizationMode: 'gradient',
            cameraTarget: {
                position: [20, 15, 20],
                lookAt: [0, 0, 0],
                zoom: 1,
            },
            intensityData: {
                'zone-a': 0.8,
                'zone-b': 0.5,
                'zone-c': 0.3,
            },
            metadata: {
                confidence: 0.5,
                analysisTimestamp: Date.now(),
            },
        };
    }

    /**
     * Build warehouse state payload from current store state
     */
    static buildWarehouseStatePayload(
        zones: any[],
        entities: any[],
        cameraPosition?: { position: [number, number, number]; target: [number, number, number] }
    ): WarehouseStatePayload {
        const zonePayloads: ZonePayload[] = zones.map(zone => ({
            id: zone.element_id,
            name: zone.name || zone.element_id,
            type: zone.element_type,
            position: { x: zone.x, y: zone.y || 0, z: zone.z || 0 },
            dimensions: {
                width: zone.width,
                depth: zone.depth,
                height: zone.height || 3,
            },
            metrics: {
                // These would come from real-time data in production
                congestion: Math.random() * 0.8,
                utilization: Math.random() * 0.9,
                throughput: Math.random() * 0.7,
                safety: 0.7 + Math.random() * 0.3,
            },
        }));

        const entityPayloads: EntityPayload[] = entities.map(entity => ({
            id: entity.entity_id,
            type: entity.entity_type as any,
            position: { x: entity.x, y: entity.y || 0, z: entity.z || 0 },
            zoneId: entity.zone,
            status: entity.status,
        }));

        return {
            zones: zonePayloads,
            entities: entityPayloads,
            cameraPosition,
        };
    }
}
