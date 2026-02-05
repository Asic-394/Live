import type {
  WarehouseLayout,
  WarehouseLayoutElement,
  Entity,
  Dataset,
  Box,
  BoxItem,
} from '../types';
import { CSVParser } from '../data/parsers/CSVParser';
import { SchemaValidator } from '../data/validators/SchemaValidator';
import { CoordinateMapper } from '../utils/coordinates';
import { HierarchyBuilder } from '../utils/HierarchyBuilder';

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
    
    // Build hierarchy relationships
    const layoutWithHierarchy = HierarchyBuilder.buildHierarchy(layout);
    
    // Then load entities (with layout for validation)
    const entities = await this.loadWarehouseState(dataset.statePath, layoutWithHierarchy);

    return { layout: layoutWithHierarchy, entities };
  }

  /**
   * Load inventory boxes from CSV
   */
  static async loadInventoryBoxes(datasetId: string): Promise<Box[]> {
    const boxesPath = `/datasets/${datasetId}/inventory_boxes.csv`;
    
    console.log('📂 Loading inventory boxes from:', boxesPath);
    
    try {
      const parseResult = await CSVParser.parseFile<any>(boxesPath);
      
      console.log('📋 Parse result:', { 
        rowCount: parseResult.data.length, 
        errors: parseResult.errors.length 
      });
      
      if (parseResult.errors.length > 0) {
        console.warn('⚠️ Inventory boxes CSV parse warnings:', parseResult.errors);
      }

      const boxes: Box[] = parseResult.data.map((row) => ({
        box_id: row.box_id,
        rack_id: row.rack_id,
        level: parseInt(row.level),
        position: parseInt(row.position),
        x: parseFloat(row.x),
        y: parseFloat(row.y),
        z: parseFloat(row.z),
        status: row.status,
        items: [], // Will be populated by loadInventoryItems
        capacity_used: parseInt(row.capacity_used),
        last_updated: row.last_updated,
      }));

      console.log('✅ Successfully parsed boxes:', boxes.length);
      return boxes;
    } catch (error) {
      console.error('❌ Failed to load inventory boxes:', error);
      return [];
    }
  }

  /**
   * Load inventory items from CSV and associate with boxes
   */
  static async loadInventoryItems(datasetId: string): Promise<Map<string, BoxItem[]>> {
    const itemsPath = `/datasets/${datasetId}/inventory_items.csv`;
    const itemsMap = new Map<string, BoxItem[]>();
    
    try {
      const parseResult = await CSVParser.parseFile<any>(itemsPath);
      
      if (parseResult.errors.length > 0) {
        console.warn('Inventory items CSV parse warnings:', parseResult.errors);
      }

      for (const row of parseResult.data) {
        const boxId = row.box_id;
        const item: BoxItem = {
          sku: row.sku,
          product_name: row.product_name,
          quantity: parseInt(row.quantity),
          unit: row.unit,
          category: row.category,
          weight: row.weight ? parseFloat(row.weight) : undefined,
          received_date: row.received_date,
        };

        if (!itemsMap.has(boxId)) {
          itemsMap.set(boxId, []);
        }
        itemsMap.get(boxId)!.push(item);
      }

      return itemsMap;
    } catch (error) {
      console.warn('Failed to load inventory items:', error);
      return new Map();
    }
  }

  /**
   * Load complete inventory data (boxes + items)
   */
  static async loadInventoryData(datasetId: string): Promise<{ boxes: Box[]; items: Map<string, BoxItem[]> }> {
    console.log('🚀 DataService.loadInventoryData called with datasetId:', datasetId);
    
    console.log('📦 Step 1: Loading boxes...');
    const boxes = await this.loadInventoryBoxes(datasetId);
    console.log(`✅ Step 1 complete: Loaded ${boxes.length} boxes`);
    
    console.log('📦 Step 2: Loading items...');
    const items = await this.loadInventoryItems(datasetId);
    console.log(`✅ Step 2 complete: Loaded ${items.size} item groups`);

    // Associate items with boxes
    console.log('🔗 Step 3: Associating items with boxes...');
    for (const box of boxes) {
      box.items = items.get(box.box_id) || [];
    }
    console.log('✅ Step 3 complete');

    return { boxes, items };
  }
}
