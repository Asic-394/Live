import { useStore } from '../../state/store';
import { DataService } from '../../services/DataService';

export default function DatasetSelector() {
  const currentDataset = useStore((state) => state.currentDataset);
  const loadDataset = useStore((state) => state.loadDataset);
  const loadingState = useStore((state) => state.loadingState);

  const datasets = DataService.getDatasets();

  return (
    <div className="relative">
      <select
        value={currentDataset || ''}
        onChange={(e) => loadDataset(e.target.value)}
        disabled={loadingState === 'loading'}
        className="appearance-none bg-white/90 dark:bg-warehouse-panel/90 backdrop-blur-md text-gray-900 dark:text-warehouse-text-primary px-4 py-2.5 pr-10 rounded-lg shadow-lg border border-gray-300 dark:border-warehouse-border hover:bg-gray-100 dark:hover:bg-warehouse-panelHover hover:border-gray-400 dark:hover:border-warehouse-border/70 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-warehouse-accent-cyan/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        {datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.name}
          </option>
        ))}
      </select>
      
      {/* Dropdown arrow */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-500 dark:text-warehouse-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {loadingState === 'loading' && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-warehouse-accent-cyan border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
