import { create } from 'zustand';
import type { AppState, Theme, OverlayType } from '../types';
import { DataService } from '../services/DataService';
import { MonitoringService } from '../services/MonitoringService';

// Initialize theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem('warehouse-theme') as Theme | null;
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return systemPreference;
};

export const useStore = create<AppState>((set, get) => ({
  // Data state
  currentDataset: null,
  warehouseLayout: null,
  entities: [],
  boxes: [],
  inventory: new Map(),
  loadingState: 'idle',
  error: null,

  // Scene state
  selectedEntity: null,
  selectedRack: null,
  selectedBox: null,
  cameraReset: 0,
  cameraMode: 'perspective',

  // UI state
  theme: getInitialTheme(),
  visibleEntityTypes: new Set(['worker', 'forklift', 'pallet', 'inventory']),
  hierarchyExpanded: new Set(),

  // Monitoring state (Slice 2)
  kpis: [],
  selectedKPI: null,
  activeOverlay: null,
  overlayData: new Map(),
  drillDownData: null,
  highlightedZones: new Set(),
  focusedZone: null,

  // Actions
  loadDataset: async (datasetId: string) => {
    set({ loadingState: 'loading', error: null });
    console.log('loadDataset called for:', datasetId);

    try {
      const { layout, entities } = await DataService.loadDataset(datasetId);
      
      set({
        currentDataset: datasetId,
        warehouseLayout: layout,
        entities,
        loadingState: 'success',
        error: null,
        selectedEntity: null,
        selectedRack: null,
        selectedBox: null,
        cameraReset: get().cameraReset + 1, // Trigger camera reset
      });

      console.log('Dataset loaded successfully, now loading KPI data and inventory...');
      console.log('🔍 About to call loadInventoryData for:', datasetId);
      
      // Load KPI data in background
      get().loadKPIData(datasetId).catch(err => {
        console.error('KPI data load failed but continuing:', err);
      });
      
      // Load inventory data in background - IMPORTANT!
      console.log('📦 Calling loadInventoryData now...');
      get().loadInventoryData(datasetId).catch(err => {
        console.error('❌ Inventory data load failed but continuing:', err);
        console.error('Error details:', err);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading dataset';
      set({
        loadingState: 'error',
        error: errorMessage,
      });
      console.error('Failed to load dataset:', error);
    }
  },

  resetScene: () => {
    const currentDataset = get().currentDataset;
    set({
      selectedEntity: null,
      selectedRack: null,
      cameraReset: get().cameraReset + 1,
    });
    
    // Reload current dataset
    if (currentDataset) {
      get().loadDataset(currentDataset);
    }
  },

  selectEntity: (entityId: string | null) => {
    set({ selectedEntity: entityId });
  },

  selectRack: (rackId: string | null) => {
    set({ selectedRack: rackId });
  },

  selectBox: (boxId: string | null) => {
    set({ selectedBox: boxId });
    
    // If selecting a box, also find and select its parent rack
    if (boxId) {
      const box = get().boxes.find(b => b.box_id === boxId);
      if (box) {
        set({ selectedRack: box.rack_id });
      }
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setCameraMode: (mode) => {
    set({ cameraMode: mode });
  },

  setTheme: (theme) => {
    localStorage.setItem('warehouse-theme', theme);
    set({ theme });
  },

  toggleEntityType: (entityType) => {
    const currentTypes = get().visibleEntityTypes;
    const newTypes = new Set(currentTypes);
    
    if (newTypes.has(entityType)) {
      newTypes.delete(entityType);
    } else {
      newTypes.add(entityType);
    }
    
    set({ visibleEntityTypes: newTypes });
  },

  setVisibleEntityTypes: (types) => {
    set({ visibleEntityTypes: types });
  },

  // Monitoring actions (Slice 2)
  loadKPIData: async (scenarioId: string) => {
    console.log('loadKPIData called for scenario:', scenarioId);
    try {
      const [kpiConfig, kpiSnapshot, overlayDataFile] = await Promise.all([
        MonitoringService.loadKPIConfig(),
        MonitoringService.loadKPISnapshot(scenarioId),
        MonitoringService.loadOverlayData(scenarioId)
      ]);

      console.log('KPI data loaded:', { kpiConfig, kpiSnapshot, overlayDataFile });

      const enrichedKPIs = MonitoringService.enrichKPIs(kpiSnapshot, kpiConfig);
      console.log('Enriched KPIs:', enrichedKPIs);

      // Build overlay data map
      const overlayDataMap = new Map<OverlayType, any>();
      Object.keys(overlayDataFile.overlays).forEach(overlayType => {
        overlayDataMap.set(overlayType as OverlayType, overlayDataFile.overlays[overlayType]);
      });

      set({
        kpis: enrichedKPIs,
        overlayData: overlayDataMap
      });
      console.log('KPI state updated, kpis count:', enrichedKPIs.length);
    } catch (error) {
      console.error('Failed to load KPI data:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error loading KPI data' });
    }
  },

  selectKPI: (kpiId: string | null) => {
    const currentKPI = get().selectedKPI;
    
    // If clicking the same KPI, deselect it
    if (currentKPI === kpiId) {
      set({
        selectedKPI: null,
        activeOverlay: null,
        drillDownData: null,
        highlightedZones: new Set(),
        focusedZone: null
      });
      return;
    }

    set({ selectedKPI: kpiId });

    if (!kpiId) {
      set({
        activeOverlay: null,
        drillDownData: null,
        highlightedZones: new Set(),
        focusedZone: null
      });
      return;
    }

    const kpi = get().kpis.find(k => k.id === kpiId);
    if (kpi && kpi.overlayType) {
      // Activate overlay
      get().setActiveOverlay(kpi.overlayType);

      // Load drill-down data (from the snapshot file)
      const scenarioId = get().currentDataset;
      if (scenarioId) {
        MonitoringService.loadKPISnapshot(scenarioId).then(snapshot => {
          const drillDown = MonitoringService.getDrillDownData(snapshot, kpiId);
          set({ drillDownData: drillDown });
        });
      }

      // Find top zones and highlight them
      const overlayData = get().overlayData;
      const heatData = overlayData.get(kpi.overlayType);
      if (heatData) {
        const topZones = MonitoringService.getTopZones(heatData, 3);
        set({ highlightedZones: new Set(topZones) });
        
        // Focus on the top zone
        if (topZones[0]) {
          get().focusOnZone(topZones[0], true);
        }
      }
    }
  },

  setActiveOverlay: (overlayType: OverlayType | null) => {
    set({ activeOverlay: overlayType });
  },

  setDrillDownData: (data) => {
    set({ drillDownData: data });
  },

  highlightZones: (zoneIds: string[]) => {
    set({ highlightedZones: new Set(zoneIds) });
  },

  focusOnZone: (zoneId: string, _smooth: boolean = true) => {
    set({ focusedZone: zoneId });
  },

  clearMonitoringState: () => {
    set({
      selectedKPI: null,
      activeOverlay: null,
      drillDownData: null,
      highlightedZones: new Set(),
      focusedZone: null
    });
  },

  // Inventory actions
  loadInventoryData: async (scenarioId: string) => {
    console.log('🔄 loadInventoryData called for scenario:', scenarioId);
    try {
      const { boxes, items } = await DataService.loadInventoryData(scenarioId);
      console.log(`✅ Loaded ${boxes.length} boxes with ${items.size} item groups`);
      console.log('📦 First 3 boxes:', boxes.slice(0, 3));
      
      set({
        boxes,
        inventory: items
      });
      
      console.log('✅ Store updated with boxes. Current store boxes count:', get().boxes.length);
      
      // Log which racks have boxes
      const boxesByRack = new Map<string, number>();
      boxes.forEach(box => {
        boxesByRack.set(box.rack_id, (boxesByRack.get(box.rack_id) || 0) + 1);
      });
      console.log('📊 Boxes per rack:', Object.fromEntries(boxesByRack));
    } catch (error) {
      console.error('❌ Failed to load inventory data:', error);
    }
  },

  getBoxesByRack: (rackId: string) => {
    return get().boxes.filter(box => box.rack_id === rackId);
  },

  getBoxHierarchy: (boxId: string) => {
    const box = get().boxes.find(b => b.box_id === boxId);
    if (!box) return [];

    const layout = get().warehouseLayout;
    if (!layout) return [boxId];

    const rack = layout.racks.find(r => r.element_id === box.rack_id);
    if (!rack || !rack.hierarchy) return [box.rack_id, boxId];

    return [...rack.hierarchy.path, rack.element_id, boxId];
  },

  toggleHierarchyNode: (nodeId: string) => {
    const expanded = get().hierarchyExpanded;
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    
    set({ hierarchyExpanded: newExpanded });
  },

  searchInventory: (query: string) => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const boxes = get().boxes;

    return boxes.filter(box => {
      // Search by box ID
      if (box.box_id.toLowerCase().includes(lowerQuery)) return true;

      // Search by rack ID
      if (box.rack_id.toLowerCase().includes(lowerQuery)) return true;

      // Search by items in box
      return box.items.some(item => 
        item.sku.toLowerCase().includes(lowerQuery) ||
        item.product_name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
      );
    });
  },
}));
