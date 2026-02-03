import { useMemo } from 'react';
import * as THREE from 'three';
import type { Theme } from '../../types';
import { getThemeConfig } from '../../utils/materials';

interface RackFrameProps {
  width: number;
  height: number;
  depth: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  theme: Theme;
  roughness?: number;
  metalness?: number;
}

export default function RackFrame({
  width,
  height,
  depth,
  color,
  emissive,
  emissiveIntensity,
  theme,
  roughness,
  metalness,
}: RackFrameProps) {
  // Theme token: use theme material properties if not overridden
  const config = getThemeConfig(theme);
  const finalRoughness = roughness ?? config.materials.rack.roughness;
  const finalMetalness = metalness ?? config.materials.rack.metalness;
  // Memoize upright and beam positions for performance
  const uprightPositions = useMemo(() => {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    return [
      [-halfWidth, 0, -halfDepth], // Front left
      [halfWidth, 0, -halfDepth],  // Front right
      [-halfWidth, 0, halfDepth],  // Back left
      [halfWidth, 0, halfDepth],   // Back right
    ];
  }, [width, depth]);

  const beamLevels = useMemo(() => {
    // Create 4 horizontal levels (bottom, low-mid, high-mid, top)
    return [
      height * 0.1,   // Bottom
      height * 0.35,  // Low-mid
      height * 0.65,  // High-mid
      height * 0.95,  // Top
    ];
  }, [height]);

  // Slightly dimmed color for depth hierarchy
  const dimmedColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.85); // 15% darker for inner beams
    return `#${c.getHexString()}`;
  }, [color]);

  return (
    <group>
      {/* Vertical uprights at corners - thicker outer frame */}
      {uprightPositions.map((pos, i) => (
        <mesh key={`upright-${i}`} position={[pos[0], height / 2, pos[2]]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, height, 8]} />
          <meshStandardMaterial
            color={color}
            roughness={finalRoughness}
            metalness={finalMetalness}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}

      {/* Horizontal beams connecting uprights at each level */}
      {beamLevels.map((level, levelIdx) => {
        // Top and bottom are outer frame (thicker), middle levels are inner beams (thinner)
        const isOuterFrame = levelIdx === 0 || levelIdx === beamLevels.length - 1;
        const beamSize = isOuterFrame ? 0.25 : 0.15;
        const beamColor = isOuterFrame ? color : dimmedColor;
        const beamEmissive = isOuterFrame ? emissiveIntensity : emissiveIntensity * 0.7;
        
        return (
          <group key={`level-${levelIdx}`}>
            {/* Front beam (left to right) */}
            <mesh position={[0, level, -depth / 2]} castShadow>
              <boxGeometry args={[width, beamSize, beamSize]} />
              <meshStandardMaterial
                color={beamColor}
                roughness={finalRoughness}
                metalness={finalMetalness}
                emissive={emissive}
                emissiveIntensity={beamEmissive}
              />
            </mesh>

            {/* Back beam (left to right) */}
            <mesh position={[0, level, depth / 2]} castShadow>
              <boxGeometry args={[width, beamSize, beamSize]} />
              <meshStandardMaterial
                color={beamColor}
                roughness={finalRoughness}
                metalness={finalMetalness}
                emissive={emissive}
                emissiveIntensity={beamEmissive}
              />
            </mesh>

            {/* Left beam (front to back) */}
            <mesh position={[-width / 2, level, 0]} castShadow>
              <boxGeometry args={[beamSize, beamSize, depth]} />
              <meshStandardMaterial
                color={beamColor}
                roughness={finalRoughness}
                metalness={finalMetalness}
                emissive={emissive}
                emissiveIntensity={beamEmissive}
              />
            </mesh>

            {/* Right beam (front to back) */}
            <mesh position={[width / 2, level, 0]} castShadow>
              <boxGeometry args={[beamSize, beamSize, depth]} />
              <meshStandardMaterial
                color={beamColor}
                roughness={finalRoughness}
                metalness={finalMetalness}
                emissive={emissive}
                emissiveIntensity={beamEmissive}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
