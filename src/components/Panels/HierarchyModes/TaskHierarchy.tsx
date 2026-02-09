import { useState } from 'react';
import { useStore } from '../../../state/store';
import type { Entity } from '../../../types';

interface TaskGroupProps {
  title: string;
  icon: string;
  count: number;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function TaskGroup({ title, icon, count, children, isExpanded, onToggle }: TaskGroupProps) {
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
      {isExpanded && <div className="mt-1 space-y-2">{children}</div>}
    </div>
  );
}

interface OrderItemProps {
  orderId: string;
  tasks: Entity[];
  onSelect: (entityId: string) => void;
}

function OrderItem({ orderId, tasks, onSelect }: OrderItemProps) {
  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'staged' || t.status === 'stored').length;
  const inProgressTasks = tasks.filter(t => t.status === 'active' || t.status === 'moving').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Determine priority/risk
  const isAtRisk = progressPercent < 50 && inProgressTasks === 0;
  const priorityColor = isAtRisk ? 'text-red-400' : progressPercent >= 75 ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="ml-4 mb-2 p-2 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${priorityColor}`}>{orderId}</span>
          <span className="text-xs text-gray-500">({totalTasks} tasks)</span>
        </div>
        <div className={`text-xs px-2 py-0.5 rounded ${priorityColor.replace('text-', 'bg-').replace('-400', '-400/20')}`}>
          {progressPercent}%
        </div>
      </div>
      
      {/* Task breakdown */}
      <div className="space-y-1">
        {tasks.map((task) => {
          const statusIcon = 
            task.status === 'staged' || task.status === 'stored' ? '✅' :
            task.status === 'active' || task.status === 'moving' ? '🔄' :
            '⏸️';
          
          return (
            <button
              key={task.entity_id}
              onClick={() => onSelect(task.entity_id)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 text-left text-xs"
            >
              <span>{statusIcon}</span>
              <span className="text-gray-300">{task.task}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">{task.entity_id}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{task.zone}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TaskHierarchy() {
  const entities = useStore((state) => state.entities);
  const selectEntity = useStore((state) => state.selectEntity);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['orders', 'waves']));
  const [searchQuery, setSearchQuery] = useState('');

  // Extract orders and waves from assigned_to field
  const orders = new Set<string>();
  const waves = new Set<string>();
  
  entities.forEach(entity => {
    if (entity.assigned_to) {
      if (entity.assigned_to.startsWith('Order-')) {
        orders.add(entity.assigned_to);
      } else if (entity.assigned_to.startsWith('Wave-')) {
        waves.add(entity.assigned_to);
      }
    }
  });

  // Group entities by order
  const entitiesByOrder = Array.from(orders).reduce((acc, orderId) => {
    acc[orderId] = entities.filter(e => e.assigned_to === orderId);
    return acc;
  }, {} as Record<string, Entity[]>);

  // Group entities by wave
  const entitiesByWave = Array.from(waves).reduce((acc, waveId) => {
    acc[waveId] = entities.filter(e => e.assigned_to === waveId);
    return acc;
  }, {} as Record<string, Entity[]>);

  // Filter based on search
  const matchesSearch = (id: string, entities: Entity[]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      id.toLowerCase().includes(query) ||
      entities.some(e => 
        e.entity_id.toLowerCase().includes(query) ||
        e.task?.toLowerCase().includes(query) ||
        e.zone.toLowerCase().includes(query)
      )
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

  const filteredOrders = Object.entries(entitiesByOrder).filter(([orderId, tasks]) => 
    matchesSearch(orderId, tasks)
  );

  const filteredWaves = Object.entries(entitiesByWave).filter(([waveId, tasks]) => 
    matchesSearch(waveId, tasks)
  );

  return (
    <div className="w-full text-gray-100 flex flex-col">
      {/* Search */}
      <div className="mb-3 px-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search orders/waves..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
        />
      </div>

      {/* Task Groups */}
      <div className="max-h-[400px] overflow-y-auto space-y-1 px-2">
        {/* Active Orders */}
        <TaskGroup
          title="Active Orders"
          icon="📦"
          count={filteredOrders.length}
          isExpanded={expandedGroups.has('orders')}
          onToggle={() => toggleGroup('orders')}
        >
          {filteredOrders.map(([orderId, tasks]) => (
            <OrderItem
              key={orderId}
              orderId={orderId}
              tasks={tasks}
              onSelect={selectEntity}
            />
          ))}
          {filteredOrders.length === 0 && (
            <div className="ml-4 text-xs text-gray-500 py-2">No active orders</div>
          )}
        </TaskGroup>

        {/* Waves */}
        <TaskGroup
          title="Waves"
          icon="📊"
          count={filteredWaves.length}
          isExpanded={expandedGroups.has('waves')}
          onToggle={() => toggleGroup('waves')}
        >
          {filteredWaves.map(([waveId, tasks]) => {
            const taskTypes = new Set(tasks.map(t => t.task));
            return (
              <div key={waveId} className="ml-4 mb-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-400">{waveId}</span>
                  <span className="text-xs text-gray-500">({tasks.length} entities)</span>
                </div>
                <div className="space-y-1">
                  {Array.from(taskTypes).map((taskType) => {
                    const taskEntities = tasks.filter(t => t.task === taskType);
                    return (
                      <div key={taskType} className="text-xs text-gray-400">
                        {taskType} ({taskEntities.length})
                        <div className="ml-4 mt-1 space-y-0.5">
                          {taskEntities.map((entity) => (
                            <button
                              key={entity.entity_id}
                              onClick={() => selectEntity(entity.entity_id)}
                              className="block w-full text-left hover:text-gray-200"
                            >
                              {entity.entity_id} • {entity.zone}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filteredWaves.length === 0 && (
            <div className="ml-4 text-xs text-gray-500 py-2">No active waves</div>
          )}
        </TaskGroup>
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex justify-between px-2">
        <span>{filteredOrders.length} orders</span>
        <span>{filteredWaves.length} waves</span>
        <span>{entities.filter(e => e.assigned_to).length} assigned</span>
      </div>
    </div>
  );
}
