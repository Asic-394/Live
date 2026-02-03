import { useState } from 'react';
import { useStore } from '../../state/store';
import type { Entity, WarehouseLayoutElement } from '../../types';

interface InventorySummary {
  totalItems: number;
  uniqueSKUs: number;
  capacityUsed: number;
  capacityPercent: number;
  items: Entity[];
}

function getInventoryForRack(
  rackId: string,
  entities: Entity[],
  rack: WarehouseLayoutElement
): InventorySummary {
  // Find all inventory entities where zone === rackId
  const items = entities.filter(
    (e) => e.entity_type === 'inventory' && e.zone === rackId
  );

  const totalQty = items.reduce((sum, item) => sum + (item.metadata?.qty || 0), 0);

  const uniqueSKUs = new Set(
    items.map((item) => item.metadata?.sku).filter(Boolean)
  ).size;

  const capacity = rack.capacity || 0;
  const capacityPercent = capacity > 0 ? (totalQty / capacity) * 100 : 0;

  return {
    totalItems: items.length,
    uniqueSKUs,
    capacityUsed: totalQty,
    capacityPercent,
    items,
  };
}

function RackDetailView({
  rack,
  inventory,
  selectEntity,
  onClose,
}: {
  rack: WarehouseLayoutElement;
  inventory: InventorySummary;
  selectEntity: (id: string | null) => void;
  onClose: () => void;
}) {
  const [showAllItems, setShowAllItems] = useState(false);
  const displayedItems = showAllItems ? inventory.items : inventory.items.slice(0, 5);

  return (
    <div className="absolute top-20 right-4 w-80 bg-white/85 dark:bg-warehouse-panel/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-300 dark:border-warehouse-border p-5 z-10 text-gray-900 dark:text-warehouse-text-primary max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-blue-600 dark:text-warehouse-accent-cyan tracking-tight">
            {rack.element_id}
          </h2>
          <p className="text-sm text-gray-600 dark:text-warehouse-text-secondary mt-1">
            {rack.name || 'Storage Rack'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-warehouse-text-tertiary hover:text-gray-900 dark:hover:text-warehouse-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Details Grid */}
      <div className="space-y-3">
        {/* Capacity */}
        {rack.capacity && (
          <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-2">Capacity</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-3 bg-gray-200 dark:bg-warehouse-border rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    inventory.capacityPercent > 90
                      ? 'bg-red-500'
                      : inventory.capacityPercent > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(inventory.capacityPercent, 100)}%` }}
                />
              </div>
              <div className="text-sm font-medium">{inventory.capacityPercent.toFixed(0)}%</div>
            </div>
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary">
              {inventory.capacityUsed} / {rack.capacity} units
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
          <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-2">Statistics</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary">Items</div>
              <div className="text-lg font-semibold text-blue-600 dark:text-warehouse-accent-cyan">{inventory.totalItems}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary">Unique SKUs</div>
              <div className="text-lg font-semibold text-blue-600 dark:text-warehouse-accent-cyan">{inventory.uniqueSKUs}</div>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        {inventory.items.length > 0 ? (
          <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-2">
              Inventory ({inventory.items.length} items)
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {displayedItems.map((item) => (
                <div
                  key={item.entity_id}
                  className="bg-gray-100 dark:bg-warehouse-bg/50 rounded p-2 hover:bg-gray-200 dark:hover:bg-warehouse-bg/70 transition-colors cursor-pointer"
                  onClick={() => {
                    selectEntity(item.entity_id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900 dark:text-warehouse-text-primary">
                        {item.entity_id}
                      </div>
                      {item.metadata?.sku && (
                        <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary">
                          SKU: {item.metadata.sku}
                        </div>
                      )}
                    </div>
                    {item.metadata?.qty && (
                      <div className="text-xs font-semibold text-blue-600 dark:text-warehouse-accent-cyan">
                        Qty: {item.metadata.qty}
                      </div>
                    )}
                  </div>
                  {item.metadata?.level && (
                    <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary mt-1">
                      Level: {item.metadata.level}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {inventory.items.length > 5 && (
              <button
                onClick={() => setShowAllItems(!showAllItems)}
                className="text-xs text-blue-600 dark:text-warehouse-accent-cyan hover:underline mt-2 w-full text-center"
              >
                {showAllItems ? 'Show less' : `Show ${inventory.items.length - 5} more...`}
              </button>
            )}
          </div>
        ) : (
          <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-2">Inventory</div>
            <div className="text-sm text-gray-600 dark:text-warehouse-text-secondary italic">No inventory stored</div>
          </div>
        )}

        {/* Rack Details */}
        <div>
          <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-2">Details</div>
          <div className="bg-gray-100 dark:bg-warehouse-bg/50 rounded p-2 space-y-1">
            {rack.metadata?.levels && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-warehouse-text-tertiary">Levels:</span>
                <span className="text-gray-700 dark:text-warehouse-text-secondary">{rack.metadata.levels}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-warehouse-text-tertiary">Dimensions:</span>
              <span className="text-gray-700 dark:text-warehouse-text-secondary">
                {rack.width}×{rack.depth}×{rack.height || 18} ft
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-warehouse-text-tertiary">Position:</span>
              <span className="text-gray-700 dark:text-warehouse-text-secondary">
                ({rack.x.toFixed(1)}, {rack.y.toFixed(1)}, {rack.z?.toFixed(1) || '0.0'})
              </span>
            </div>
            {rack.capacity && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-warehouse-text-tertiary">Total Capacity:</span>
                <span className="text-gray-700 dark:text-warehouse-text-secondary">{rack.capacity} units</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EntityDetailPanel() {
  const selectedEntity = useStore((state) => state.selectedEntity);
  const selectedRack = useStore((state) => state.selectedRack);
  const entities = useStore((state) => state.entities);
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const selectEntity = useStore((state) => state.selectEntity);
  const selectRack = useStore((state) => state.selectRack);

  // Prioritize rack selection
  if (selectedRack && warehouseLayout) {
    const rack = warehouseLayout.racks.find((r) => r.element_id === selectedRack);
    if (rack) {
      const inventory = getInventoryForRack(selectedRack, entities, rack);
      return <RackDetailView rack={rack} inventory={inventory} selectEntity={selectEntity} onClose={() => selectRack(null)} />;
    }
  }

  // Fall back to entity selection
  const entity = entities.find((e) => e.entity_id === selectedEntity);

  if (!entity) return null;

  return (
    <div className="absolute top-20 right-4 w-80 bg-white/85 dark:bg-warehouse-panel/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-300 dark:border-warehouse-border p-5 z-10 text-gray-900 dark:text-warehouse-text-primary">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-blue-600 dark:text-warehouse-accent-cyan tracking-tight">{entity.entity_id}</h2>
          <p className="text-sm text-gray-600 dark:text-warehouse-text-secondary capitalize mt-1">{entity.entity_type}</p>
        </div>
        <button
          onClick={() => selectEntity(null)}
          className="text-gray-500 dark:text-warehouse-text-tertiary hover:text-gray-900 dark:hover:text-warehouse-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Details Grid */}
      <div className="space-y-3">
        {/* Status */}
        <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
          <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-1">Status</div>
          <div className="text-base font-medium capitalize">{entity.status}</div>
        </div>

        {/* Location */}
        <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
          <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-1">Location</div>
          <div className="text-base font-medium">{entity.zone}</div>
          <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary mt-1">
            ({entity.x.toFixed(1)}, {entity.y.toFixed(1)}, {entity.z?.toFixed(1) || '0.0'})
          </div>
        </div>

        {/* Task */}
        {entity.task && (
          <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-1">Task</div>
            <div className="text-base font-medium capitalize">{entity.task}</div>
          </div>
        )}

        {/* Assigned To */}
        {entity.assigned_to && (
          <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-1">Assigned To</div>
            <div className="text-base font-medium">{entity.assigned_to}</div>
          </div>
        )}

        {/* Battery Level (for equipment) */}
        {entity.battery_level !== undefined && (
          <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-1">Battery Level</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-warehouse-border rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    entity.battery_level > 60
                      ? 'bg-green-500'
                      : entity.battery_level > 30
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${entity.battery_level}%` }}
                />
              </div>
              <div className="text-sm font-medium">{entity.battery_level}%</div>
            </div>
          </div>
        )}

        {/* Speed */}
        {entity.speed !== undefined && entity.speed > 0 && (
          <div className="border-b border-gray-200 dark:border-warehouse-border/50 pb-3">
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-1">Speed</div>
            <div className="text-base font-medium">{entity.speed.toFixed(1)} ft/s</div>
          </div>
        )}

        {/* Metadata */}
        {entity.metadata && Object.keys(entity.metadata).length > 0 && (
          <div>
            <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary uppercase tracking-wider mb-2">Additional Info</div>
            <div className="bg-gray-100 dark:bg-warehouse-bg/50 rounded p-2 space-y-1">
              {Object.entries(entity.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-warehouse-text-tertiary">{key}:</span>
                  <span className="text-gray-700 dark:text-warehouse-text-secondary">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 dark:text-warehouse-text-tertiary pt-2">
          Last updated: {new Date(entity.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
