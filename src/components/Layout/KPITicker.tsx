import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../state/store';
import KPITickerItem from './KPITickerItem';
import type { KPI } from '../../types';

interface KPITickerProps {
  onKPIClick: (kpi: KPI) => void;
}

export default function KPITicker({ onKPIClick }: KPITickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  
  const kpis = useStore((state) => state.kpis);
  const tickerKPIs = useStore((state) => state.tickerKPIs);

  // Filter visible KPIs and sort by order
  const visibleKPIs = kpis
    .filter(kpi => {
      const config = tickerKPIs[kpi.id];
      return config ? config.visible : true; // Default to visible if not configured
    })
    .sort((a, b) => {
      const orderA = tickerKPIs[a.id]?.order ?? 999;
      const orderB = tickerKPIs[b.id]?.order ?? 999;
      return orderA - orderB;
    });

  // Measure and determine if scrolling is needed
  useEffect(() => {
    const measureContent = () => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const contentWidth = contentRef.current.scrollWidth;
        
        // Add small buffer to avoid edge cases
        setShouldScroll(contentWidth > containerWidth + 10);
      }
    };

    // Initial measurement
    measureContent();

    // Re-measure on window resize
    const handleResize = () => {
      measureContent();
    };

    window.addEventListener('resize', handleResize);
    
    // Re-measure when KPIs change
    const timeoutId = setTimeout(measureContent, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [visibleKPIs.length]);

  if (visibleKPIs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No KPIs available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden h-full flex items-center">
      <div
        ref={contentRef}
        className={shouldScroll ? 'animate-ticker' : 'flex justify-center gap-6'}
        style={shouldScroll ? {
          display: 'flex',
          gap: '1.5rem',
        } : undefined}
      >
        {/* First set of KPIs */}
        {visibleKPIs.map((kpi) => (
          <KPITickerItem
            key={kpi.id}
            kpi={kpi}
            onClick={onKPIClick}
          />
        ))}
        
        {/* Duplicate KPIs for seamless loop if scrolling */}
        {shouldScroll && visibleKPIs.map((kpi) => (
          <KPITickerItem
            key={`${kpi.id}-duplicate`}
            kpi={kpi}
            onClick={onKPIClick}
          />
        ))}
      </div>
    </div>
  );
}
