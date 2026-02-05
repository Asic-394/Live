import React from 'react';
import { useStore } from '../../state/store';
import type { KPI } from '../../types';

interface KPICardProps {
  kpi: KPI;
  isSelected: boolean;
  onClick: () => void;
}

function KPICard({ kpi, isSelected, onClick }: KPICardProps) {
  const { label, value, unit, trend, status, description } = kpi;

  // Determine status styling with subtle approach
  const statusGradients = {
    Normal: 'bg-gradient-to-br from-emerald-500/10 to-transparent',
    Watch: 'bg-gradient-to-br from-amber-500/10 to-transparent',
    Critical: 'bg-gradient-to-br from-red-500/10 to-transparent'
  };

  const statusBorderColors = {
    Normal: 'border-l-emerald-400/50',
    Watch: 'border-l-amber-400/50',
    Critical: 'border-l-red-400/50'
  };

  const statusDotColors = {
    Normal: 'bg-emerald-400',
    Watch: 'bg-amber-400',
    Critical: 'bg-red-400'
  };

  const statusTextColors = {
    Normal: 'text-emerald-400/80',
    Watch: 'text-amber-400/80',
    Critical: 'text-red-400/80'
  };

  const trendColor = trend > 0 ? 'text-red-400/80' : trend < 0 ? 'text-emerald-400/80' : 'text-gray-400';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <div
      className={`
        kpi-card relative overflow-hidden
        bg-[#16181f]/95 backdrop-blur-xl rounded-lg p-3.5 shadow-xl shadow-black/20
        border border-l-4 border-white/5 ${statusBorderColors[status]}
        transition-all duration-300 cursor-pointer
        hover:bg-[#1c1f27] hover:shadow-black/30 hover:border-white/10
        ${isSelected ? 'ring-2 ring-blue-400/50 border-blue-400/30' : ''}
        ${status === 'Critical' ? 'animate-subtle-pulse' : ''}
        ${statusGradients[status]}
      `}
      onClick={onClick}
      title={description}
    >
      {/* Status indicator dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${statusDotColors[status]} shadow-lg`} 
             style={{ boxShadow: `0 0 6px ${status === 'Critical' ? '#f87171' : status === 'Watch' ? '#fbbf24' : '#34d399'}` }} />
        <span className={`text-[10px] font-medium ${statusTextColors[status]}`}>
          {status}
        </span>
      </div>

      {/* Label */}
      <div className="text-xs font-medium text-gray-400 mb-2 pr-16">
        {label}
      </div>

      {/* Value and unit */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-semibold text-gray-100">
          {typeof value === 'number' ? value.toFixed(unit === '%' || unit === 'density' ? 1 : 0) : value}
        </span>
        <span className="text-sm text-gray-400">
          {unit}
        </span>
      </div>

      {/* Trend */}
      {trend !== 0 && (
        <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
          <span className="text-sm">{trendIcon}</span>
          <span className="font-medium">{Math.abs(trend)}%</span>
        </div>
      )}

      {/* Hover hint */}
      {kpi.overlayType && (
        <div className="mt-2 text-[10px] text-gray-500">
          Click to view on map
        </div>
      )}
    </div>
  );
}

export default function KPIPanel() {
  const kpis = useStore((state) => state.kpis);
  const selectKPI = useStore((state) => state.selectKPI);
  const selectedKPI = useStore((state) => state.selectedKPI);
  const loadingState = useStore((state) => state.loadingState);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Debug logging
  console.log('KPIPanel render:', { loadingState, kpisCount: kpis.length, kpis });

  // Don't show until data is loaded
  if (loadingState !== 'success') {
    console.log('KPIPanel: waiting for data load, state:', loadingState);
    return null;
  }

  if (kpis.length === 0) {
    console.log('KPIPanel: no KPIs loaded');
    return null;
  }

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="glass-panel rounded-xl p-3 hover:bg-white/10 transition-all group"
        title="Expand Warehouse Health"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs text-gray-400 group-hover:text-gray-200">Warehouse Health</span>
        </div>
      </button>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4 max-w-lg animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-100">
          Warehouse Health
        </h3>
        <div className="flex items-center gap-2">
          {selectedKPI && (
            <button
              onClick={() => selectKPI(null)}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 
                       text-gray-400 hover:bg-white/10 hover:text-gray-200
                       transition-all border border-white/5"
              title="Clear selection"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.id}
            kpi={kpi}
            isSelected={selectedKPI === kpi.id}
            onClick={() => selectKPI(kpi.id)}
          />
        ))}
      </div>
    </div>
  );
}
