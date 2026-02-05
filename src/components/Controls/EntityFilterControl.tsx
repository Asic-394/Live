import React from 'react';
import { useStore } from '../../state/store';
import type { EntityType } from '../../types';

interface EntityTypeInfo {
  type: EntityType;
  label: string;
  icon: string;
  color: string;
}

const entityTypes: EntityTypeInfo[] = [
  { type: 'worker', label: 'Workers', icon: '', color: 'bg-orange-400' },
  { type: 'forklift', label: 'Forklifts', icon: '', color: 'bg-yellow-400' },
  { type: 'pallet', label: 'Pallets', icon: '', color: 'bg-amber-500' },
  { type: 'inventory', label: 'Inventory', icon: '', color: 'bg-gray-400' },
];

export default function EntityFilterControl() {
  const entities = useStore((state) => state.entities);
  const visibleEntityTypes = useStore((state) => state.visibleEntityTypes);
  const toggleEntityType = useStore((state) => state.toggleEntityType);
  const setVisibleEntityTypes = useStore((state) => state.setVisibleEntityTypes);
  const searchInventory = useStore((state) => state.searchInventory);
  const selectBox = useStore((state) => state.selectBox);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [inventorySearch, setInventorySearch] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  // Count entities by type
  const entityCounts = entities.reduce((acc, entity) => {
    acc[entity.entity_type] = (acc[entity.entity_type] || 0) + 1;
    return acc;
  }, {} as Record<EntityType, number>);

  const handleToggleAll = () => {
    if (visibleEntityTypes.size === entityTypes.length) {
      // If all are visible, hide all
      setVisibleEntityTypes(new Set());
    } else {
      // Otherwise, show all
      setVisibleEntityTypes(new Set(entityTypes.map(et => et.type)));
    }
  };

  const allVisible = visibleEntityTypes.size === entityTypes.length;
  const noneVisible = visibleEntityTypes.size === 0;

  // Handle inventory search
  const handleInventorySearch = (query: string) => {
    setInventorySearch(query);
    if (query.trim()) {
      const results = searchInventory(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchResult = (boxId: string) => {
    selectBox(boxId);
    setInventorySearch('');
    setSearchResults([]);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="glass-panel rounded-xl p-3 hover:bg-white/10 transition-all group"
        title="Expand filters"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs text-gray-400 group-hover:text-gray-200">Filters</span>
        </div>
      </button>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4 min-w-[260px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <h3 className="text-sm font-medium text-gray-100">
          Filter Entities
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 
                       text-gray-400 hover:bg-white/10 hover:text-gray-200
                       transition-all border border-white/5"
          >
            {allVisible ? 'Hide All' : 'Show All'}
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Checkboxes */}
      <div className="space-y-3">
        {entityTypes.map(({ type, label, color }) => {
          const count = entityCounts[type] || 0;
          const isVisible = visibleEntityTypes.has(type);

          return (
            <label
              key={type}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                border border-white/5
                ${isVisible 
                  ? 'bg-white/5 hover:bg-white/10 border-white/10' 
                  : 'hover:bg-white/5'
                }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleEntityType(type)}
                className="w-4 h-4 text-blue-400 
                           bg-white/5 border-white/10 
                           rounded focus:ring-2 
                           focus:ring-blue-400/50 cursor-pointer"
              />

              {/* Color Indicator */}
              <div className={`w-3 h-3 rounded-full ${color} shadow-lg`} 
                   style={{ boxShadow: isVisible ? `0 0 8px ${color.replace('bg-', '')}` : 'none' }} />

              {/* Label and Count */}
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${
                  isVisible 
                    ? 'text-gray-100 font-medium' 
                    : 'text-gray-400'
                }`}>
                  {label}
                </span>
                <span className={`text-xs px-2 py-1 rounded-md ${
                  isVisible
                    ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                    : 'bg-white/5 text-gray-500'
                }`}>
                  {count}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Inventory Search */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Search Inventory
        </h4>
        <div className="relative">
          <input
            type="text"
            value={inventorySearch}
            onChange={(e) => handleInventorySearch(e.target.value)}
            placeholder="SKU, product name, box ID..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
          />
          {inventorySearch && (
            <button
              onClick={() => {
                setInventorySearch('');
                setSearchResults([]);
              }}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto bg-white/5 rounded-lg border border-white/10">
            {searchResults.slice(0, 10).map((box) => (
              <button
                key={box.box_id}
                onClick={() => handleSelectSearchResult(box.box_id)}
                className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="text-xs text-emerald-400 font-mono mb-1">{box.box_id}</div>
                <div className="text-xs text-gray-400">
                  {box.rack_id} • Level {box.level} • {box.items.length} items
                </div>
                {box.items.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {box.items.map((item: any) => item.product_name).join(', ')}
                  </div>
                )}
              </button>
            ))}
            {searchResults.length > 10 && (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                +{searchResults.length - 10} more results
              </div>
            )}
          </div>
        )}
        
        {inventorySearch && searchResults.length === 0 && (
          <div className="mt-2 text-xs text-gray-500 text-center py-2">
            No matching inventory found
          </div>
        )}
      </div>

      {/* Warning when all hidden */}
      {noneVisible && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs text-amber-400/80 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-amber-400"></span>
            All entity types are hidden
          </p>
        </div>
      )}
    </div>
  );
}
