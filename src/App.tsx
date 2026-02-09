import { useEffect, useRef } from 'react';
import { useStore } from './state/store';
import WarehouseScene from './components/Scene/WarehouseScene';
import StatusBar from './components/Controls/StatusBar';
import EntityDetailPanel from './components/Panels/EntityDetailPanel';
import ErrorDisplay from './components/Controls/ErrorDisplay';
import ViewGizmo from './components/UI/ViewGizmo';
import DrillDownPanel from './components/Panels/DrillDownPanel';
import OverlayLegend from './components/Controls/OverlayLegend';
import LeftSidebar from './components/Layout/LeftSidebar';
import ObjectiveBar from './components/Layout/ObjectiveBar';
import TopNavBar from './components/Layout/TopNavBar';

function App() {
  const loadDataset = useStore((state) => state.loadDataset);
  const loadingState = useStore((state) => state.loadingState);
  const theme = useStore((state) => state.theme);
  const stopKPISimulation = useStore((state) => state.stopKPISimulation);
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

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      stopKPISimulation();
    };
  }, [stopKPISimulation]);

  return (
    <div className="w-full h-full relative bg-gray-200 dark:bg-gradient-to-br dark:from-[#0d0f14] dark:via-[#0a0c11] dark:to-[#08090d]">
      {/* Objective Bar - Top persistent bar with KPI ticker */}
      <ObjectiveBar />

      {/* Top Navigation Bar - Below ObjectiveBar with lenses and context controls */}
      <TopNavBar />

      {/* Left Sidebar - Positioned with top offset to account for both bars */}
      <LeftSidebar />

      {/* Status Bar and Overlay Legend - Adjusted position */}
      <div className="absolute top-28 right-6 z-10 flex gap-3">
        <OverlayLegend />
        <StatusBar />
      </div>

      {/* 3D Scene */}
      <WarehouseScene controlsRef={controlsRef} />

      {/* View Gizmo with Camera Controls */}
      <ViewGizmo controlsRef={controlsRef} />

      {/* Entity Detail Panel - Adjusted top position for both bars */}
      <div style={{ position: 'absolute', top: '7.5rem', right: '1.5rem', zIndex: 10 }}>
        <EntityDetailPanel />
      </div>

      {/* Drill-Down Panel - Adjusted top position for both bars */}
      <div style={{ position: 'absolute', top: '7.5rem', right: '1.5rem', zIndex: 10 }}>
        <DrillDownPanel />
      </div>

      {/* Error Display */}
      <ErrorDisplay />
    </div>
  );
}

export default App;
