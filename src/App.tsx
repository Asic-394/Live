import { useEffect, useRef } from 'react';
import { useStore } from './state/store';
import WarehouseScene from './components/Scene/WarehouseScene';
import DatasetSelector from './components/Controls/DatasetSelector';
import ResetButton from './components/Controls/ResetButton';
import StatusBar from './components/Controls/StatusBar';
import EntityDetailPanel from './components/Panels/EntityDetailPanel';
import ErrorDisplay from './components/Controls/ErrorDisplay';
import ViewGizmo from './components/UI/ViewGizmo';
import ThemeToggle from './components/UI/ThemeToggle';

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
    <div className="w-full h-full relative bg-gray-200 dark:bg-[#1a1d22]">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <DatasetSelector />
        <ResetButton />
      </div>

      {/* Status Bar and Theme Toggle */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <ThemeToggle />
        <StatusBar />
      </div>

      {/* 3D Scene */}
      <WarehouseScene controlsRef={controlsRef} />

      {/* View Gizmo with Camera Controls */}
      <ViewGizmo controlsRef={controlsRef} />

      {/* Entity Detail Panel */}
      <EntityDetailPanel />

      {/* Error Display */}
      <ErrorDisplay />
    </div>
  );
}

export default App;
