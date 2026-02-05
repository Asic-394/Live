import { useStore } from '../../state/store';
import { DataService } from '../../services/DataService';

export default function StatusBar() {
  const currentDataset = useStore((state) => state.currentDataset);
  const entities = useStore((state) => state.entities);
  const loadingState = useStore((state) => state.loadingState);
  const visibleEntityTypes = useStore((state) => state.visibleEntityTypes);

  if (loadingState !== 'success') return null;

  const dataset = currentDataset ? DataService.getDataset(currentDataset) : null;
  const timestamp = entities.length > 0 ? entities[0].timestamp : null;

  // Calculate visible entity count
  const visibleCount = entities.filter(e => visibleEntityTypes.has(e.entity_type)).length;
  const totalCount = entities.length;
  const isFiltered = visibleCount !== totalCount;

  return (
    <div className="glass-panel px-4 py-2.5 rounded-lg">
      <div className="flex flex-col gap-1">
        {dataset && (
          <div className="text-sm font-medium text-gray-100">{dataset.name}</div>
        )}
        <div className="text-xs text-gray-400">
          {isFiltered ? (
            <>
              <span className="font-medium text-blue-400">
                {visibleCount}
              </span>
              <span className="text-gray-500">
                {' '}/ {totalCount}
              </span>
              {' '}entities
            </>
          ) : (
            `${totalCount} entities`
          )}
          {timestamp && (
            <span className="ml-2 text-gray-500">
              • {new Date(timestamp).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
