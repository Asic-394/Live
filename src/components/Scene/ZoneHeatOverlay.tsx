import { useMemo, memo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { WarehouseLayoutElement } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';

interface ZoneHeatOverlayProps {
  zone: WarehouseLayoutElement;
  color: string;
  opacity?: number;
}

function ZoneHeatOverlayComponent({ zone, color, opacity = 0.6 }: ZoneHeatOverlayProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  const position = useMemo(() => {
    const pos = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
    // Position slightly above floor with unique offset per zone to prevent z-fighting
    const offset = (zone.element_id?.charCodeAt(0) || 0) % 10;
    return [pos.x, 0.02 + offset * 0.001, pos.z] as [number, number, number];
  }, [zone.x, zone.y, zone.z, zone.element_id]);

  const rotation = useMemo(() => {
    const rotRad = ((zone.rotation || 0) * Math.PI) / 180;
    return [-Math.PI / 2, 0, rotRad] as [number, number, number]; // Flat plane
  }, [zone.rotation]);

  // Update material color without recreating the material
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(color);
      materialRef.current.opacity = opacity;
      materialRef.current.needsUpdate = true;
    }
  }, [color, opacity]);

  return (
    <mesh 
      position={position} 
      rotation={rotation}
      renderOrder={100}
    >
      <planeGeometry args={[zone.width, zone.depth]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// Memoize to prevent re-renders when props haven't changed
export default memo(ZoneHeatOverlayComponent, (prev, next) => {
  return (
    prev.zone.element_id === next.zone.element_id &&
    prev.color === next.color &&
    prev.opacity === next.opacity
  );
});
