import { create } from 'zustand';
import type { AppState, Theme, OverlayType, TickerKPIConfig, LensType, Site } from '../types';
import { DataService } from '../services/DataService';
import { MonitoringService } from '../services/MonitoringService';
import { KPISimulationService } from '../services/KPISimulationService';
import { DEFAULT_SITE, getDefaultLenses, getLensById } from '../config/lenses';

// Initialize theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem('warehouse-theme') as Theme | null;
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return systemPreference;
};

// Initialize ticker KPI configuration from localStorage
const getInitialTickerConfig = (): Record<string, TickerKPIConfig> => {
  const stored = localStorage.getItem('warehouse-ticker-config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

// Initialize active lenses from localStorage
const getInitialActiveLenses = (): Set<LensType> => {
  const stored = localStorage.getItem('warehouse-active-lenses');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as LensType[];
      return new Set(parsed);
    } catch {
      return getDefaultLenses() as Set<LensType>;
    }
  }
  return getDefaultLenses() as Set<LensType>;
};

// Initialize current site from localStorage
const getInitialSite = (): Site => {
  const stored = localStorage.getItem('warehouse-current-site');
  if (stored) {
    try {
      return JSON.parse(stored) as Site;
    } catch {
      return DEFAULT_SITE;
    }
  }
  return DEFAULT_SITE;
};

// Simulation interval reference
let simulationInterval: NodeJS.Timeout | null = null;

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
  selectedZone: null,
  selectedRack: null,
  selectedBox: null,
  cameraReset: 0,
  cameraMode: 'perspective',

  // UI state
  theme: getInitialTheme(),
  useRealShadows: true, // Default to real-time shadows for better visual quality
  visibleEntityTypes: new Set(['worker', 'forklift', 'pallet', 'inventory', 'truck']),
  hierarchyExpanded: new Set(),
  leftSidebarCollapsed: false,
  hierarchySectionExpanded: true,
  healthSectionExpanded: true,
  filterSectionExpanded: true,

  // Monitoring state (Slice 2)
  kpis: [],
  selectedKPI: null,
  activeOverlay: null,
  overlayData: new Map(),
  drillDownData: null,
  highlightedZones: new Set(),
  focusedZone: null,
  focusedElementType: null as 'zone' | 'aisle' | 'rack' | null,

  // Ticker configuration
  tickerKPIs: getInitialTickerConfig(),
  simulationEnabled: true, // Default to enabled

  // Lens and context state
  activeLenses: getInitialActiveLenses(),
  currentSite: getInitialSite(),

  // Phase 4: KPI ↔ Overlay Enhancement
  heatMapMode: 'gradient',
  overlayIntensityData: {},
  kpiSpatialContext: null,
  heatMapIntensity: 0.7,
  particleAnimationEnabled: true,

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
        selectedZone: null,
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
      selectedZone: null,
      selectedRack: null,
      selectedBox: null,
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

  selectZone: (zoneId: string | null) => {
    set({ selectedZone: zoneId, selectedRack: null, selectedBox: null });
  },

  selectRack: (rackId: string | null) => {
    set({ selectedRack: rackId, selectedBox: null });
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

  setUseRealShadows: (enabled) => {
    set({ useRealShadows: enabled });
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

  toggleLeftSidebar: () => {
    set({ leftSidebarCollapsed: !get().leftSidebarCollapsed });
  },

  toggleHierarchySection: () => {
    set({ hierarchySectionExpanded: !get().hierarchySectionExpanded });
  },

  toggleHealthSection: () => {
    set({ healthSectionExpanded: !get().healthSectionExpanded });
  },

  toggleFilterSection: () => {
    set({ filterSectionExpanded: !get().filterSectionExpanded });
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

      // Initialize simulation base values and start simulation if enabled
      KPISimulationService.initializeBaseValues(enrichedKPIs);
      if (get().simulationEnabled) {
        get().startKPISimulation();
      }
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
        focusedZone: null,
        focusedElementType: null
      });
      return;
    }

    set({ selectedKPI: kpiId });

    if (!kpiId) {
      set({
        activeOverlay: null,
        drillDownData: null,
        highlightedZones: new Set(),
        focusedZone: null,
        focusedElementType: null
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
    set({ focusedZone: zoneId, focusedElementType: 'zone' });
  },

  focusOnElement: (elementId: string, elementType: 'zone' | 'aisle' | 'rack', _smooth: boolean = true) => {
    set({ focusedZone: elementId, focusedElementType: elementType });
  },

  clearMonitoringState: () => {
    set({
      selectedKPI: null,
      activeOverlay: null,
      drillDownData: null,
      highlightedZones: new Set(),
      focusedZone: null,
      focusedElementType: null
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

  // Ticker configuration actions
  setTickerKPIVisibility: (kpiId: string, visible: boolean) => {
    const tickerKPIs = get().tickerKPIs;
    const currentConfig = tickerKPIs[kpiId] || { visible: true, order: 999 };

    const newConfig = {
      ...tickerKPIs,
      [kpiId]: { ...currentConfig, visible }
    };

    set({ tickerKPIs: newConfig });
    localStorage.setItem('warehouse-ticker-config', JSON.stringify(newConfig));
  },

  setTickerKPIOrder: (kpiIds: string[]) => {
    const tickerKPIs = get().tickerKPIs;
    const newConfig = { ...tickerKPIs };

    kpiIds.forEach((kpiId, index) => {
      const currentConfig = newConfig[kpiId] || { visible: true, order: 999 };
      newConfig[kpiId] = { ...currentConfig, order: index };
    });

    set({ tickerKPIs: newConfig });
    localStorage.setItem('warehouse-ticker-config', JSON.stringify(newConfig));
  },

  setSimulationEnabled: (enabled: boolean) => {
    set({ simulationEnabled: enabled });

    if (enabled) {
      get().startKPISimulation();
    } else {
      get().stopKPISimulation();
    }
  },

  startKPISimulation: () => {
    // Clear existing interval if any
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    // Start new simulation interval
    simulationInterval = setInterval(() => {
      const currentKPIs = get().kpis;
      if (currentKPIs.length > 0) {
        const simulatedKPIs = KPISimulationService.simulateUpdate(currentKPIs);
        set({ kpis: simulatedKPIs });
      }
    }, 4000); // Update every 4 seconds

    console.log('KPI simulation started');
  },

  stopKPISimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      console.log('KPI simulation stopped');
    }
  },

  // Lens and context actions
  toggleLens: (lensType: LensType) => {
    const activeLenses = get().activeLenses;

    // Single-select behavior: only one lens can be active at a time
    // If clicking the same lens, deselect it (return to full view)
    // If clicking a different lens, select only that one
    const newLenses = new Set<LensType>();

    if (!activeLenses.has(lensType)) {
      newLenses.add(lensType);
    }
    // If activeLenses has lensType, newLenses stays empty (deselect)

    set({ activeLenses: newLenses });
    localStorage.setItem('warehouse-active-lenses', JSON.stringify(Array.from(newLenses)));

    // Apply lens effects
    get().applyLensEffects();
  },

  setActiveLenses: (lenses: Set<LensType>) => {
    set({ activeLenses: lenses });
    localStorage.setItem('warehouse-active-lenses', JSON.stringify(Array.from(lenses)));

    // Apply lens effects
    get().applyLensEffects();
  },

  setSite: (site: Site) => {
    set({ currentSite: site });
    localStorage.setItem('warehouse-current-site', JSON.stringify(site));
  },

  // Apply effects when lenses change
  applyLensEffects: () => {
    const activeLenses = get().activeLenses;

    if (activeLenses.size === 0) {
      // No lenses active - show all entities (full warehouse view)
      set({
        visibleEntityTypes: new Set(['worker', 'forklift', 'pallet', 'inventory', 'truck'])
      });
      return;
    }

    // Get entity types from the active lens (only one can be active)
    const lensType = Array.from(activeLenses)[0];
    const lens = getLensById(lensType);

    if (lens) {
      set({ visibleEntityTypes: new Set(lens.entityTypes) as Set<any> });
    }
  },

  // Get entities filtered by active lens
  getEntitiesByLens: () => {
    const entities = get().entities;
    const activeLenses = get().activeLenses;

    if (activeLenses.size === 0) {
      return entities;
    }

    const lensType = Array.from(activeLenses)[0];
    const lens = getLensById(lensType);

    if (!lens) {
      return entities;
    }

    return entities.filter(e => lens.entityTypes.includes(e.entity_type));
  },

  // Phase 4: KPI ↔ Overlay Enhancement actions
  setHeatMapMode: (mode) => set({ heatMapMode: mode }),

  setOverlayIntensityData: (data) => set({ overlayIntensityData: data }),

  setKPISpatialContext: (context) => set({ kpiSpatialContext: context }),

  setHeatMapIntensity: (intensity) => set({
    heatMapIntensity: Math.max(0.3, Math.min(1.0, intensity))
  }),

  toggleParticleAnimation: () => set((state) => ({
    particleAnimationEnabled: !state.particleAnimationEnabled
  })),

  selectKPIWithSpatialContext: (kpi, context) => set({
    selectedKPI: kpi.id,
    kpiSpatialContext: context,
    activeOverlay: context.overlayType,
    heatMapMode: context.visualizationMode,
    overlayIntensityData: context.intensityData
  }),
}));
