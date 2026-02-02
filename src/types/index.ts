// Core types based on DataContracts.md

export type ElementType = 'zone' | 'aisle' | 'rack' | 'dock' | 'wall';
export type EntityType = 'worker' | 'forklift' | 'pallet' | 'inventory';
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
}

export interface WarehouseLayout {
  zones: WarehouseLayoutElement[];
  aisles: WarehouseLayoutElement[];
  racks: WarehouseLayoutElement[];
  docks: WarehouseLayoutElement[];
  walls: WarehouseLayoutElement[];
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

// Application State (Zustand store)
export interface AppState {
  // Data state
  currentDataset: string | null;
  warehouseLayout: WarehouseLayout | null;
  entities: Entity[];
  loadingState: LoadingState;
  error: string | null;
  
  // Scene state
  selectedEntity: string | null;
  selectedRack: string | null; // Rack element_id
  cameraReset: number; // Increment to trigger camera reset
  cameraMode: CameraMode;
  
  // Actions
  loadDataset: (datasetId: string) => Promise<void>;
  resetScene: () => void;
  selectEntity: (entityId: string | null) => void;
  selectRack: (rackId: string | null) => void;
  setError: (error: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
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
