// Core types based on DataContracts.md

export type ElementType = 'zone' | 'aisle' | 'rack' | 'dock' | 'wall' | 'yard' | 'road' | 'parking' | 'gate';
export type EntityType = 'worker' | 'forklift' | 'pallet' | 'inventory' | 'truck';
export type EntityStatus = 'active' | 'idle' | 'moving' | 'error' | 'staged' | 'stored' | 'waiting' | 'standby' | 'available';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Warehouse Layout Types (from warehouse_layout.csv)
export interface WarehouseLayoutElement {
  element_type: ElementType;
  element_id: string;
  name?: string;
  x: number;
  y: number;
  z?: number;
  width: number;
  depth: number;
  height?: number;
  rotation?: number;
  capacity?: number;
  metadata?: Record<string, any>;
  hierarchy?: HierarchyInfo;
}

export interface WarehouseLayout {
  zones: WarehouseLayoutElement[];
  aisles: WarehouseLayoutElement[];
  racks: WarehouseLayoutElement[];
  docks: WarehouseLayoutElement[];
  walls: WarehouseLayoutElement[];
  yards: WarehouseLayoutElement[];
  roads: WarehouseLayoutElement[];
  parkings: WarehouseLayoutElement[];
  gates: WarehouseLayoutElement[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

// Entity State Types (from warehouse_state.csv)
export interface Entity {
  timestamp: string;
  entity_type: EntityType;
  entity_id: string;
  zone: string;
  x: number;
  y: number;
  z?: number;
  status: EntityStatus;
  task?: string;
  assigned_to?: string;
  battery_level?: number;
  speed?: number;
  metadata?: Record<string, any>;
  box_id?: string; // For items being moved
}

// Hierarchy Types
export interface HierarchyInfo {
  parent_id: string;
  parent_type: ElementType | 'box';
  path: string[]; // e.g., ['Zone-B', 'Aisle-2', 'Rack-B3']
}

// Box/Bin Types (Inventory Storage Containers)
export type BoxStatus = 'stored' | 'staged' | 'in_transit' | 'empty';

export interface BoxItem {
  sku: string;
  product_name: string;
  quantity: number;
  unit: string;
  category: string;
  weight?: number;
  received_date?: string;
}

export interface Box {
  box_id: string;
  rack_id: string;
  level: number;
  position: number; // 1-4 (boxes per level)
  x: number;
  y: number;
  z: number;
  status: BoxStatus;
  items: BoxItem[];
  capacity_used: number; // percentage
  last_updated: string;
}

// Validation Error Types
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Dataset Types
export interface Dataset {
  id: string;
  name: string;
  description: string;
  layoutPath: string;
  statePath: string;
}

// Camera types
export type CameraMode = 'orthographic' | 'perspective';

// Theme types
export type Theme = 'light' | 'dark';

// Application State (Zustand store)
export interface AppState {
  // Data state
  currentDataset: string | null;
  warehouseLayout: WarehouseLayout | null;
  entities: Entity[];
  boxes: Box[];
  inventory: Map<string, BoxItem[]>;
  loadingState: LoadingState;
  error: string | null;
  
  // Scene state
  selectedEntity: string | null;
  selectedRack: string | null; // Rack element_id
  selectedBox: string | null; // Box box_id
  cameraReset: number; // Increment to trigger camera reset
  cameraMode: CameraMode;
  
  // UI state
  theme: Theme;
  useRealShadows: boolean; // Toggle between real shadow mapping and blob shadows
  visibleEntityTypes: Set<EntityType>; // Entity types currently visible
  hierarchyExpanded: Set<string>; // Expanded nodes in hierarchy tree
  
  // Monitoring state (Slice 2)
  kpis: KPI[];
  selectedKPI: string | null;
  activeOverlay: OverlayType | null;
  overlayData: Map<OverlayType, ZoneHeatData[]>;
  drillDownData: DrillDownData | null;
  highlightedZones: Set<string>;
  focusedZone: string | null;
  
  // Actions
  loadDataset: (datasetId: string) => Promise<void>;
  resetScene: () => void;
  selectEntity: (entityId: string | null) => void;
  selectRack: (rackId: string | null) => void;
  selectBox: (boxId: string | null) => void;
  setError: (error: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setTheme: (theme: Theme) => void;
  setUseRealShadows: (enabled: boolean) => void;
  toggleEntityType: (entityType: EntityType) => void;
  setVisibleEntityTypes: (types: Set<EntityType>) => void;
  
  // Monitoring actions (Slice 2)
  loadKPIData: (scenarioId: string) => Promise<void>;
  selectKPI: (kpiId: string | null) => void;
  setActiveOverlay: (overlayType: OverlayType | null) => void;
  setDrillDownData: (data: DrillDownData | null) => void;
  highlightZones: (zoneIds: string[]) => void;
  focusOnZone: (zoneId: string, smooth?: boolean) => void;
  clearMonitoringState: () => void;
  
  // Inventory actions
  loadInventoryData: (scenarioId: string) => Promise<void>;
  getBoxesByRack: (rackId: string) => Box[];
  getBoxHierarchy: (boxId: string) => string[];
  toggleHierarchyNode: (nodeId: string) => void;
  searchInventory: (query: string) => Box[];
}

// Three.js coordinate conversion types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraPosition extends Vector3 {
  target: Vector3;
}

// KPI and Monitoring Types (Slice 2)
export type KPIStatus = 'Normal' | 'Watch' | 'Critical';
export type OverlayType = 'heat_congestion' | 'heat_utilization' | 'heat_throughput';

export interface KPI {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: number; // delta %
  status: KPIStatus;
  recency: string; // timestamp
  overlayType?: OverlayType;
  description?: string;
}

export interface KPIConfig {
  id: string;
  label: string;
  description: string;
  unit: string;
  overlayType?: OverlayType;
  thresholds: {
    critical: { operator: string; value: number | number[] };
    watch: { operator: string; value: number | number[] };
    normal: { operator: string; value: number | number[] };
  };
}

export interface KPISnapshot {
  scenarioId: string;
  timestamp: string;
  kpis: Array<{
    id: string;
    value: number;
    trend: number;
  }>;
}

export interface OverlayConfig {
  id: string;
  type: OverlayType;
  name: string;
  colorScale: { value: number; color: string }[];
  legend: { min: number; max: number; unit: string };
}

export interface ZoneHeatData {
  zoneId: string;
  intensity: number; // 0-1
  value: number; // actual value
}

export interface OverlayDataFile {
  scenarioId: string;
  overlays: Record<string, ZoneHeatData[]>;
}

export interface DrillDownDriver {
  label: string;
  value: number;
  contribution: number; // percentage
  zone: string;
}

export interface DrillDownData {
  kpiId: string;
  drivers: DrillDownDriver[];
}
