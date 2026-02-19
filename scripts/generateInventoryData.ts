/**
 * Script to generate inventory data (boxes and items) for all warehouse scenarios
 * 
 * Usage: npx tsx scripts/generateInventoryData.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import types
interface WarehouseLayoutElement {
  element_type: string;
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
  hierarchy?: {
    parent_id: string;
    parent_type: string;
    path: string[];
  };
}

interface Box {
  box_id: string;
  rack_id: string;
  level: number;
  position: number;
  x: number;
  y: number;
  z: number;
  status: string;
  capacity_used: number;
  last_updated: string;
}

interface BoxItem {
  sku: string;
  product_name: string;
  quantity: number;
  unit: string;
  category: string;
  weight?: number;
  received_date?: string;
}

// Simple CSV parser for layout files
function parseLayoutCSV(filePath: string): WarehouseLayoutElement[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const elements: WarehouseLayoutElement[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const element: any = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      const key = header.trim();

      if (value === '' || value === undefined) {
        return;
      }

      // Parse numbers
      if (['x', 'y', 'z', 'width', 'depth', 'height', 'rotation', 'capacity'].includes(key)) {
        element[key] = parseFloat(value);
      } else if (key === 'metadata' && value) {
        try {
          element[key] = JSON.parse(value.replace(/""/g, '"'));
        } catch (e) {
          element[key] = {};
        }
      } else {
        element[key] = value;
      }
    });

    elements.push(element);
  }

  return elements;
}

// Build hierarchy
function buildHierarchy(elements: WarehouseLayoutElement[]): WarehouseLayoutElement[] {
  const zones = elements.filter(e => e.element_type === 'zone');
  const aisles = elements.filter(e => e.element_type === 'aisle');
  const racks = elements.filter(e => e.element_type === 'rack');

  // Assign aisles to zones
  aisles.forEach(aisle => {
    for (const zone of zones) {
      if (isInsideZone(aisle, zone)) {
        aisle.hierarchy = {
          parent_id: zone.element_id,
          parent_type: 'zone',
          path: [zone.element_id],
        };
        break;
      }
    }
  });

  // Assign racks to aisles
  racks.forEach(rack => {
    let closestAisle = aisles[0];
    let minDistance = distance(rack, aisles[0]);

    for (let i = 1; i < aisles.length; i++) {
      const dist = distance(rack, aisles[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestAisle = aisles[i];
      }
    }

    if (closestAisle && closestAisle.hierarchy) {
      rack.hierarchy = {
        parent_id: closestAisle.element_id,
        parent_type: 'aisle',
        path: [...closestAisle.hierarchy.path, closestAisle.element_id],
      };
    }
  });

  return elements;
}

function distance(a: WarehouseLayoutElement, b: WarehouseLayoutElement): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function isInsideZone(aisle: WarehouseLayoutElement, zone: WarehouseLayoutElement): boolean {
  return aisle.x >= zone.x - zone.width / 2 &&
         aisle.x <= zone.x + zone.width / 2 &&
         aisle.y >= zone.y - zone.depth / 2 &&
         aisle.y <= zone.y + zone.depth / 2;
}

// Product catalog
const PRODUCT_CATALOG = [
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

// Scenario configurations
const SCENARIOS: Record<string, any> = {
  scenario_normal: {
    occupancyRate: 0.85, // Well-stocked warehouse
    zoneDistribution: { 'Zone-A': 1.0, 'Zone-B': 1.0, 'Zone-D': 1.0 },
  },
  scenario_congestion: {
    occupancyRate: 0.95, // Very full warehouse
    zoneDistribution: { 'Zone-A': 1.0, 'Zone-B': 1.2, 'Zone-D': 1.0 },
  },
  scenario_dock_delay: {
    occupancyRate: 0.75, // Moderately stocked
    zoneDistribution: { 'Zone-A': 0.80, 'Zone-B': 1.0, 'Zone-D': 1.3 },
  },
};

// Generate boxes for a scenario
function generateInventory(scenarioId: string, racks: WarehouseLayoutElement[]): { boxes: Box[], items: Map<string, BoxItem[]> } {
  const config = SCENARIOS[scenarioId];
  const boxes: Box[] = [];
  const items = new Map<string, BoxItem[]>();

  for (const rack of racks) {
    const zoneId = rack.hierarchy?.path[0] || 'Unknown';
    const zoneMultiplier = config.zoneDistribution[zoneId] || 1.0;
    const zoneOccupancy = config.occupancyRate * zoneMultiplier;

    const levels = rack.metadata?.levels || 3;
    const slotsPerLevel = 3; // 3 slots per level for efficient space usage

    for (let level = 1; level <= levels; level++) {
      const isLowLevel = level <= 3;
      const levelOccupancy = isLowLevel ? zoneOccupancy * 1.1 : zoneOccupancy * 0.9;

      // Fill each slot independently based on occupancy rate
      for (let position = 1; position <= slotsPerLevel; position++) {
        const slotFilled = Math.random() < levelOccupancy;
        
        if (slotFilled) {
          const boxId = `BOX-${rack.element_id}-L${level}-P${position}`;
          const box = createBox(boxId, rack, level, position);
          boxes.push(box);
          items.set(boxId, box.items);
          delete (box as any).items; // Remove items from box for CSV
        }
      }
    }
  }

  return { boxes, items };
}

function createBox(boxId: string, rack: WarehouseLayoutElement, level: number, position: number): any {
  const levelHeight = (rack.height || 20) / 3;
  const z = (rack.z || 0) + levelHeight * (level - 0.5);
  const positionOffset = (position - 2) * 1.5;
  const x = rack.x + positionOffset;
  const y = rack.y;

  const numItems = Math.floor(Math.random() * 2) + 1;
  const items = generateItemsForBox(level, numItems);
  const capacityUsed = Math.floor(Math.random() * 30) + 60;

  const daysAgo = Math.floor(Math.random() * 30);
  const lastUpdated = new Date();
  lastUpdated.setDate(lastUpdated.getDate() - daysAgo);

  return {
    box_id: boxId,
    rack_id: rack.element_id,
    level,
    position,
    x: x.toFixed(2),
    y: y.toFixed(2),
    z: z.toFixed(2),
    status: 'stored',
    capacity_used: capacityUsed,
    last_updated: lastUpdated.toISOString(),
    items, // Temporary, will be removed
  };
}

function generateItemsForBox(level: number, numItems: number): BoxItem[] {
  const items: BoxItem[] = [];
  const isLowLevel = level <= 3;
  const isHighLevel = level >= 5;

  let productPool = [...PRODUCT_CATALOG];
  
  if (isLowLevel) {
    productPool = productPool.filter(p => p.category === 'Electronics' || p.category === 'Home Goods');
  } else if (isHighLevel) {
    productPool = productPool.filter(p => p.category === 'Industrial' || p.category === 'Automotive');
  }

  const shuffled = [...productPool].sort(() => Math.random() - 0.5);
  const selectedProducts = shuffled.slice(0, numItems);

  for (const product of selectedProducts) {
    const quantity = Math.floor(product.typical_quantity * (0.3 + Math.random() * 0.7));
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

// Write CSV files
function writeBoxesCSV(boxes: Box[], filePath: string) {
  const headers = ['box_id', 'rack_id', 'level', 'position', 'x', 'y', 'z', 'status', 'capacity_used', 'last_updated'];
  const rows = boxes.map(box => [
    box.box_id,
    box.rack_id,
    box.level,
    box.position,
    box.x,
    box.y,
    box.z,
    box.status,
    box.capacity_used,
    box.last_updated,
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  fs.writeFileSync(filePath, csv);
  console.log(`✓ Written ${boxes.length} boxes to ${filePath}`);
}

function writeItemsCSV(items: Map<string, BoxItem[]>, filePath: string) {
  const headers = ['box_id', 'sku', 'product_name', 'quantity', 'unit', 'category', 'weight', 'received_date'];
  const rows: any[] = [];

  for (const [boxId, boxItems] of items.entries()) {
    for (const item of boxItems) {
      rows.push([
        boxId,
        item.sku,
        item.product_name,
        item.quantity,
        item.unit,
        item.category,
        item.weight,
        item.received_date,
      ]);
    }
  }

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  fs.writeFileSync(filePath, csv);
  console.log(`✓ Written ${rows.length} items to ${filePath}`);
}

// Main execution
function main() {
  console.log('🚀 Generating inventory data for all scenarios...\n');

  const scenarios = ['scenario_normal', 'scenario_congestion', 'scenario_dock_delay'];
  const publicDir = path.join(__dirname, '..', 'public', 'datasets');

  for (const scenario of scenarios) {
    console.log(`\n📦 Processing ${scenario}...`);
    
    const layoutPath = path.join(publicDir, scenario, 'warehouse_layout.csv');
    const elements = parseLayoutCSV(layoutPath);
    const elementsWithHierarchy = buildHierarchy(elements);
    const racks = elementsWithHierarchy.filter(e => e.element_type === 'rack');

    const { boxes, items } = generateInventory(scenario, racks);

    const boxesPath = path.join(publicDir, scenario, 'inventory_boxes.csv');
    const itemsPath = path.join(publicDir, scenario, 'inventory_items.csv');

    writeBoxesCSV(boxes, boxesPath);
    writeItemsCSV(items, itemsPath);

    console.log(`   Total boxes: ${boxes.length}`);
    console.log(`   Total items: ${Array.from(items.values()).reduce((sum, arr) => sum + arr.length, 0)}`);
  }

  console.log('\n✅ All inventory data generated successfully!');
}

main();
