import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { LineBasicMaterial, BoxGeometry, Group } from 'three';
import type { WarehouseLayoutElement } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';

interface ZonePulseOutlineProps {
  zone: WarehouseLayoutElement;
  color?: string;
  pulseSpeed?: number;
}

export default function ZonePulseOutline({ 
  zone, 
  color = '#ff9800',
  pulseSpeed = 1.5 
}: ZonePulseOutlineProps) {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<LineBasicMaterial>(null);

  // Animate pulse effect
  useFrame(({ clock }) => {
    if (materialRef.current) {
      // Pulse opacity between 0.6 and 1.0
      const time = clock.getElapsedTime() * pulseSpeed;
      const opacity = 0.6 + Math.sin(time * Math.PI) * 0.4;
      materialRef.current.opacity = opacity;
    }

    if (groupRef.current) {
      // Slight scale pulse
      const time = clock.getElapsedTime() * pulseSpeed;
      const scale = 1.0 + Math.sin(time * Math.PI) * 0.02;
      groupRef.current.scale.set(scale, 1, scale);
    }
  });

  const position = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
  const rotation = ((zone.rotation || 0) * Math.PI) / 180;

  return (
    <group 
      ref={groupRef}
      position={[position.x, 0.2, position.z]} 
      rotation={[0, rotation, 0]}
    >
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(zone.width, 0.5, zone.depth)]} />
        <lineBasicMaterial
          ref={materialRef}
          color={color}
          transparent={true}
          opacity={1.0}
          linewidth={2}
        />
      </lineSegments>
    </group>
  );
}
