import { useStore } from '../../state/store';
import ZonePulseOutline from './ZonePulseOutline';

export default function ZoneHighlighter() {
  const highlightedZones = useStore((state) => state.highlightedZones);
  const warehouseLayout = useStore((state) => state.warehouseLayout);

  if (!warehouseLayout || highlightedZones.size === 0) {
    return null;
  }

  return (
    <group>
      {Array.from(highlightedZones).map(zoneId => {
        const zone = warehouseLayout.zones.find(z => z.element_id === zoneId);
        if (!zone) return null;

        return (
          <ZonePulseOutline
            key={zoneId}
            zone={zone}
            color="#ff9800"
            pulseSpeed={1.5}
          />
        );
      })}
    </group>
  );
}
