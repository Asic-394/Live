import { Box, BoxItem, BoxStatus, WarehouseLayoutElement } from '../types';

/**
 * Product catalog with realistic SKUs
 */
interface ProductCatalog {
  sku: string;
  product_name: string;
  category: string;
  typical_quantity: number;
  unit: string;
  weight: number; // lbs
}

/**
 * Scenario configuration for inventory generation
 */
interface ScenarioConfig {
  occupancyRate: number; // 0-1
  zoneDistribution: Record<string, number>; // zone_id -> occupancy multiplier
  fastMovingLevels: number[]; // levels for fast-moving items
  slowMovingLevels: number[]; // levels for slow-moving items
}

/**
 * Generates realistic inventory data for warehouse scenarios
 */
export class InventoryGenerator {
  private static readonly PRODUCT_CATALOG: ProductCatalog[] = [
    // Electronics (10 items)
    { sku: 'SKU-1001', product_name: 'Laptop Computer', category: 'Electronics', typical_quantity: 25, unit: 'each', weight: 5.5 },
    { sku: 'SKU-1002', product_name: 'Tablet Device', category: 'Electronics', typical_quantity: 40, unit: 'each', weight: 1.2 },
    { sku: 'SKU-1003', product_name: 'Smartphone', category: 'Electronics', typical_quantity: 60, unit: 'each', weight: 0.4 },
    { sku: 'SKU-1004', product_name: 'Wireless Mouse', category: 'Electronics', typical_quantity: 100, unit: 'each', weight: 0.3 },
    { sku: 'SKU-1005', product_name: 'Keyboard', category: 'Electronics', typical_quantity: 80, unit: 'each', weight: 1.8 },
    { sku: 'SKU-1006', product_name: 'Monitor 24inch', category: 'Electronics', typical_quantity: 30, unit: 'each', weight: 12.0 },
    { sku: 'SKU-1007', product_name: 'USB Cable Pack', category: 'Electronics', typical_quantity: 150, unit: 'pack', weight: 0.2 },
    { sku: 'SKU-1008', product_name: 'Headphones', category: 'Electronics', typical_quantity: 90, unit: 'each', weight: 0.6 },
    { sku: 'SKU-1009', product_name: 'Webcam HD', category: 'Electronics', typical_quantity: 50, unit: 'each', weight: 0.8 },
    { sku: 'SKU-1010', product_name: 'Power Bank', category: 'Electronics', typical_quantity: 120, unit: 'each', weight: 0.9 },

    // Home Goods (10 items)
    { sku: 'SKU-2001', product_name: 'Coffee Maker', category: 'Home Goods', typical_quantity: 35, unit: 'each', weight: 8.5 },
    { sku: 'SKU-2002', product_name: 'Blender', category: 'Home Goods', typical_quantity: 40, unit: 'each', weight: 6.2 },
    { sku: 'SKU-2003', product_name: 'Toaster', category: 'Home Goods', typical_quantity: 45, unit: 'each', weight: 4.5 },
    { sku: 'SKU-2004', product_name: 'Bedding Set Queen', category: 'Home Goods', typical_quantity: 20, unit: 'set', weight: 7.0 },
    { sku: 'SKU-2005', product_name: 'Throw Pillows 4pk', category: 'Home Goods', typical_quantity: 60, unit: 'pack', weight: 3.2 },
    { sku: 'SKU-2006', product_name: 'Kitchen Knife Set', category: 'Home Goods', typical_quantity: 30, unit: 'set', weight: 4.8 },
    { sku: 'SKU-2007', product_name: 'Cookware Set', category: 'Home Goods', typical_quantity: 25, unit: 'set', weight: 15.0 },
    { sku: 'SKU-2008', product_name: 'Dinner Plates 12pk', category: 'Home Goods', typical_quantity: 50, unit: 'pack', weight: 8.0 },
    { sku: 'SKU-2009', product_name: 'Wall Clock', category: 'Home Goods', typical_quantity: 70, unit: 'each', weight: 2.5 },
    { sku: 'SKU-2010', product_name: 'Table Lamp', category: 'Home Goods', typical_quantity: 55, unit: 'each', weight: 5.5 },

    // Automotive (10 items)
    { sku: 'SKU-3001', product_name: 'Motor Oil 5qt', category: 'Automotive', typical_quantity: 100, unit: 'bottle', weight: 10.5 },
    { sku: 'SKU-3002', product_name: 'Air Filter', category: 'Automotive', typical_quantity: 80, unit: 'each', weight: 1.5 },
    { sku: 'SKU-3003', product_name: 'Brake Pads Set', category: 'Automotive', typical_quantity: 60, unit: 'set', weight: 8.0 },
    { sku: 'SKU-3004', product_name: 'Wiper Blades Pair', category: 'Automotive', typical_quantity: 90, unit: 'pair', weight: 1.8 },
    { sku: 'SKU-3005', product_name: 'Battery 12V', category: 'Automotive', typical_quantity: 30, unit: 'each', weight: 45.0 },
    { sku: 'SKU-3006', product_name: 'Spark Plug 4pk', category: 'Automotive', typical_quantity: 70, unit: 'pack', weight: 0.8 },
    { sku: 'SKU-3007', product_name: 'Coolant 1gal', category: 'Automotive', typical_quantity: 85, unit: 'jug', weight: 9.2 },
    { sku: 'SKU-3008', product_name: 'Tool Set 52pc', category: 'Automotive', typical_quantity: 40, unit: 'set', weight: 12.0 },
    { sku: 'SKU-3009', product_name: 'Floor Mat Set', category: 'Automotive', typical_quantity: 50, unit: 'set', weight: 6.5 },
    { sku: 'SKU-3010', product_name: 'Jumper Cables', category: 'Automotive', typical_quantity: 65, unit: 'each', weight: 4.0 },

    // Industrial (10 items)
    { sku: 'SKU-4001', product_name: 'Safety Goggles', category: 'Industrial', typical_quantity: 200, unit: 'each', weight: 0.3 },
    { sku: 'SKU-4002', product_name: 'Work Gloves Pair', category: 'Industrial', typical_quantity: 180, unit: 'pair', weight: 0.4 },
    { sku: 'SKU-4003', product_name: 'Hard Hat', category: 'Industrial', typical_quantity: 100, unit: 'each', weight: 1.2 },
    { sku: 'SKU-4004', product_name: 'Hex Bolt 1/2" 100pk', category: 'Industrial', typical_quantity: 150, unit: 'pack', weight: 5.0 },
    { sku: 'SKU-4005', product_name: 'Lock Nut Assortment', category: 'Industrial', typical_quantity: 120, unit: 'box', weight: 3.5 },
    { sku: 'SKU-4006', product_name: 'Steel Cable 50ft', category: 'Industrial', typical_quantity: 40, unit: 'spool', weight: 15.0 },
    { sku: 'SKU-4007', product_name: 'Caution Tape Roll', category: 'Industrial', typical_quantity: 90, unit: 'roll', weight: 1.0 },
    { sku: 'SKU-4008', product_name: 'Reflective Vest', category: 'Industrial', typical_quantity: 110, unit: 'each', weight: 0.6 },
    { sku: 'SKU-4009', product_name: 'LED Work Light', category: 'Industrial', typical_quantity: 75, unit: 'each', weight: 2.5 },
    { sku: 'SKU-4010', product_name: 'Measuring Tape 25ft', category: 'Industrial', typical_quantity: 95, unit: 'each', weight: 1.1 },
  ];

  private static readonly SCENARIOS: Record<string, ScenarioConfig> = {
    scenario_normal: {
      occupancyRate: 0.85, // Well-stocked warehouse
      zoneDistribution: {
        'Zone-A': 1.0, // Receiving zone
        'Zone-B': 1.0, // Storage 
        'Zone-D': 1.0, // Staging zone
      },
      fastMovingLevels: [1, 2, 3],
      slowMovingLevels: [5, 6, 7],
    },
    scenario_congestion: {
      occupancyRate: 0.95, // Very full warehouse
      zoneDistribution: {
        'Zone-A': 1.0,
        'Zone-B': 1.2, // Overfull storage zone (>100%)
        'Zone-D': 1.0,
      },
      fastMovingLevels: [1, 2, 3],
      slowMovingLevels: [5, 6, 7],
    },
    scenario_dock_delay: {
      occupancyRate: 0.75, // Moderately stocked
      zoneDistribution: {
        'Zone-A': 0.80, // Receiving backlog - less in storage
        'Zone-B': 1.0,
        'Zone-D': 1.3, // Staging overflow - extra full
      },
      fastMovingLevels: [1, 2, 3],
      slowMovingLevels: [5, 6, 7],
    },
  };

  /**
   * Generates boxes with items for a given scenario
   */
  static generateInventory(
    scenarioId: string,
    racks: WarehouseLayoutElement[]
  ): { boxes: Box[]; items: Map<string, BoxItem[]> } {
    const config = this.SCENARIOS[scenarioId] || this.SCENARIOS.scenario_normal;
    const boxes: Box[] = [];
    const items = new Map<string, BoxItem[]>();

    // Group racks by zone
    const racksByZone = this.groupRacksByZone(racks);

    for (const [zoneId, zoneRacks] of Object.entries(racksByZone)) {
      const zoneMultiplier = config.zoneDistribution[zoneId] || 1.0;
      const zoneOccupancy = config.occupancyRate * zoneMultiplier;

      for (const rack of zoneRacks) {
        const rackBoxes = this.generateBoxesForRack(
          rack,
          zoneOccupancy,
          config,
          boxes.length
        );

        for (const box of rackBoxes) {
          boxes.push(box);
          items.set(box.box_id, box.items);
        }
      }
    }

    return { boxes, items };
  }

  /**
   * Groups racks by their parent zone
   */
  private static groupRacksByZone(
    racks: WarehouseLayoutElement[]
  ): Record<string, WarehouseLayoutElement[]> {
    const grouped: Record<string, WarehouseLayoutElement[]> = {};

    for (const rack of racks) {
      const zoneId = rack.hierarchy?.path[0] || 'Unknown';
      if (!grouped[zoneId]) {
        grouped[zoneId] = [];
      }
      grouped[zoneId].push(rack);
    }

    return grouped;
  }

  /**
   * Generates boxes for a single rack
   */
  private static generateBoxesForRack(
    rack: WarehouseLayoutElement,
    occupancyRate: number,
    config: ScenarioConfig,
    _startIndex: number
  ): Box[] {
    const boxes: Box[] = [];
    const levels = rack.metadata?.levels || 7;
    const slotsPerLevel = 3; // 3 slots per level for efficient space usage

    for (let level = 1; level <= levels; level++) {
      // Determine how many boxes for this level based on occupancy
      const isLowLevel = level <= 3;
      const levelOccupancy = isLowLevel ? occupancyRate * 1.1 : occupancyRate * 0.9;
      
      // Calculate number of boxes (0-3 per level) deterministically
      // Each slot has a chance equal to levelOccupancy
      for (let position = 1; position <= slotsPerLevel; position++) {
        // Deterministic: fill slots based on occupancy rate
        // E.g., 85% occupancy means each slot has 85% chance of being filled
        const slotFilled = Math.random() < levelOccupancy;
        
        if (slotFilled) {
          const boxId = `BOX-${rack.element_id}-L${level}-P${position}`;
          const box = this.createBox(boxId, rack, level, position, config);
          boxes.push(box);
        }
      }
    }

    return boxes;
  }

  /**
   * Creates a single box with items
   */
  private static createBox(
    boxId: string,
    rack: WarehouseLayoutElement,
    level: number,
    position: number,
    config: ScenarioConfig
  ): Box {
    // Calculate position within rack
    const levelHeight = (rack.height || 20) / 7;
    const z = (rack.z || 0) + levelHeight * (level - 0.5);
    
    // Offset position horizontally
    const positionOffset = (position - 2) * 1.5;
    const x = rack.x + positionOffset;
    const y = rack.y;

    // Determine item mix for this box
    const numItems = Math.floor(Math.random() * 2) + 1; // 1-3 items per box
    const items = this.generateItemsForBox(level, numItems, config);
    
    // Calculate capacity used
    const capacityUsed = Math.floor(Math.random() * 30) + 60; // 60-90%

    // Determine status
    const status: BoxStatus = 'stored';

    // Generate timestamp
    const daysAgo = Math.floor(Math.random() * 30);
    const lastUpdated = new Date();
    lastUpdated.setDate(lastUpdated.getDate() - daysAgo);

    return {
      box_id: boxId,
      rack_id: rack.element_id,
      level,
      position,
      x,
      y,
      z,
      status,
      items,
      capacity_used: capacityUsed,
      last_updated: lastUpdated.toISOString(),
    };
  }

  /**
   * Generates items for a box based on level and configuration
   */
  private static generateItemsForBox(
    level: number,
    numItems: number,
    config: ScenarioConfig
  ): BoxItem[] {
    const items: BoxItem[] = [];
    const isLowLevel = config.fastMovingLevels.includes(level);
    const isHighLevel = config.slowMovingLevels.includes(level);

    // Select appropriate products
    let productPool = [...this.PRODUCT_CATALOG];
    
    if (isLowLevel) {
      // Fast-moving items (Electronics, Home Goods) on lower levels
      productPool = productPool.filter(
        (p) => p.category === 'Electronics' || p.category === 'Home Goods'
      );
    } else if (isHighLevel) {
      // Slow-moving items (Industrial) on upper levels
      productPool = productPool.filter(
        (p) => p.category === 'Industrial' || p.category === 'Automotive'
      );
    }

    // Select random products
    const shuffled = [...productPool].sort(() => Math.random() - 0.5);
    const selectedProducts = shuffled.slice(0, numItems);

    for (const product of selectedProducts) {
      const quantity = Math.floor(
        product.typical_quantity * (0.3 + Math.random() * 0.7)
      );

      const daysAgo = Math.floor(Math.random() * 60);
      const receivedDate = new Date();
      receivedDate.setDate(receivedDate.getDate() - daysAgo);

      items.push({
        sku: product.sku,
        product_name: product.product_name,
        quantity,
        unit: product.unit,
        category: product.category,
        weight: product.weight,
        received_date: receivedDate.toISOString().split('T')[0],
      });
    }

    return items;
  }

  /**
   * Generates a few boxes in transit for dynamic inventory
   */
  static generateInTransitBoxes(
    allBoxes: Box[],
    numInTransit: number = 5
  ): Box[] {
    const inTransit: Box[] = [];
    const shuffled = [...allBoxes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numInTransit);

    for (const box of selected) {
      const inTransitBox = { ...box };
      inTransitBox.status = Math.random() > 0.5 ? 'in_transit' : 'staged';
      inTransit.push(inTransitBox);
    }

    return inTransit;
  }

  /**
   * Gets product catalog for reference
   */
  static getProductCatalog(): ProductCatalog[] {
    return [...this.PRODUCT_CATALOG];
  }
}
