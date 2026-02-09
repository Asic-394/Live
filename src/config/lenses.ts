import type { Lens } from '../types';

/**
 * Lens Configuration
 * 
 * Lenses provide context-specific views of the warehouse by:
 * - Filtering visible entity types
 * - Activating relevant overlays
 * - Emphasizing related KPIs
 * 
 * Note: Only one lens can be active at a time to prevent data overcrowding.
 * When no lens is selected, the full warehouse view is shown (all entities).
 */
export const LENSES: Lens[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'boxes',
    description: 'Focus on inventory items, pallets, and storage',
    entityTypes: ['pallet', 'inventory'],
    overlayTypes: [],
    kpiCategories: ['inventory', 'storage', 'accuracy']
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: 'users',
    description: 'Track workers, equipment, and resource utilization',
    entityTypes: ['worker', 'forklift'],
    overlayTypes: ['heat_utilization'],
    kpiCategories: ['labor', 'equipment', 'utilization']
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: 'clipboard',
    description: 'Monitor active tasks and assignments',
    entityTypes: ['worker', 'forklift', 'pallet'],
    overlayTypes: ['heat_throughput'],
    kpiCategories: ['throughput', 'tasks', 'efficiency']
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: 'alert',
    description: 'View risk zones and active alerts',
    entityTypes: ['worker', 'forklift', 'pallet', 'inventory', 'truck'],
    overlayTypes: ['heat_congestion'],
    kpiCategories: ['risk', 'alerts', 'exceptions']
  },
  {
    id: 'inbound',
    label: 'Inbound',
    icon: 'arrow-down',
    description: 'Receiving operations from arrival through putaway',
    entityTypes: ['truck', 'worker', 'forklift', 'pallet'],
    overlayTypes: ['heat_utilization'],
    kpiCategories: ['inbound', 'receiving', 'putaway']
  },
  {
    id: 'outbound',
    label: 'Outbound',
    icon: 'arrow-up',
    description: 'Fulfillment operations from picking through shipping',
    entityTypes: ['worker', 'forklift', 'pallet', 'truck'],
    overlayTypes: ['heat_throughput'],
    kpiCategories: ['outbound', 'picking', 'shipping']
  },
  {
    id: 'yard',
    label: 'Yard',
    icon: 'truck',
    description: 'Yard operations, truck scheduling, and gate management',
    entityTypes: ['truck'],
    overlayTypes: [],
    kpiCategories: ['yard', 'gate', 'parking']
  }
];

/**
 * Default site configuration
 */
export const DEFAULT_SITE = {
  id: 'phx-dc-01',
  name: 'Phoenix Distribution Center',
  location: 'Phoenix, AZ'
};

/**
 * Get lens configuration by ID
 */
export function getLensById(id: string): Lens | undefined {
  return LENSES.find(lens => lens.id === id);
}

/**
 * Get default active lenses (empty = full warehouse view)
 */
export function getDefaultLenses(): Set<string> {
  return new Set();
}
