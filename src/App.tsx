import { useEffect, useRef } from 'react';
import { useStore } from './state/store';
import WarehouseScene from './components/Scene/WarehouseScene';
import DatasetSelector from './components/Controls/DatasetSelector';
import ResetButton from './components/Controls/ResetButton';
import StatusBar from './components/Controls/StatusBar';
import EntityDetailPanel from './components/Panels/EntityDetailPanel';
import HierarchyPanel from './components/Panels/HierarchyPanel';
import ErrorDisplay from './components/Controls/ErrorDisplay';
import ViewGizmo from './components/UI/ViewGizmo';
import ThemeToggle from './components/UI/ThemeToggle';
import EntityFilterControl from './components/Controls/EntityFilterControl';
import KPIPanel from './components/Panels/KPIPanel';
import DrillDownPanel from './components/Panels/DrillDownPanel';
import OverlayLegend from './components/Controls/OverlayLegend';

function App() {
  const loadDataset = useStore((state) => state.loadDataset);
  const loadingState = useStore((state) => state.loadingState);
  const theme = useStore((state) => state.theme);
  const controlsRef = useRef<any>(null);

  // Load default dataset on mount
  useEffect(() => {
    if (loadingState === 'idle') {
      loadDataset('scenario_normal');
    }
  }, [loadDataset, loadingState]);

  // Apply theme class to document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="w-full h-full relative bg-gray-200 dark:bg-gradient-to-br dark:from-[#0d0f14] dark:via-[#0a0c11] dark:to-[#08090d]">
      {/* Top Controls */}
      <div className="absolute top-6 left-6 z-10 flex gap-3">
        <DatasetSelector />
        <ResetButton />
      </div>

      {/* Hierarchy Panel */}
      <HierarchyPanel />

      {/* Entity Filter Control */}
      <div className="absolute top-52 left-6 z-10">
        <EntityFilterControl />
      </div>

      {/* Status Bar, Theme Toggle, and Overlay Legend */}
      <div className="absolute top-6 right-6 z-10 flex gap-3">
        <OverlayLegend />
        <ThemeToggle />
        <StatusBar />
      </div>

      {/* KPI Panel (bottom-left) */}
      <div className="absolute bottom-6 left-6 z-10">
        <KPIPanel />
      </div>

      {/* 3D Scene */}
      <WarehouseScene controlsRef={controlsRef} />

      {/* View Gizmo with Camera Controls */}
      <ViewGizmo controlsRef={controlsRef} />

      {/* Entity Detail Panel */}
      <EntityDetailPanel />

      {/* Drill-Down Panel (Slice 2) */}
      <DrillDownPanel />

      {/* Error Display */}
      <ErrorDisplay />
    </div>
  );
}

export default App;
