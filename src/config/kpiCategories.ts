/**
 * KPI Category Mapping
 * 
 * Maps lens kpiCategories to actual KPI IDs from kpi_config.json
 * This allows lenses to prioritize relevant KPIs in the sidebar
 */

// Core lens categories (Phase 1)
export const KPI_CATEGORY_MAP: Record<string, string[]> = {
  // Inventory lens categories
  inventory: ['space_utilization', 'order_accuracy'],
  storage: ['space_utilization'],
  accuracy: ['order_accuracy'],
  
  // Resources lens categories
  labor: ['labor_utilization'],
  equipment: ['equipment_uptime'],
  utilization: ['labor_utilization', 'dock_utilization', 'equipment_uptime'],
  
  // Tasks lens categories
  throughput: ['throughput', 'avg_pick_time'],
  tasks: ['throughput', 'avg_pick_time'],
  efficiency: ['avg_pick_time', 'on_time_delivery'],
  
  // Alerts lens categories
  risk: ['orders_at_risk', 'zone_congestion'],
  alerts: ['orders_at_risk', 'zone_congestion'],
  exceptions: ['orders_at_risk'],
  
  // Inbound lens categories (Phase 2)
  inbound: ['dock_utilization', 'throughput', 'order_accuracy'],
  receiving: ['dock_utilization', 'avg_pick_time'],
  putaway: ['space_utilization'],
  
  // Outbound lens categories (Phase 2)
  outbound: ['throughput', 'orders_at_risk', 'on_time_delivery'],
  picking: ['throughput', 'avg_pick_time', 'order_accuracy'],
  shipping: ['on_time_delivery', 'dock_utilization'],
  
  // Yard lens categories (Phase 2)
  yard: ['dock_utilization', 'on_time_delivery'],
  gate: ['throughput'],
  parking: ['dock_utilization'],
  
  // Operational categories (general)
  operational: ['throughput', 'labor_utilization', 'dock_utilization', 'zone_congestion'],
};

/**
 * Get KPI IDs for a list of categories
 */
export function getKPIsForCategories(categories: string[]): string[] {
  const kpiIds = new Set<string>();
  
  categories.forEach(category => {
    const mappedKPIs = KPI_CATEGORY_MAP[category] || [];
    mappedKPIs.forEach(kpiId => kpiIds.add(kpiId));
  });
  
  return Array.from(kpiIds);
}

/**
 * Check if a KPI ID matches any of the given categories
 */
export function isKPICategoryMatch(kpiId: string, categories: string[]): boolean {
  const relevantKPIs = getKPIsForCategories(categories);
  return relevantKPIs.includes(kpiId);
}
