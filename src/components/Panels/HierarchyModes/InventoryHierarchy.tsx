import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../../state/store';
import type { WarehouseLayoutElement } from '../../../types';

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
  const typeIcon: Record<string, React.ReactNode> = {
    zone: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    aisle: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    rack: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    box: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  };

  return (
    <div className={`text-sm ${level === 0 ? 'mb-2' : ''}`}>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors ${
          isSelected ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
        }`}
        style={{ paddingLeft: `${level * 1.25}rem` }}
        data-selected={isSelected ? 'true' : undefined}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
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

        {typeIcon[type]}
        
        <button
          onClick={onSelect}
          className="flex-1 text-left flex items-center justify-between group"
        >
          <span className={`${isSelected ? 'font-medium' : ''}`}>{label}</span>
          {metadata && (
            <span className="text-xs text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400">
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

export default function InventoryHierarchy() {
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const boxes = useStore((state) => state.boxes);
  const hierarchyExpanded = useStore((state) => state.hierarchyExpanded);
  const toggleHierarchyNode = useStore((state) => state.toggleHierarchyNode);
  const selectZone = useStore((state) => state.selectZone);
  const selectRack = useStore((state) => state.selectRack);
  const selectBox = useStore((state) => state.selectBox);
  const focusOnElement = useStore((state) => state.focusOnElement);
  const selectedZone = useStore((state) => state.selectedZone);
  const selectedRack = useStore((state) => state.selectedRack);
  const selectedBox = useStore((state) => state.selectedBox);
  
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const selected = container.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedZone, selectedRack, selectedBox]);

  if (!warehouseLayout) return null;

  // Build hierarchy tree
  const zones = warehouseLayout.zones;
  const aisles = warehouseLayout.aisles;
  const racks = warehouseLayout.racks;

  // Helper function to extract zone letter and format label
  const getZoneLabel = (zone: WarehouseLayoutElement): string => {
    const zoneLetter = zone.element_id.split('-')[1] || '';
    const zoneName = zone.name || zone.element_id;
    return zoneLetter ? `Zone ${zoneLetter} - ${zoneName}` : zoneName;
  };

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

  return (
    <div className="w-full text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Search */}
      <div className="mb-3 px-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search inventory hierarchy..."
          className="w-full bg-black/5 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
        />
      </div>

      {/* Tree */}
      <div ref={scrollContainerRef} className="max-h-[400px] overflow-y-auto space-y-1 px-2">
        {filteredZones.map((zone) => {
          const zoneId = zone.element_id;
          const zoneAisles = aislesByZone[zoneId] || [];
          const isZoneExpanded = hierarchyExpanded.has(zoneId);

          return (
            <TreeNode
              key={zoneId}
              id={zoneId}
              label={getZoneLabel(zone)}
              type="zone"
              level={0}
              isExpanded={isZoneExpanded}
              hasChildren={zoneAisles.length > 0}
              onToggle={() => toggleHierarchyNode(zoneId)}
              onSelect={() => {
                selectZone(zoneId);
                focusOnElement(zoneId, 'zone', true);
              }}
              isSelected={selectedZone === zoneId}
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
                    onSelect={() => focusOnElement(aisleId, 'aisle', true)}
                    isSelected={false}
                  >
                    {aisleRacks.map((rack) => {
                      const rackId = rack.element_id;
                      const rackBoxes = boxesByRack[rackId] || [];
                      const isRackExpanded = hierarchyExpanded.has(rackId);
                      
                      // Calculate occupancy
                      const totalBoxes = rackBoxes.length;
                      const levels = rack.metadata?.levels || 3;
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
                            const aisleId = rack.hierarchy?.parent_id;
                            const aisle = aisles.find((a) => a.element_id === aisleId);
                            const zoneIdForRack = aisle?.hierarchy?.parent_id ?? null;
                            if (zoneIdForRack) selectZone(zoneIdForRack);
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
                                onSelect={() => {
                                  const rackEl = racks.find((r) => r.element_id === box.rack_id);
                                  const aisleId = rackEl?.hierarchy?.parent_id;
                                  const aisle = aisleId ? aisles.find((a) => a.element_id === aisleId) : null;
                                  const zoneIdForRack = aisle?.hierarchy?.parent_id ?? null;
                                  if (zoneIdForRack) selectZone(zoneIdForRack);
                                  selectBox(box.box_id);
                                }}
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
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 flex justify-between px-2">
        <span>{zones.length} zones</span>
        <span>{racks.length} racks</span>
        <span>{boxes.length} boxes</span>
      </div>
    </div>
  );
}
