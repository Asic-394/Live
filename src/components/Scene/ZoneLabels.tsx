import { useMemo, memo } from 'react';
import { Text } from '@react-three/drei';
import { useStore } from '../../state/store';
import { CoordinateMapper } from '../../utils/coordinates';
import type { WarehouseLayoutElement } from '../../types';

interface ZoneLabelProps {
  zone: WarehouseLayoutElement;
}

function ZoneLabel({ zone }: ZoneLabelProps) {
  const { position, rotation } = useMemo(() => {
    const pos = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
    const labelY = 0.15;
    const frontOffset = (zone.depth / 2) - 3;
    
    const labelPos = [pos.x, labelY, pos.z + frontOffset] as [number, number, number];
    
    const zoneRotRad = ((zone.rotation || 0) * Math.PI) / 180;
    const labelRot = [-Math.PI / 2, 0, zoneRotRad] as [number, number, number];
    
    return { position: labelPos, rotation: labelRot };
  }, [zone.x, zone.y, zone.z, zone.depth, zone.rotation]);

  const labelText = useMemo(() => {
    return zone.name || zone.element_id;
  }, [zone.name, zone.element_id]);

  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={3.5}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.3}
      outlineColor="#000000"
      outlineOpacity={1}
      renderOrder={99}
    >
      {labelText}
    </Text>
  );
}

function ZoneLabelsComponent() {
  const warehouseLayout = useStore((state) => state.warehouseLayout);

  const labels = useMemo(() => {
    if (!warehouseLayout?.zones) {
      return [];
    }

    return warehouseLayout.zones.map((zone) => (
      <ZoneLabel key={zone.element_id} zone={zone} />
    ));
  }, [warehouseLayout?.zones]);

  if (labels.length === 0) {
    return null;
  }

  return <group>{labels}</group>;
}

export default memo(ZoneLabelsComponent);
