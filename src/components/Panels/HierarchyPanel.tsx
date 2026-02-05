import { useState } from 'react';
import { useStore } from '../../state/store';
import type { WarehouseLayoutElement } from '../../types';

interface TreeNodeProps {
  id: string;
  label: string;
  type: 'zone' | 'aisle' | 'rack' | 'box';
  level: number;
  children?: React.ReactNode;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isSelected: boolean;
  metadata?: React.ReactNode;
}

function TreeNode({
  label,
  type,
  level,
  children,
  isExpanded,
  hasChildren,
  onToggle,
  onSelect,
  isSelected,
  metadata,
}: TreeNodeProps) {
  const icons = {
    zone: '📦',
    aisle: '🛤️',
    rack: '🏗️',
    box: '📊',
  };

  return (
    <div className={`text-sm ${level === 0 ? 'mb-2' : ''}`}>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer transition-colors ${
          isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${level * 1.25}rem` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        
        <span className="text-base">{icons[type]}</span>
        
        <button
          onClick={onSelect}
          className="flex-1 text-left flex items-center justify-between group"
        >
          <span className={`${isSelected ? 'font-medium' : ''}`}>{label}</span>
          {metadata && (
            <span className="text-xs text-gray-500 group-hover:text-gray-400">
              {metadata}
            </span>
          )}
        </button>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {children}
        </div>
      )}
    </div>
  );
}

export default function HierarchyPanel() {
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const boxes = useStore((state) => state.boxes);
  const hierarchyExpanded = useStore((state) => state.hierarchyExpanded);
  const toggleHierarchyNode = useStore((state) => state.toggleHierarchyNode);
  const selectRack = useStore((state) => state.selectRack);
  const selectBox = useStore((state) => state.selectBox);
  const focusOnZone = useStore((state) => state.focusOnZone);
  const selectedRack = useStore((state) => state.selectedRack);
  const selectedBox = useStore((state) => state.selectedBox);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!warehouseLayout) return null;

  // Build hierarchy tree
  const zones = warehouseLayout.zones;
  const aisles = warehouseLayout.aisles;
  const racks = warehouseLayout.racks;

  // Group aisles by zone
  const aislesByZone = aisles.reduce((acc, aisle) => {
    const zoneId = aisle.hierarchy?.parent_id || 'Unknown';
    if (!acc[zoneId]) acc[zoneId] = [];
    acc[zoneId].push(aisle);
    return acc;
  }, {} as Record<string, WarehouseLayoutElement[]>);

  // Group racks by aisle
  const racksByAisle = racks.reduce((acc, rack) => {
    const aisleId = rack.hierarchy?.parent_id || 'Unknown';
    if (!acc[aisleId]) acc[aisleId] = [];
    acc[aisleId].push(rack);
    return acc;
  }, {} as Record<string, WarehouseLayoutElement[]>);

  // Group boxes by rack
  const boxesByRack = boxes.reduce((acc, box) => {
    if (!acc[box.rack_id]) acc[box.rack_id] = [];
    acc[box.rack_id].push(box);
    return acc;
  }, {} as Record<string, typeof boxes>);

  // Filter based on search
  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredZones = zones.filter(zone => 
    matchesSearch(zone.element_id) || 
    matchesSearch(zone.name || '')
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-28 left-6 z-10 glass-panel rounded-xl p-3 hover:bg-white/10 transition-all group"
        title="Show Hierarchy"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm text-gray-400 group-hover:text-gray-200">Hierarchy</span>
        </div>
      </button>
    );
  }

  return (
    <div className="absolute top-28 left-6 w-80 glass-panel rounded-xl p-4 z-10 text-gray-100 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-blue-400">Warehouse Hierarchy</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-white/5"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hierarchy..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filteredZones.map((zone) => {
          const zoneId = zone.element_id;
          const zoneAisles = aislesByZone[zoneId] || [];
          const isZoneExpanded = hierarchyExpanded.has(zoneId);

          return (
            <TreeNode
              key={zoneId}
              id={zoneId}
              label={zone.name || zoneId}
              type="zone"
              level={0}
              isExpanded={isZoneExpanded}
              hasChildren={zoneAisles.length > 0}
              onToggle={() => toggleHierarchyNode(zoneId)}
              onSelect={() => focusOnZone(zoneId, true)}
              isSelected={false}
            >
              {zoneAisles.map((aisle) => {
                const aisleId = aisle.element_id;
                const aisleRacks = racksByAisle[aisleId] || [];
                const isAisleExpanded = hierarchyExpanded.has(aisleId);

                return (
                  <TreeNode
                    key={aisleId}
                    id={aisleId}
                    label={aisle.name || aisleId}
                    type="aisle"
                    level={1}
                    isExpanded={isAisleExpanded}
                    hasChildren={aisleRacks.length > 0}
                    onToggle={() => toggleHierarchyNode(aisleId)}
                    onSelect={() => focusOnZone(aisleId, true)}
                    isSelected={false}
                  >
                    {aisleRacks.map((rack) => {
                      const rackId = rack.element_id;
                      const rackBoxes = boxesByRack[rackId] || [];
                      const isRackExpanded = hierarchyExpanded.has(rackId);
                      
                      // Calculate occupancy
                      const totalBoxes = rackBoxes.length;
                      const levels = rack.metadata?.levels || 7;
                      const occupancyPercent = Math.round((totalBoxes / (levels * 4)) * 100);

                      return (
                        <TreeNode
                          key={rackId}
                          id={rackId}
                          label={rack.name || rackId}
                          type="rack"
                          level={2}
                          isExpanded={isRackExpanded}
                          hasChildren={rackBoxes.length > 0}
                          onToggle={() => toggleHierarchyNode(rackId)}
                          onSelect={() => {
                            selectRack(rackId);
                            selectBox(null);
                          }}
                          isSelected={selectedRack === rackId && !selectedBox}
                          metadata={`${totalBoxes} boxes (${occupancyPercent}%)`}
                        >
                          {rackBoxes.map((box) => {
                            const capacityColor = 
                              box.capacity_used > 80 ? 'text-red-400' :
                              box.capacity_used > 60 ? 'text-amber-400' :
                              'text-emerald-400';

                            return (
                              <TreeNode
                                key={box.box_id}
                                id={box.box_id}
                                label={`L${box.level}-P${box.position}`}
                                type="box"
                                level={3}
                                isExpanded={false}
                                hasChildren={false}
                                onToggle={() => {}}
                                onSelect={() => selectBox(box.box_id)}
                                isSelected={selectedBox === box.box_id}
                                metadata={
                                  <span className={capacityColor}>
                                    {box.capacity_used}% • {box.items.length} items
                                  </span>
                                }
                              />
                            );
                          })}
                        </TreeNode>
                      );
                    })}
                  </TreeNode>
                );
              })}
            </TreeNode>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 flex justify-between">
        <span>{zones.length} zones</span>
        <span>{racks.length} racks</span>
        <span>{boxes.length} boxes</span>
      </div>
    </div>
  );
}
