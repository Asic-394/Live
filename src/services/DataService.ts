import type {
  WarehouseLayout,
  WarehouseLayoutElement,
  Entity,
  Dataset,
} from '../types';
import { CSVParser } from '../data/parsers/CSVParser';
import { SchemaValidator } from '../data/validators/SchemaValidator';
import { CoordinateMapper } from '../utils/coordinates';

export class DataService {
  private static datasets: Dataset[] = [
    {
      id: 'scenario_normal',
      name: 'Normal Operations',
      description: 'Healthy warehouse operations with balanced load',
      layoutPath: '/datasets/scenario_normal/warehouse_layout.csv',
      statePath: '/datasets/scenario_normal/warehouse_state.csv',
    },
    {
      id: 'scenario_congestion',
      name: 'Zone C Congestion',
      description: 'High worker density in Zone C',
      layoutPath: '/datasets/scenario_congestion/warehouse_layout.csv',
      statePath: '/datasets/scenario_congestion/warehouse_state.csv',
    },
    {
      id: 'scenario_dock_delay',
      name: 'Dock 2 Delay',
      description: 'Capacity issues at shipping dock',
      layoutPath: '/datasets/scenario_dock_delay/warehouse_layout.csv',
      statePath: '/datasets/scenario_dock_delay/warehouse_state.csv',
    },
  ];

  static getDatasets(): Dataset[] {
    return this.datasets;
  }

  static getDataset(id: string): Dataset | undefined {
    return this.datasets.find((ds) => ds.id === id);
  }

  static async loadWarehouseLayout(layoutPath: string): Promise<WarehouseLayout> {
    // Parse CSV
    const parseResult = await CSVParser.parseFile<any>(layoutPath);
    
    if (parseResult.errors.length > 0) {
      throw new Error(`CSV Parse Error:\n${parseResult.errors.map(e => `Row ${e.row}: ${e.message}`).join('\n')}`);
    }

    // Validate
    const validation = SchemaValidator.validateLayout(parseResult.data);
    if (!validation.valid) {
      throw new Error(`CSV Validation Error:\n${SchemaValidator.formatErrors(validation.errors)}`);
    }

    // Parse metadata JSON fields
    const elements: WarehouseLayoutElement[] = parseResult.data.map((row) => ({
      element_type: row.element_type,
      element_id: row.element_id,
      name: row.name || row.element_id,
      x: row.x,
      y: row.y,
      z: row.z || 0,
      width: row.width,
      depth: row.depth,
      height: row.height || 10,
      rotation: row.rotation || 0,
      capacity: row.capacity,
      metadata: CSVParser.parseJSONField(row.metadata, {}),
    }));

    // Separate by type
    const zones = elements.filter((el) => el.element_type === 'zone');
    const aisles = elements.filter((el) => el.element_type === 'aisle');
    const racks = elements.filter((el) => el.element_type === 'rack');
    const docks = elements.filter((el) => el.element_type === 'dock');
    const walls = elements.filter((el) => el.element_type === 'wall');

    // Calculate bounds
    const bounds = CoordinateMapper.calculateBounds(elements);

    return {
      zones,
      aisles,
      racks,
      docks,
      walls,
      bounds,
    };
  }

  static async loadWarehouseState(
    statePath: string,
    layout: WarehouseLayout | null = null
  ): Promise<Entity[]> {
    // Parse CSV
    const parseResult = await CSVParser.parseFile<any>(statePath);
    
    if (parseResult.errors.length > 0) {
      throw new Error(`CSV Parse Error:\n${parseResult.errors.map(e => `Row ${e.row}: ${e.message}`).join('\n')}`);
    }

    // Validate
    const allLayoutElements = layout
      ? [...layout.zones, ...layout.aisles, ...layout.racks, ...layout.docks, ...layout.walls]
      : null;
    
    const validation = SchemaValidator.validateState(parseResult.data, allLayoutElements);
    if (!validation.valid) {
      throw new Error(`CSV Validation Error:\n${SchemaValidator.formatErrors(validation.errors)}`);
    }

    // Parse metadata JSON fields
    const entities: Entity[] = parseResult.data.map((row) => ({
      timestamp: row.timestamp || new Date().toISOString(),
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      zone: row.zone,
      x: row.x,
      y: row.y,
      z: row.z || 0,
      status: row.status,
      task: row.task,
      assigned_to: row.assigned_to,
      battery_level: row.battery_level,
      speed: row.speed,
      metadata: CSVParser.parseJSONField(row.metadata, {}),
    }));

    return entities;
  }

  static async loadDataset(datasetId: string): Promise<{ layout: WarehouseLayout; entities: Entity[] }> {
    const dataset = this.getDataset(datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    // Load layout first
    const layout = await this.loadWarehouseLayout(dataset.layoutPath);
    
    // Then load entities (with layout for validation)
    const entities = await this.loadWarehouseState(dataset.statePath, layout);

    return { layout, entities };
  }
}
