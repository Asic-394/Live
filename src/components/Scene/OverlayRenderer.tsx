import { useMemo, memo } from 'react';
import { useStore } from '../../state/store';
import { getColorScaleForOverlay, interpolateColor } from '../../utils/heatmapMaterials';
import ZoneHeatOverlay from './ZoneHeatOverlay';
import ColumnHeatMap from './ColumnHeatMap';
import ParticleHeatMap from './ParticleHeatMap';
import type { OverlayType } from '../../types';

function OverlayRendererComponent() {
  const activeOverlay = useStore((state) => state.activeOverlay);
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const heatMapMode = useStore((state) => state.heatMapMode);

  // Phase 4: Get intensity data directly from record
  const overlayIntensityData = useStore((state) => state.overlayIntensityData);

  // Phase 2: Get legacy overlay data
  const legacyOverlayData = useStore((state) => {
    if (!activeOverlay) return null;
    return state.overlayData.get(activeOverlay as OverlayType) || null;
  });

  // Unified intensity data map
  const intensityData = useMemo(() => {
    // If we have Phase 4 data, use it
    if (Object.keys(overlayIntensityData).length > 0) {
      return overlayIntensityData;
    }

    // Otherwise fall back to Phase 2 data
    if (legacyOverlayData) {
      const data: Record<string, number> = {};
      legacyOverlayData.forEach(d => {
        data[d.zoneId] = d.intensity;
      });
      return data;
    }

    return {};
  }, [overlayIntensityData, legacyOverlayData]);

  if (!activeOverlay || !warehouseLayout?.zones || Object.keys(intensityData).length === 0) {
    return null;
  }

  const colorScale = getColorScaleForOverlay(activeOverlay);

  // Render based on selected mode
  if (heatMapMode === 'column') {
    return (
      <ColumnHeatMap
        zones={warehouseLayout.zones}
        intensityData={intensityData}
        colorScale={colorScale}
      />
    );
  }

  if (heatMapMode === 'particle') {
    return (
      <ParticleHeatMap
        zones={warehouseLayout.zones}
        intensityData={intensityData}
        colorScale={colorScale}
      />
    );
  }

  // Default: Gradient (ZoneHeatOverlay)
  return (
    <group key={`overlay-${activeOverlay}`}>
      {warehouseLayout.zones.map(zone => {
        const intensity = intensityData[zone.element_id];
        if (intensity === undefined) return null;

        const color = interpolateColor(colorScale, intensity);

        return (
          <ZoneHeatOverlay
            key={zone.element_id}
            zone={zone}
            color={color}
            opacity={0.6}
          />
        );
      })}
    </group>
  );
}

// Memoize the entire component to prevent unnecessary re-renders
export default memo(OverlayRendererComponent);
