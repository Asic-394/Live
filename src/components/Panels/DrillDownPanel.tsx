import React from 'react';
import { useStore } from '../../state/store';
import { COLOR_SCALES } from '../../utils/heatmapMaterials';

function formatKPIValue(value: number, unit: string): string {
  if (unit === 'orders' || unit === 'orders/hr') {
    return Math.round(value).toString();
  } else if (unit === 'workers') {
    return Math.round(value).toString();
  } else if (unit === '%') {
    return value.toFixed(1) + '%';
  } else if (unit === 'sec') {
    return Math.round(value) + 's';
  }
  return value.toFixed(1);
}

export default function DrillDownPanel() {
  const drillDownData = useStore((state) => state.drillDownData);
  const selectedKPI = useStore((state) => state.selectedKPI);
  const kpis = useStore((state) => state.kpis);
  const activeOverlay = useStore((state) => state.activeOverlay);
  const focusOnZone = useStore((state) => state.focusOnZone);
  const selectKPI = useStore((state) => state.selectKPI);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!selectedKPI || !drillDownData || drillDownData.drivers.length === 0) {
    return null;
  }

  const kpi = kpis.find(k => k.id === selectedKPI);
  if (!kpi) return null;

  const handleViewOnMap = (zoneId: string) => {
    focusOnZone(zoneId, true);
  };

  const handleClose = () => {
    selectKPI(null);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-[120px] right-4 z-10 glass-panel rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group"
        title={`Expand ${kpi.label}`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">{kpi.label}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed top-[120px] right-4 z-10 w-80 
                    max-h-[calc(100vh-136px)] overflow-y-auto
                    glass-panel rounded-xl 
                    p-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {kpi.label}
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {typeof kpi.value === 'number' ? kpi.value.toFixed(kpi.unit === '%' ? 1 : 0) : kpi.value}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {kpi.unit}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
                       transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
                       transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Heat Map Legend */}
      {activeOverlay && COLOR_SCALES[activeOverlay] && (
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-white/5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Heat Map Legend
          </h4>
          
          {/* Discrete Color Blocks */}
          <div className="flex rounded-lg overflow-hidden shadow-inner border border-gray-200 dark:border-white/10 mb-2">
            {COLOR_SCALES[activeOverlay].map((stop, index) => (
              <div 
                key={index}
                className="flex-1 h-8"
                style={{ backgroundColor: stop.color }}
              />
            ))}
          </div>

          {/* Range Labels */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            {COLOR_SCALES[activeOverlay].map((stop, index, array) => {
              const prevValue = index > 0 ? array[index - 1].value : 0;
              const currentValue = stop.value;
              const isLast = index === array.length - 1;
              
              return (
                <div key={index} className="flex-1 text-center">
                  {index === 0 ? (
                    <span>{(prevValue * 100).toFixed(0)}%-{(currentValue * 100).toFixed(0)}%</span>
                  ) : isLast ? (
                    <span>{(prevValue * 100).toFixed(0)}%-{(currentValue * 100).toFixed(0)}%</span>
                  ) : (
                    <span>{(prevValue * 100).toFixed(0)}%-{(currentValue * 100).toFixed(0)}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Contributors */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Top Contributors
        </h4>
        <div className="space-y-3">
          {drillDownData.drivers.map((driver, index) => (
            <div
              key={`${driver.zone}-${index}`}
              className="bg-black/5 dark:bg-white/5 rounded-lg p-4 
                         border border-gray-200 dark:border-white/5 hover:border-blue-400/30
                         transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {driver.label}
                </span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {driver.contribution}%
                </span>
              </div>
              
              {/* Progress bar with gradient */}
              <div className="w-full h-2 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${driver.contribution}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Value: {formatKPIValue(driver.value, kpi.unit)}
                </span>
                <button
                  onClick={() => handleViewOnMap(driver.zone)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-400/20 
                           text-blue-700 dark:text-blue-300 hover:bg-blue-400/30 
                           transition-all border border-blue-400/30"
                >
                  View on map
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      {kpi.description && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {kpi.description}
          </p>
        </div>
      )}
    </div>
  );
}
