import { useStore } from '../../state/store';
import { DataService } from '../../services/DataService';

export default function StatusBar() {
  const currentDataset = useStore((state) => state.currentDataset);
  const entities = useStore((state) => state.entities);
  const loadingState = useStore((state) => state.loadingState);

  if (loadingState !== 'success') return null;

  const dataset = currentDataset ? DataService.getDataset(currentDataset) : null;
  const timestamp = entities.length > 0 ? entities[0].timestamp : null;

  return (
    <div className="bg-warehouse-panel/90 backdrop-blur-md text-warehouse-text-primary px-4 py-2.5 rounded-lg shadow-lg border border-warehouse-border">
      <div className="flex flex-col gap-1">
        {dataset && (
          <div className="text-sm font-medium">{dataset.name}</div>
        )}
        <div className="text-xs text-warehouse-text-secondary">
          {entities.length} entities
          {timestamp && (
            <span className="ml-2">
              • {new Date(timestamp).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
