import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SelectionRingProps {
  radius: number;
  color?: string;
  position?: [number, number, number];
}

export default function SelectionRing({ 
  radius, 
  color = "#00D9FF",
  position = [0, 0.1, 0]
}: SelectionRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);

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
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
