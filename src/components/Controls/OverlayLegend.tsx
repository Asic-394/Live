import React from 'react';
import { useStore } from '../../state/store';
import { COLOR_SCALES } from '../../utils/heatmapMaterials';

export default function OverlayLegend() {
  const activeOverlay = useStore((state) => state.activeOverlay);
  const setActiveOverlay = useStore((state) => state.setActiveOverlay);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!activeOverlay) {
    return null;
  }

  const colorScale = COLOR_SCALES[activeOverlay];
  if (!colorScale) {
    return null;
  }

  // Get overlay name
  const overlayNames = {
    heat_congestion: 'Zone Congestion',
    heat_utilization: 'Labor Utilization',
    heat_throughput: 'Throughput'
  };
  const overlayName = overlayNames[activeOverlay] || activeOverlay;

  // Get legend units
  const legendUnits = {
    heat_congestion: 'Density (0-1)',
    heat_utilization: 'Utilization (%)',
    heat_throughput: 'Orders/hr'
  };
  const unit = legendUnits[activeOverlay] || '';

  const handleClose = () => {
    setActiveOverlay(null);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="glass-panel rounded-xl p-3 hover:bg-white/10 transition-all group"
        title={`Expand ${overlayName}`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h12" />
          </svg>
          <span className="text-xs text-gray-400 group-hover:text-gray-200">{overlayName}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="overlay-legend glass-panel rounded-xl p-4 min-w-[220px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-100">
          {overlayName}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-gray-200 
                       transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 
                       transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Hide overlay"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Color Gradient */}
      <div className="mb-3">
        <div 
          className="h-7 rounded-lg shadow-inner border border-white/10"
          style={{
            background: `linear-gradient(to right, ${colorScale.map(stop => stop.color).join(', ')})`
          }}
        />
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Low</span>
        <span>High</span>
      </div>

      {/* Unit */}
      <div className="text-xs text-gray-500 text-center mb-3">
        {unit}
      </div>

      {/* Legend items */}
      <div className="pt-3 border-t border-white/5 space-y-2">
        {colorScale.map((stop, index) => {
          const label = index === 0 ? 'Low' : 
                       index === colorScale.length - 1 ? 'High' : 
                       'Moderate';
          return (
            <div key={index} className="flex items-center gap-2.5">
              <div 
                className="w-4 h-4 rounded border border-white/10 shadow-sm"
                style={{ backgroundColor: stop.color }}
              />
              <span className="text-xs text-gray-400">
                {label} ({(stop.value * 100).toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
