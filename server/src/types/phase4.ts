/**
 * Phase 4: KPI ↔ Overlay Enhancement - Backend Types
 */

export interface WarehouseState {
    zones: ZoneData[];
    entities: EntityData[];
    cameraPosition?: {
        position: [number, number, number];
        target: [number, number, number];
    };
}

export interface ZoneData {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number; z: number };
    dimensions: { width: number; depth: number; height: number };
    metrics?: {
        congestion?: number;
        utilization?: number;
        throughput?: number;
        safety?: number;
    };
}

export interface EntityData {
    id: string;
    type: 'worker' | 'forklift' | 'pallet' | 'truck';
    position: { x: number; y: number; z: number };
    zoneId?: string;
    status?: string;
}

export interface KPIData {
    id: string;
    category: string;
    value: number;
    label: string;
    lens?: string;
    metadata?: Record<string, any>;
}

export type HeatMapMode = 'gradient' | 'column' | 'particle';

export type OverlayType =
    | 'heat_congestion'
    | 'heat_utilization'
    | 'heat_throughput'
    | 'heat_safety';

export interface AffectedZones {
    primary: string[];    // Directly affected zones
    secondary: string[];  // Indirectly affected zones
}

export interface CameraTarget {
    position: [number, number, number];
    lookAt: [number, number, number];
    zoom: number;
}

export interface KPISpatialContext {
    primaryZones: string[];
    secondaryZones: string[];
    overlayType: OverlayType;
    visualizationMode: HeatMapMode;
    cameraTarget: CameraTarget;
    intensityData: Record<string, number>;  // zoneId → 0-1
    metadata: {
        confidence: number;
        analysisTimestamp: number;
    };
}

export interface Recommendation {
    id: string;
    title: string;
    description: string;
    impact: {
        metric: string;
        before: number;
        after: number;
        improvement: number;  // percentage
    };
    actions: RecommendationAction[];
    confidence: number;
}

export interface RecommendationAction {
    type: 'camera' | 'notify' | 'dispatch' | 'reallocate';
    label: string;
    payload: Record<string, any>;
}
