import { create } from 'zustand';
import type { AppState } from '../types';
import { DataService } from '../services/DataService';

export const useStore = create<AppState>((set, get) => ({
  // Data state
  currentDataset: null,
  warehouseLayout: null,
  entities: [],
  loadingState: 'idle',
  error: null,

  // Scene state
  selectedEntity: null,
  selectedRack: null,
  cameraReset: 0,
  cameraMode: 'perspective',

  // Actions
  loadDataset: async (datasetId: string) => {
    set({ loadingState: 'loading', error: null });

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
        cameraReset: get().cameraReset + 1, // Trigger camera reset
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

  setError: (error: string | null) => {
    set({ error });
  },

  setCameraMode: (mode) => {
    set({ cameraMode: mode });
  },
}));
