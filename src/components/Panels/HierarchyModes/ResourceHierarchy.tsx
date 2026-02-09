import { useState } from 'react';
import { useStore } from '../../../state/store';
import type { Entity } from '../../../types';

interface ResourceGroupProps {
  title: string;
  icon: string;
  count: number;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function ResourceGroup({ title, icon, count, children, isExpanded, onToggle }: ResourceGroupProps) {
  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-300">{title}</span>
          <span className="text-xs text-gray-500">({count})</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}

interface ResourceItemProps {
  id: string;
  label: string;
  status: string;
  task?: string;
  location: string;
  batteryLevel?: number;
  onSelect: () => void;
}

function ResourceItem({ id, label, status, task, location, batteryLevel, onSelect }: ResourceItemProps) {
  const statusColor = 
    status === 'active' ? 'text-emerald-400' :
    status === 'idle' ? 'text-amber-400' :
    status === 'moving' ? 'text-blue-400' :
    'text-gray-400';

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-white/5 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${statusColor}`}>{label}</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-400">{status}</span>
        </div>
        {task && (
          <div className="text-xs text-gray-500 mt-0.5 truncate">{task}</div>
        )}
        <div className="text-xs text-gray-500 mt-0.5">📍 {location}</div>
      </div>
      {batteryLevel !== undefined && (
        <div className={`text-xs px-2 py-0.5 rounded ${
          batteryLevel < 50 ? 'bg-red-500/20 text-red-400' :
          batteryLevel < 75 ? 'bg-amber-500/20 text-amber-400' :
          'bg-emerald-500/20 text-emerald-400'
        }`}>
          {batteryLevel}%
        </div>
      )}
    </button>
  );
}

export default function ResourceHierarchy() {
  const entities = useStore((state) => state.entities);
  const selectEntity = useStore((state) => state.selectEntity);
  const selectedEntity = useStore((state) => state.selectedEntity);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['workers', 'equipment', 'vehicles']));
  const [searchQuery, setSearchQuery] = useState('');

  // Filter entities by type
  const workers = entities.filter(e => e.entity_type === 'worker');
  const forklifts = entities.filter(e => e.entity_type === 'forklift');
  const trucks = entities.filter(e => e.entity_type === 'truck');

  // Group workers by zone
  const workersByZone = workers.reduce((acc, worker) => {
    const zone = worker.zone || 'Unknown';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(worker);
    return acc;
  }, {} as Record<string, Entity[]>);

  // Group idle workers separately
  const idleWorkers = workers.filter(w => w.status === 'idle' || w.status === 'waiting' || w.status === 'standby');
  const activeWorkers = workers.filter(w => !idleWorkers.includes(w));

  // Filter based on search
  const matchesSearch = (entity: Entity) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entity.entity_id.toLowerCase().includes(query) ||
      entity.zone.toLowerCase().includes(query) ||
      entity.task?.toLowerCase().includes(query) ||
      entity.status.toLowerCase().includes(query)
    );
  };

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="w-full text-gray-100 flex flex-col">
      {/* Search */}
      <div className="mb-3 px-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
        />
      </div>

      {/* Resource Groups */}
      <div className="max-h-[400px] overflow-y-auto space-y-1 px-2">
        {/* Workers */}
        <ResourceGroup
          title="Workers"
          icon="👷"
          count={workers.length}
          isExpanded={expandedGroups.has('workers')}
          onToggle={() => toggleGroup('workers')}
        >
          {/* Active workers by zone */}
          {Object.entries(workersByZone)
            .filter(([zone]) => {
              const zoneWorkers = workersByZone[zone];
              return zoneWorkers.some(w => activeWorkers.includes(w) && matchesSearch(w));
            })
            .map(([zone, zoneWorkers]) => {
              const activeZoneWorkers = zoneWorkers.filter(w => activeWorkers.includes(w) && matchesSearch(w));
              if (activeZoneWorkers.length === 0) return null;

              return (
                <div key={zone} className="ml-4 mb-2">
                  <div className="text-xs text-gray-500 mb-1">📍 {zone} ({activeZoneWorkers.length})</div>
                  {activeZoneWorkers.map((worker) => (
                    <ResourceItem
                      key={worker.entity_id}
                      id={worker.entity_id}
                      label={worker.entity_id}
                      status={worker.status}
                      task={worker.task}
                      location={worker.zone}
                      onSelect={() => selectEntity(worker.entity_id)}
                    />
                  ))}
                </div>
              );
            })}
          
          {/* Idle workers */}
          {idleWorkers.filter(matchesSearch).length > 0 && (
            <div className="ml-4 mb-2">
              <div className="text-xs text-gray-500 mb-1">⏸️ Idle ({idleWorkers.filter(matchesSearch).length})</div>
              {idleWorkers.filter(matchesSearch).map((worker) => (
                <ResourceItem
                  key={worker.entity_id}
                  id={worker.entity_id}
                  label={worker.entity_id}
                  status={worker.status}
                  task={worker.task}
                  location={worker.zone}
                  onSelect={() => selectEntity(worker.entity_id)}
                />
              ))}
            </div>
          )}
        </ResourceGroup>

        {/* Equipment (Forklifts) */}
        <ResourceGroup
          title="Forklifts"
          icon="🚜"
          count={forklifts.length}
          isExpanded={expandedGroups.has('equipment')}
          onToggle={() => toggleGroup('equipment')}
        >
          {forklifts.filter(matchesSearch).map((forklift) => (
            <ResourceItem
              key={forklift.entity_id}
              id={forklift.entity_id}
              label={forklift.entity_id}
              status={forklift.status}
              task={forklift.task}
              location={forklift.zone}
              batteryLevel={forklift.battery_level}
              onSelect={() => selectEntity(forklift.entity_id)}
            />
          ))}
        </ResourceGroup>

        {/* Vehicles (Trucks) */}
        <ResourceGroup
          title="Trucks"
          icon="🚛"
          count={trucks.length}
          isExpanded={expandedGroups.has('vehicles')}
          onToggle={() => toggleGroup('vehicles')}
        >
          {/* Trucks at docks */}
          {trucks.filter(t => t.zone.startsWith('Dock') && matchesSearch(t)).length > 0 && (
            <div className="ml-4 mb-2">
              <div className="text-xs text-gray-500 mb-1">🚪 At Docks ({trucks.filter(t => t.zone.startsWith('Dock') && matchesSearch(t)).length})</div>
              {trucks.filter(t => t.zone.startsWith('Dock') && matchesSearch(t)).map((truck) => (
                <ResourceItem
                  key={truck.entity_id}
                  id={truck.entity_id}
                  label={truck.entity_id}
                  status={truck.status}
                  task={truck.task}
                  location={truck.zone}
                  onSelect={() => selectEntity(truck.entity_id)}
                />
              ))}
            </div>
          )}

          {/* Trucks in parking */}
          {trucks.filter(t => t.zone.startsWith('Space') && matchesSearch(t)).length > 0 && (
            <div className="ml-4 mb-2">
              <div className="text-xs text-gray-500 mb-1">🅿️ Parking ({trucks.filter(t => t.zone.startsWith('Space') && matchesSearch(t)).length})</div>
              {trucks.filter(t => t.zone.startsWith('Space') && matchesSearch(t)).map((truck) => (
                <ResourceItem
                  key={truck.entity_id}
                  id={truck.entity_id}
                  label={truck.entity_id}
                  status={truck.status}
                  task={truck.task}
                  location={truck.zone}
                  onSelect={() => selectEntity(truck.entity_id)}
                />
              ))}
            </div>
          )}
        </ResourceGroup>
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex justify-between px-2">
        <span>{workers.length} workers</span>
        <span>{forklifts.length} forklifts</span>
        <span>{trucks.length} trucks</span>
      </div>
    </div>
  );
}
