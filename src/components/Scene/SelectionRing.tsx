import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneTheme } from '../../utils/useSceneTheme';

interface SelectionRingProps {
  radius: number;
  color?: string;
  position?: [number, number, number];
}

export default function SelectionRing({ 
  radius, 
  color,
  position = [0, 0.1, 0]
}: SelectionRingProps) {
  const themeConfig = useSceneTheme();
  const ringRef = useRef<THREE.Mesh>(null);
  const ringColor = color ?? themeConfig.colors.selectionGlow;

  // Animate rotation - single smooth rotation
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Single selection ring with subtle glow */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.85, radius * 0.95, 48]} />
        <meshStandardMaterial
          color={ringColor}
          emissive={ringColor}
          emissiveIntensity={themeConfig.effects.selection.emissiveIntensity * 0.5}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
