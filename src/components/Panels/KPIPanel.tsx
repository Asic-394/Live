import React from 'react';
import { useStore } from '../../state/store';
import type { KPI } from '../../types';
import { getLensById } from '../../config/lenses';
import { getKPIsForCategories } from '../../config/kpiCategories';

import { KPIService } from '../../services/KPIService';
import { Loader2 } from 'lucide-react';

interface KPICardProps {
  kpi: KPI;
  isSelected: boolean;
  onClick: () => void;
}

interface KPICardPropsWithPriority extends KPICardProps {
  isPrioritized?: boolean;
}

// ... (KPICard component code remains same, but I need to pass isLoading prop)

function KPICard({ kpi, isSelected, onClick, isPrioritized = false, isLoading = false }: KPICardPropsWithPriority & { isLoading?: boolean }) {
  const { label, value, unit, trend, status, description } = kpi;

  // ... (styles remain same)
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
        ${isPrioritized ? 'ring-1 ring-blue-400/30 border-blue-400/20' : ''}
        ${status === 'Critical' ? 'animate-subtle-pulse' : ''}
        ${statusGradients[status]}
      `}
      onClick={!isLoading ? onClick : undefined}
      title={description}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Status indicator dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${statusDotColors[status]} shadow-lg`}
          style={{ boxShadow: `0 0 6px ${status === 'Critical' ? '#f87171' : status === 'Watch' ? '#fbbf24' : '#34d399'}` }} />
        <span className={`text-[10px] font-medium ${statusTextColors[status]}`}>
          {status}
        </span>
      </div>

      {/* Label */}
      <div className="text-xs font-medium text-gray-400 mb-2 pr-16 flex items-center gap-1.5">
        {label}
        {isPrioritized && (
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
            Relevant
          </span>
        )}
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
      {kpi.overlayType && !isLoading && (
        <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
          Click to analyze heatmap
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
  const activeLenses = useStore((state) => state.activeLenses);
  const selectKPIWithSpatialContext = useStore((state) => state.selectKPIWithSpatialContext);

  const [showAllKPIs, setShowAllKPIs] = React.useState(false);
  const [analyzingKPIId, setAnalyzingKPIId] = React.useState<string | null>(null);

  // Handle KPI click with spatial analysis
  const handleKPIClick = async (kpi: KPI) => {
    if (selectedKPI === kpi.id) {
      selectKPI(null);
      return;
    }

    setAnalyzingKPIId(kpi.id);

    try {
      // Get current state snapshot without subscription
      const state = useStore.getState();

      const warehouseStatePayload = KPIService.buildWarehouseStatePayload(
        state.warehouseLayout?.zones || [],
        state.entities,
        {
          position: [50, 50, 50], // Approximate camera position
          target: [0, 0, 0]
        }
      );

      // Perform spatial analysis
      const context = await KPIService.analyzeKPISpatialContext(kpi, warehouseStatePayload);

      // Update store with context
      selectKPIWithSpatialContext(kpi, context);

    } catch (err) {
      console.error('KPI analysis failed:', err);
      // Fallback to simple selection
      selectKPI(kpi.id);
    } finally {
      setAnalyzingKPIId(null);
    }
  };

  // Debug logging
  console.log('KPIPanel render:', { loadingState, kpisCount: kpis.length });

  // Don't show until data is loaded
  if (loadingState !== 'success') {
    return null;
  }

  if (kpis.length === 0) {
    return null;
  }

  // Get prioritized KPIs based on active lens
  const getPrioritizedKPIs = (): { kpis: KPI[]; prioritizedIds: Set<string> } => {
    if (activeLenses.size === 0) {
      // No lens: show default core KPIs
      const coreKPIIds = ['throughput', 'labor_utilization', 'orders_at_risk', 'zone_congestion', 'safety_incidents'];
      const coreKPIs = kpis.filter(kpi => coreKPIIds.includes(kpi.id));
      const otherKPIs = kpis.filter(kpi => !coreKPIIds.includes(kpi.id));
      return {
        kpis: showAllKPIs ? [...coreKPIs, ...otherKPIs] : coreKPIs,
        prioritizedIds: new Set(coreKPIIds)
      };
    }

    // Get the active lens
    const lensType = Array.from(activeLenses)[0];
    const lens = getLensById(lensType);

    if (!lens) {
      // Fallback to default
      const coreKPIIds = ['throughput', 'labor_utilization', 'orders_at_risk'];
      return {
        kpis: kpis.filter(kpi => coreKPIIds.includes(kpi.id)),
        prioritizedIds: new Set(coreKPIIds)
      };
    }

    // Get relevant KPI IDs for this lens
    const relevantKPIIds = getKPIsForCategories(lens.kpiCategories);
    const prioritizedIds = new Set(relevantKPIIds);

    // Split into relevant and others
    const relevantKPIs = kpis.filter(kpi => relevantKPIIds.includes(kpi.id));
    const otherKPIs = kpis.filter(kpi => !relevantKPIIds.includes(kpi.id));

    // Return relevant first, then others
    return {
      kpis: showAllKPIs ? [...relevantKPIs, ...otherKPIs] : relevantKPIs,
      prioritizedIds
    };
  };

  const { kpis: displayedKPIs, prioritizedIds } = getPrioritizedKPIs();
  const hasPrioritized = prioritizedIds.size > 0;

  return (
    <div className="w-full">
      {/* Header - in parent sidebar */}
      {selectedKPI && (
        <div className="mb-3 px-2">
          <button
            onClick={() => selectKPI(null)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 
                     text-gray-400 hover:bg-white/10 hover:text-gray-200
                     transition-all border border-white/5"
            title="Clear selection"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 px-2">
        {displayedKPIs.map((kpi) => (
          <KPICard
            key={kpi.id}
            kpi={kpi}
            isSelected={selectedKPI === kpi.id}
            isPrioritized={prioritizedIds.has(kpi.id)}
            isLoading={analyzingKPIId === kpi.id}
            onClick={() => handleKPIClick(kpi)}
          />
        ))}
      </div>

      {/* Show count badge if there are prioritized KPIs */}
      {hasPrioritized && displayedKPIs.length > prioritizedIds.size && (
        <div className="mt-2 px-2 text-xs text-gray-500 text-center">
          Showing {prioritizedIds.size} relevant KPIs for active lens
        </div>
      )}

      {/* Show More / Show Less button */}
      {kpis.length > prioritizedIds.size && (
        <div className="mt-3 px-2">
          <button
            onClick={() => setShowAllKPIs(!showAllKPIs)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 
                     text-gray-400 hover:bg-white/10 hover:text-gray-200
                     transition-all border border-white/5 hover:border-white/10
                     flex items-center justify-center gap-2"
          >
            <span>{showAllKPIs ? 'Show Less' : `Show More (${kpis.length - displayedKPIs.length} more)`}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showAllKPIs ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
