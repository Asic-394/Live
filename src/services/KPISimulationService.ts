import type { KPI, KPIStatus } from '../types';

/**
 * Service for simulating real-time KPI updates
 * Generates fluctuating values based on base values from snapshots
 */
export class KPISimulationService {
  private static baseValues = new Map<string, { value: number; trend: number }>();
  
  /**
   * Initialize base values from current KPI snapshot
   */
  static initializeBaseValues(kpis: KPI[]): void {
    kpis.forEach(kpi => {
      this.baseValues.set(kpi.id, {
        value: kpi.value,
        trend: kpi.trend
      });
    });
  }

  /**
   * Simulate an update for all KPIs
   * Returns new KPI array with updated values and trends
   */
  static simulateUpdate(kpis: KPI[]): KPI[] {
    return kpis.map(kpi => this.simulateSingleKPI(kpi));
  }

  /**
   * Simulate an update for a single KPI
   */
  private static simulateSingleKPI(kpi: KPI): KPI {
    const base = this.baseValues.get(kpi.id) || { value: kpi.value, trend: kpi.trend };
    
    // Determine fluctuation range based on KPI type and unit
    const fluctuationPercent = this.getFluctuationPercent(kpi);
    
    // Calculate new value with random fluctuation
    const maxChange = base.value * (fluctuationPercent / 100);
    const change = (Math.random() - 0.5) * 2 * maxChange; // Random change between -maxChange and +maxChange
    let newValue = base.value + change;
    
    // Apply constraints based on unit type
    newValue = this.applyConstraints(newValue, kpi.unit);
    
    // Calculate new trend (percentage change from base)
    const trendChange = ((newValue - base.value) / base.value) * 100;
    let newTrend = Math.round(trendChange * 10) / 10; // Round to 1 decimal
    
    // Occasionally flip trend direction for variety
    if (Math.random() < 0.15) {
      newTrend = -newTrend;
    }
    
    // Recompute status based on new value
    const newStatus = this.computeStatus(kpi, newValue);
    
    return {
      ...kpi,
      value: Math.round(newValue * 100) / 100, // Round to 2 decimals
      trend: newTrend,
      status: newStatus,
      recency: new Date().toISOString()
    };
  }

  /**
   * Get fluctuation percentage based on KPI type
   */
  private static getFluctuationPercent(kpi: KPI): number {
    // Different KPIs have different volatility
    switch (kpi.id) {
      case 'throughput':
      case 'orders_at_risk':
        return 5; // 5% fluctuation
      case 'labor_utilization':
      case 'dock_utilization':
      case 'equipment_uptime':
        return 3; // 3% fluctuation
      case 'zone_congestion':
        return 8; // 8% fluctuation
      case 'order_accuracy':
      case 'on_time_delivery':
        return 2; // 2% fluctuation (more stable)
      case 'avg_pick_time':
        return 6; // 6% fluctuation
      case 'space_utilization':
        return 1.5; // 1.5% fluctuation (very stable)
      default:
        return 4; // Default 4% fluctuation
    }
  }

  /**
   * Apply constraints to keep values realistic
   */
  private static applyConstraints(value: number, unit: string): number {
    switch (unit) {
      case '%':
        // Percentages stay between 0 and 100
        return Math.max(0, Math.min(100, value));
      case 'density':
        // Density stays between 0 and 1
        return Math.max(0, Math.min(1, value));
      case 'orders':
      case 'orders/hr':
        // Order counts can't be negative
        return Math.max(0, value);
      case 'sec':
        // Time can't be negative
        return Math.max(0, value);
      default:
        return value;
    }
  }

  /**
   * Recompute status based on thresholds (simplified version)
   * In a real implementation, this would use the threshold config from kpi_config.json
   */
  private static computeStatus(kpi: KPI, value: number): KPIStatus {
    // Simple heuristic-based status computation
    // This is a simplified version; ideally would use the actual threshold config
    
    switch (kpi.id) {
      case 'throughput':
        if (value < 30) return 'Critical';
        if (value < 45) return 'Watch';
        return 'Normal';
      
      case 'labor_utilization':
        if (value < 60) return 'Critical';
        if (value < 75) return 'Watch';
        if (value > 90) return 'Watch';
        return 'Normal';
      
      case 'orders_at_risk':
        if (value > 10) return 'Critical';
        if (value > 5) return 'Watch';
        return 'Normal';
      
      case 'zone_congestion':
        if (value > 0.8) return 'Critical';
        if (value > 0.65) return 'Watch';
        return 'Normal';
      
      case 'on_time_delivery':
        if (value < 85) return 'Critical';
        if (value < 92) return 'Watch';
        return 'Normal';
      
      case 'order_accuracy':
        if (value < 95) return 'Critical';
        if (value < 98) return 'Watch';
        return 'Normal';
      
      case 'dock_utilization':
        if (value < 50) return 'Critical';
        if (value < 70) return 'Watch';
        if (value > 90) return 'Watch';
        return 'Normal';
      
      case 'space_utilization':
        if (value > 95) return 'Critical';
        if (value > 88) return 'Watch';
        if (value < 70) return 'Watch';
        return 'Normal';
      
      case 'avg_pick_time':
        if (value > 180) return 'Critical';
        if (value > 120) return 'Watch';
        return 'Normal';
      
      case 'equipment_uptime':
        if (value < 85) return 'Critical';
        if (value < 92) return 'Watch';
        return 'Normal';
      
      default:
        return kpi.status; // Keep existing status if unknown
    }
  }

  /**
   * Reset base values (useful when changing scenarios)
   */
  static reset(): void {
    this.baseValues.clear();
  }
}
