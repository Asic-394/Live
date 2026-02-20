import React from 'react';
import type { KPI } from '../../types';

interface KPITickerItemProps {
  kpi: KPI;
  onClick: (kpi: KPI) => void;
}

export default function KPITickerItem({ kpi, onClick }: KPITickerItemProps) {
  const { label, value, unit, trend, status } = kpi;

  // Status-based styling
  const statusColors = {
    Normal: 'text-emerald-400',
    Watch: 'text-amber-400',
    Critical: 'text-red-400'
  };

  const statusDotColors = {
    Normal: 'bg-emerald-400',
    Watch: 'bg-amber-400',
    Critical: 'bg-red-400'
  };

  const statusDotShadows = {
    Normal: 'shadow-emerald-400/50',
    Watch: 'shadow-amber-400/50',
    Critical: 'shadow-red-400/50'
  };

  const trendColor = trend > 0 ? 'text-red-400/80' : trend < 0 ? 'text-emerald-400/80' : 'text-gray-400';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  // Format value based on unit
  const formattedValue = typeof value === 'number' 
    ? value.toFixed(unit === '%' || unit === 'density' ? 1 : 0)
    : value;

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer
                 transition-all duration-200 whitespace-nowrap
                 border border-black/8 dark:border-white/5 hover:border-black/15 dark:hover:border-white/10"
      onClick={() => onClick(kpi)}
      title={kpi.description || label}
    >
      {/* Status dot */}
      <div 
        className={`w-1.5 h-1.5 rounded-full ${statusDotColors[status]} ${statusDotShadows[status]} shadow-lg flex-shrink-0`}
      />
      
      {/* Label */}
      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
        {label}:
      </span>
      
      {/* Value */}
      <span className={`text-sm font-semibold ${statusColors[status]}`}>
        {formattedValue}{unit}
      </span>
      
      {/* Trend */}
      {trend !== 0 && (
        <span className={`text-xs ${trendColor} flex items-center gap-0.5`}>
          <span>{trendIcon}</span>
          <span>{Math.abs(trend)}%</span>
        </span>
      )}
    </div>
  );
}
