import { useMemo, memo } from 'react';
import { useStore } from '../../state/store';
import { interpolateColor, getColorScaleForOverlay } from '../../utils/heatmapMaterials';
import ZoneHeatOverlay from './ZoneHeatOverlay';
import type { OverlayType } from '../../types';

function OverlayRendererComponent() {
  const activeOverlay = useStore((state) => state.activeOverlay);
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  
  // Get the heat data directly from the overlay data Map
  // Use a custom selector to avoid re-renders when the Map reference changes
  const heatData = useStore((state) => {
    if (!activeOverlay) return null;
    const data = state.overlayData.get(activeOverlay as OverlayType);
    return data || null;
  });

  // Memoize the overlay elements with stable dependencies
  const overlayElements = useMemo(() => {
    if (!activeOverlay || !warehouseLayout?.zones || !heatData || heatData.length === 0) {
      return [];
    }

    const colorScale = getColorScaleForOverlay(activeOverlay);
    const elements: JSX.Element[] = [];

    for (const zone of warehouseLayout.zones) {
      const data = heatData.find(d => d.zoneId === zone.element_id);
      if (!data) continue;

      const color = interpolateColor(colorScale, data.intensity);
      
      elements.push(
        <ZoneHeatOverlay
          key={zone.element_id}
          zone={zone}
          color={color}
          opacity={0.6}
        />
      );
    }

    return elements;
  }, [activeOverlay, warehouseLayout?.zones, heatData]);

  if (overlayElements.length === 0) {
    return null;
  }

  return (
    <group key={`overlay-${activeOverlay}`}>
      {overlayElements}
    </group>
  );
}

// Memoize the entire component to prevent unnecessary re-renders
export default memo(OverlayRendererComponent);
