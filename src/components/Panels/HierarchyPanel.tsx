import { useStore } from '../../state/store';
import InventoryHierarchy from './HierarchyModes/InventoryHierarchy';
import ResourceHierarchy from './HierarchyModes/ResourceHierarchy';
import TaskHierarchy from './HierarchyModes/TaskHierarchy';
import AlertHierarchy from './HierarchyModes/AlertHierarchy';
import { getLensById } from '../../config/lenses';

export default function HierarchyPanel() {
  const activeLenses = useStore((state) => state.activeLenses);

  // Don't show hierarchy if no lens is selected
  if (activeLenses.size === 0) {
    return (
      <div className="w-full text-gray-100 flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-sm font-medium text-gray-300 mb-2">Select a lens to view context-specific hierarchy</div>
          <div className="text-xs text-gray-500">
            Choose Inventory, Resources, Tasks, or Alerts from the navigation bar above
          </div>
        </div>
      </div>
    );
  }

  // Get the active lens
  const lensType = Array.from(activeLenses)[0];
  const lens = getLensById(lensType);

  if (!lens) {
    return (
      <div className="w-full text-gray-100 flex flex-col items-center justify-center py-8 px-4">
        <div className="text-xs text-gray-500">Unknown lens type</div>
      </div>
    );
  }

  // Render appropriate hierarchy based on lens
  switch (lensType) {
    case 'inventory':
      return <InventoryHierarchy />;
    case 'resources':
      return <ResourceHierarchy />;
    case 'tasks':
      return <TaskHierarchy />;
    case 'alerts':
      return <AlertHierarchy />;
    // Phase 2 lenses - placeholder for now
    case 'inbound':
    case 'outbound':
    case 'yard':
      return (
        <div className="w-full text-gray-100 flex flex-col items-center justify-center py-8 px-4">
          <div className="text-xs text-gray-500 text-center">
            {lens.label} hierarchy coming soon in Phase 2
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full text-gray-100 flex flex-col items-center justify-center py-8 px-4">
          <div className="text-xs text-gray-500">No hierarchy available for this lens</div>
        </div>
      );
  }
}
