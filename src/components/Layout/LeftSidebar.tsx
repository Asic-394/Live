import { useStore } from '../../state/store';
import HierarchyPanel from '../Panels/HierarchyPanel';
import KPIPanel from '../Panels/KPIPanel';
import EntityFilterControl from '../Controls/EntityFilterControl';
import { getLensById } from '../../config/lenses';

export default function LeftSidebar() {
  const leftSidebarCollapsed = useStore((state) => state.leftSidebarCollapsed);
  const toggleLeftSidebar = useStore((state) => state.toggleLeftSidebar);
  const hierarchySectionExpanded = useStore((state) => state.hierarchySectionExpanded);
  const healthSectionExpanded = useStore((state) => state.healthSectionExpanded);
  const filterSectionExpanded = useStore((state) => state.filterSectionExpanded);
  const toggleHierarchySection = useStore((state) => state.toggleHierarchySection);
  const toggleHealthSection = useStore((state) => state.toggleHealthSection);
  const toggleFilterSection = useStore((state) => state.toggleFilterSection);
  const activeLenses = useStore((state) => state.activeLenses);

  // Get dynamic hierarchy title based on active lens
  const getHierarchyTitle = () => {
    if (activeLenses.size === 0) {
      return 'Warehouse Hierarchy';
    }
    
    const lensType = Array.from(activeLenses)[0];
    const lens = getLensById(lensType);
    
    if (!lens) return 'Warehouse Hierarchy';
    
    const hierarchyTitles: Record<string, string> = {
      inventory: 'Inventory Hierarchy',
      resources: 'Resource Allocation',
      tasks: 'Task Overview',
      alerts: 'Alert Zones',
      inbound: 'Inbound Operations',
      outbound: 'Outbound Operations',
      yard: 'Yard Operations'
    };
    
    return hierarchyTitles[lensType] || 'Warehouse Hierarchy';
  };

  if (leftSidebarCollapsed) {
    return (
      <div className="fixed left-0 top-[104px] h-[calc(100vh-104px)] z-[5] flex flex-col transition-all duration-300">
        {/* Collapsed sidebar - thin bar with icons */}
        <div className="glass-panel rounded-r-xl h-full w-12 flex flex-col items-center py-4 gap-3 animate-fade-in">
          {/* Expand button */}
          <button
            onClick={toggleLeftSidebar}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all group"
            title="Expand Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Section indicators */}
          <div className="flex-1 flex flex-col gap-4 mt-4">
            <button
              onClick={() => {
                toggleLeftSidebar();
                if (!healthSectionExpanded) toggleHealthSection();
              }}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all"
              title="Warehouse Health"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            <button
              onClick={() => {
                toggleLeftSidebar();
                if (!hierarchySectionExpanded) toggleHierarchySection();
              }}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all"
              title="Hierarchy"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={() => {
                toggleLeftSidebar();
                if (!filterSectionExpanded) toggleFilterSection();
              }}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all"
              title="Filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-[104px] h-[calc(100vh-104px)] z-[5] flex flex-col transition-all duration-300 animate-fade-in">
      {/* Expanded sidebar */}
      <div className="glass-panel rounded-r-xl h-full w-[400px] flex flex-col overflow-hidden shadow-2xl">
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">Warehouse Control</h2>
          <button
            onClick={toggleLeftSidebar}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all"
            title="Collapse Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Warehouse Health Section */}
          <div className="border-b border-white/10">
            <button
              onClick={toggleHealthSection}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-sm font-semibold text-emerald-400">Warehouse Health</h3>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${healthSectionExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {healthSectionExpanded && (
              <div className="px-2 pb-4">
                <KPIPanel />
              </div>
            )}
          </div>

          {/* Hierarchy Section */}
          <div className="border-b border-white/10">
            <button
              onClick={toggleHierarchySection}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-400">{getHierarchyTitle()}</h3>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${hierarchySectionExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {hierarchySectionExpanded && (
              <div className="px-2 pb-4">
                <HierarchyPanel />
              </div>
            )}
          </div>

          {/* Entity Filter Section */}
          <div>
            <button
              onClick={toggleFilterSection}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h3 className="text-sm font-semibold text-purple-400">Entity Filters</h3>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${filterSectionExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {filterSectionExpanded && (
              <div className="px-2 pb-4">
                <EntityFilterControl />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
