import { useState } from 'react';
import { useStore } from '../../state/store';
import type { Entity, WarehouseLayoutElement, Box } from '../../types';

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

function BoxDetailView({
  box,
  onClose,
}: {
  box: Box;
  onClose: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const selectBox = useStore((state) => state.selectBox);
  const selectRack = useStore((state) => state.selectRack);
  const getBoxHierarchy = useStore((state) => state.getBoxHierarchy);
  
  const hierarchy = getBoxHierarchy(box.box_id);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-28 right-6 z-10 glass-panel rounded-xl p-3 hover:bg-white/10 transition-all group"
        title={`Expand ${box.box_id}`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-gray-400 group-hover:text-gray-200">{box.box_id}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="absolute top-28 right-6 w-96 glass-panel rounded-xl p-6 z-10 text-gray-100 max-h-[calc(100vh-8rem)] overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-emerald-400 tracking-tight">
            {box.box_id}
          </h2>
          <p className="text-sm text-gray-400 mt-1">Inventory Box</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Collapse"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Location Hierarchy */}
      <div className="border-b border-white/5 pb-4 mb-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Location Hierarchy</div>
        <div className="flex items-center gap-1 text-xs text-gray-300 flex-wrap">
          {hierarchy.map((node, i) => (
            <div key={node} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-600">→</span>}
              <button
                onClick={() => {
                  if (node.startsWith('Rack-')) {
                    selectRack(node);
                    selectBox(null);
                  }
                }}
                className={`px-2 py-1 rounded ${
                  node.startsWith('Rack-') ? 'hover:bg-white/5 cursor-pointer' : ''
                } ${i === hierarchy.length - 1 ? 'bg-emerald-500/20 text-emerald-300' : ''}`}
              >
                {node}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-4">
        {/* Status & Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border-b border-white/5 pb-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
            <div className="text-sm font-medium capitalize text-gray-100">{box.status}</div>
          </div>
          <div className="border-b border-white/5 pb-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Level</div>
            <div className="text-sm font-medium text-gray-100">Level {box.level}</div>
          </div>
        </div>

        {/* Capacity */}
        <div className="border-b border-white/5 pb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Capacity Used</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  box.capacity_used > 80
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : box.capacity_used > 60
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                }`}
                style={{ width: `${box.capacity_used}%` }}
              />
            </div>
            <div className="text-sm font-medium text-gray-100">{box.capacity_used}%</div>
          </div>
        </div>

        {/* Contents Table */}
        {box.items.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Contents ({box.items.length} {box.items.length === 1 ? 'item' : 'items'})
            </div>
            <div className="bg-white/5 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-2 text-gray-400 font-medium">SKU</th>
                    <th className="text-left p-2 text-gray-400 font-medium">Product</th>
                    <th className="text-right p-2 text-gray-400 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {box.items.map((item, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="p-2 text-emerald-400 font-mono">{item.sku}</td>
                      <td className="p-2 text-gray-300">{item.product_name}</td>
                      <td className="p-2 text-right text-gray-300">
                        {item.quantity} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Item details expansion */}
            <div className="mt-3 space-y-2">
              {box.items.map((item, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-gray-300">{item.category}</span>
                  </div>
                  {item.weight && (
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Weight:</span>
                      <span className="text-gray-300">{item.weight} lbs/unit</span>
                    </div>
                  )}
                  {item.received_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Received:</span>
                      <span className="text-gray-300">{item.received_date}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 pt-2">
          Last updated: {new Date(box.last_updated).toLocaleString()}
        </div>
      </div>
    </div>
  );
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const displayedItems = showAllItems ? inventory.items : inventory.items.slice(0, 5);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-28 right-6 z-10 glass-panel rounded-xl p-3 hover:bg-white/10 transition-all group"
        title={`Expand ${rack.element_id}`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-gray-400 group-hover:text-gray-200">{rack.element_id}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="absolute top-28 right-6 w-80 glass-panel rounded-xl p-6 z-10 text-gray-100 max-h-[calc(100vh-8rem)] overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-blue-400 tracking-tight">
            {rack.element_id}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {rack.name || 'Storage Rack'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-4">
        {/* Capacity */}
        {rack.capacity && (
          <div className="border-b border-white/5 pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Capacity</div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    inventory.capacityPercent > 90
                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                      : inventory.capacityPercent > 70
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(inventory.capacityPercent, 100)}%` }}
                />
              </div>
              <div className="text-sm font-medium text-gray-100">{inventory.capacityPercent.toFixed(0)}%</div>
            </div>
            <div className="text-xs text-gray-500">
              {inventory.capacityUsed} / {rack.capacity} units
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="border-b border-white/5 pb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Statistics</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">Items</div>
              <div className="text-lg font-semibold text-blue-400">{inventory.totalItems}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Unique SKUs</div>
              <div className="text-lg font-semibold text-blue-400">{inventory.uniqueSKUs}</div>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        {inventory.items.length > 0 ? (
          <div className="border-b border-white/5 pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Inventory ({inventory.items.length} items)
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {displayedItems.map((item) => (
                <div
                  key={item.entity_id}
                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 border border-white/5 hover:border-blue-400/30 transition-all cursor-pointer"
                  onClick={() => {
                    selectEntity(item.entity_id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-100">
                        {item.entity_id}
                      </div>
                      {item.metadata?.sku && (
                        <div className="text-xs text-gray-500">
                          SKU: {item.metadata.sku}
                        </div>
                      )}
                    </div>
                    {item.metadata?.qty && (
                      <div className="text-xs font-semibold text-blue-400">
                        Qty: {item.metadata.qty}
                      </div>
                    )}
                  </div>
                  {item.metadata?.level && (
                    <div className="text-xs text-gray-500 mt-1">
                      Level: {item.metadata.level}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {inventory.items.length > 5 && (
              <button
                onClick={() => setShowAllItems(!showAllItems)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-3 w-full text-center"
              >
                {showAllItems ? 'Show less' : `Show ${inventory.items.length - 5} more...`}
              </button>
            )}
          </div>
        ) : (
          <div className="border-b border-white/5 pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Inventory</div>
            <div className="text-sm text-gray-500 italic">No inventory stored</div>
          </div>
        )}

        {/* Rack Details */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Details</div>
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            {rack.metadata?.levels && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Levels:</span>
                <span className="text-gray-300">{rack.metadata.levels}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Dimensions:</span>
              <span className="text-gray-300">
                {rack.width}×{rack.depth}×{rack.height || 18} ft
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Position:</span>
              <span className="text-gray-300">
                ({rack.x.toFixed(1)}, {rack.y.toFixed(1)}, {rack.z?.toFixed(1) || '0.0'})
              </span>
            </div>
            {rack.capacity && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Capacity:</span>
                <span className="text-gray-300">{rack.capacity} units</span>
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
  const selectedBox = useStore((state) => state.selectedBox);
  const entities = useStore((state) => state.entities);
  const boxes = useStore((state) => state.boxes);
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const selectEntity = useStore((state) => state.selectEntity);
  const selectRack = useStore((state) => state.selectRack);
  const selectBox = useStore((state) => state.selectBox);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Prioritize box selection
  if (selectedBox) {
    const box = boxes.find((b) => b.box_id === selectedBox);
    if (box) {
      return <BoxDetailView box={box} onClose={() => selectBox(null)} />;
    }
  }

  // Then rack selection
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

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-28 right-6 z-10 glass-panel rounded-xl p-3 hover:bg-white/10 transition-all group"
        title={`Expand ${entity.entity_id}`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-gray-400 group-hover:text-gray-200">{entity.entity_id}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="absolute top-28 right-6 w-80 glass-panel rounded-xl p-6 z-10 text-gray-100 max-h-[calc(100vh-8rem)] overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-blue-400 tracking-tight">{entity.entity_id}</h2>
          <p className="text-sm text-gray-400 capitalize mt-1">{entity.entity_type}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => selectEntity(null)}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-4">
        {/* Status */}
        <div className="border-b border-white/5 pb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Status</div>
          <div className="text-base font-medium capitalize text-gray-100">{entity.status}</div>
        </div>

        {/* Location */}
        <div className="border-b border-white/5 pb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Location</div>
          <div className="text-base font-medium text-gray-100">{entity.zone}</div>
          <div className="text-xs text-gray-500 mt-1">
            ({entity.x.toFixed(1)}, {entity.y.toFixed(1)}, {entity.z?.toFixed(1) || '0.0'})
          </div>
        </div>

        {/* Task */}
        {entity.task && (
          <div className="border-b border-white/5 pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Task</div>
            <div className="text-base font-medium capitalize text-gray-100">{entity.task}</div>
          </div>
        )}

        {/* Assigned To */}
        {entity.assigned_to && (
          <div className="border-b border-white/5 pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Assigned To</div>
            <div className="text-base font-medium text-gray-100">{entity.assigned_to}</div>
          </div>
        )}

        {/* Battery Level (for equipment) */}
        {entity.battery_level !== undefined && (
          <div className="border-b border-white/5 pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Battery Level</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    entity.battery_level > 60
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : entity.battery_level > 30
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{ width: `${entity.battery_level}%` }}
                />
              </div>
              <div className="text-sm font-medium text-gray-100">{entity.battery_level}%</div>
            </div>
          </div>
        )}

        {/* Speed */}
        {entity.speed !== undefined && entity.speed > 0 && (
          <div className="border-b border-white/5 pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Speed</div>
            <div className="text-base font-medium text-gray-100">{entity.speed.toFixed(1)} ft/s</div>
          </div>
        )}

        {/* Metadata */}
        {entity.metadata && Object.keys(entity.metadata).length > 0 && (
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Additional Info</div>
            <div className="bg-white/5 rounded-lg p-3 space-y-2">
              {Object.entries(entity.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-500">{key}:</span>
                  <span className="text-gray-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 pt-2">
          Last updated: {new Date(entity.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
