import type { 
  KPI, 
  KPIConfig, 
  KPISnapshot, 
  ZoneHeatData, 
  OverlayDataFile, 
  OverlayConfig,
  OverlayType,
  DrillDownData
} from '../types';

export class MonitoringService {
  private static kpiConfigCache: KPIConfig[] | null = null;
  private static overlayConfigCache: OverlayConfig[] | null = null;

  /**
   * Load KPI configuration (metadata, thresholds)
   */
  static async loadKPIConfig(): Promise<KPIConfig[]> {
    if (this.kpiConfigCache) {
      return this.kpiConfigCache;
    }

    try {
      const response = await fetch('/data/kpis/kpi_config.json');
      if (!response.ok) {
        throw new Error(`Failed to load KPI config: ${response.statusText}`);
      }
      const data = await response.json();
      this.kpiConfigCache = data.kpis;
      return this.kpiConfigCache || [];
    } catch (error) {
      console.error('Error loading KPI config:', error);
      throw error;
    }
  }

  /**
   * Load KPI snapshot for a specific scenario
   */
  static async loadKPISnapshot(scenarioId: string): Promise<KPISnapshot> {
    try {
      const response = await fetch(`/data/kpis/kpi_snapshot_${scenarioId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load KPI snapshot: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading KPI snapshot for ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Load overlay configuration
   */
  static async loadOverlayConfig(): Promise<OverlayConfig[]> {
    if (this.overlayConfigCache) {
      return this.overlayConfigCache;
    }

    try {
      const response = await fetch('/data/overlays/overlay_config.json');
      if (!response.ok) {
        throw new Error(`Failed to load overlay config: ${response.statusText}`);
      }
      const data = await response.json();
      this.overlayConfigCache = data.overlays;
      return this.overlayConfigCache || [];
    } catch (error) {
      console.error('Error loading overlay config:', error);
      throw error;
    }
  }

  /**
   * Load overlay data for a specific scenario
   */
  static async loadOverlayData(scenarioId: string): Promise<OverlayDataFile> {
    try {
      const response = await fetch(`/data/overlays/overlay_data_${scenarioId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load overlay data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading overlay data for ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Get heat data for a specific overlay type
   */
  static getOverlayHeatData(
    overlayDataFile: OverlayDataFile,
    overlayType: OverlayType
  ): ZoneHeatData[] {
    return overlayDataFile.overlays[overlayType] || [];
  }

  /**
   * Enrich KPI snapshot with config data (thresholds, descriptions, etc.)
   */
  static enrichKPIs(snapshot: KPISnapshot, configs: KPIConfig[]): KPI[] {
    return snapshot.kpis.map(kpiData => {
      const config = configs.find(c => c.id === kpiData.id);
      if (!config) {
        console.warn(`No config found for KPI: ${kpiData.id}`);
        return {
          ...kpiData,
          label: kpiData.id,
          unit: '',
          status: 'Normal' as const,
          recency: snapshot.timestamp
        };
      }

      const status = this.computeKPIStatus(kpiData.value, config.thresholds);

      return {
        id: kpiData.id,
        label: config.label,
        value: kpiData.value,
        unit: config.unit,
        trend: kpiData.trend,
        status,
        recency: snapshot.timestamp,
        overlayType: config.overlayType,
        description: config.description
      };
    });
  }

  /**
   * Compute KPI status based on value and thresholds
   */
  static computeKPIStatus(
    value: number,
    thresholds: KPIConfig['thresholds']
  ): 'Normal' | 'Watch' | 'Critical' {
    // Check critical threshold first
    if (this.meetsThreshold(value, thresholds.critical)) {
      return 'Critical';
    }

    // Check watch threshold
    if (this.meetsThreshold(value, thresholds.watch)) {
      return 'Watch';
    }

    // Otherwise normal
    return 'Normal';
  }

  /**
   * Check if a value meets a threshold condition
   */
  private static meetsThreshold(
    value: number,
    threshold: { operator: string; value: number | number[] }
  ): boolean {
    const { operator, value: thresholdValue } = threshold;

    switch (operator) {
      case 'above':
        return value > (thresholdValue as number);
      case 'below':
        return value < (thresholdValue as number);
      case 'between':
        const [min, max] = thresholdValue as number[];
        return value >= min && value <= max;
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Get drill-down data for a specific KPI from snapshot
   */
  static getDrillDownData(
    snapshot: any,
    kpiId: string
  ): DrillDownData | null {
    if (!snapshot.drillDowns || !snapshot.drillDowns[kpiId]) {
      return null;
    }

    return {
      kpiId,
      drivers: snapshot.drillDowns[kpiId].drivers
    };
  }

  /**
   * Get top N zones by intensity for an overlay
   */
  static getTopZones(
    heatData: ZoneHeatData[],
    count: number = 3
  ): string[] {
    return heatData
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, count)
      .map(d => d.zoneId);
  }

  /**
   * Clear all caches (useful for testing or data reload)
   */
  static clearCache(): void {
    this.kpiConfigCache = null;
    this.overlayConfigCache = null;
  }
}
