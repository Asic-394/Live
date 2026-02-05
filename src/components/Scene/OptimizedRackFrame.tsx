import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Theme } from '../../types';
import { getThemeConfig } from '../../utils/materials';
import { GeometryPool } from '../../utils/GeometryPool';
import { MaterialPool } from '../../utils/MaterialPool';

interface OptimizedRackFrameProps {
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

/**
 * Optimized rack frame using merged geometries
 * Reduces 20 meshes per rack to 1 merged mesh
 * Significant performance improvement for scenes with many racks
 */
export default function OptimizedRackFrame({
  width,
  height,
  depth,
  color,
  emissive,
  emissiveIntensity,
  theme,
  roughness,
  metalness,
}: OptimizedRackFrameProps) {
  const config = getThemeConfig(theme);
  const finalRoughness = roughness ?? config.materials.rack.roughness;
  const finalMetalness = metalness ?? config.materials.rack.metalness;

  // Create merged geometry for all rack components
  const mergedGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    const matrix = new THREE.Matrix4();

    // Vertical uprights at corners (4 corners)
    const uprightGeometry = GeometryPool.getCylinder(0.22, 0.22, height, 8);
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const uprightPositions = [
      [-halfWidth, height / 2, -halfDepth], // Front left
      [halfWidth, height / 2, -halfDepth],  // Front right
      [-halfWidth, height / 2, halfDepth],  // Back left
      [halfWidth, height / 2, halfDepth],   // Back right
    ];

    uprightPositions.forEach((pos) => {
      matrix.setPosition(pos[0], pos[1], pos[2]);
      const clonedGeometry = uprightGeometry.clone();
      clonedGeometry.applyMatrix4(matrix);
      geometries.push(clonedGeometry);
    });

    // Horizontal beams at 4 levels
    const beamLevels = [
      height * 0.1,   // Bottom
      height * 0.35,  // Low-mid
      height * 0.65,  // High-mid
      height * 0.95,  // Top
    ];

    beamLevels.forEach((level, levelIdx) => {
      const isOuterFrame = levelIdx === 0 || levelIdx === beamLevels.length - 1;
      const beamSize = isOuterFrame ? 0.25 : 0.15;
      
      // Front beam
      const frontBeam = GeometryPool.getBox(width, beamSize, beamSize);
      matrix.setPosition(0, level, -depth / 2);
      const frontClone = frontBeam.clone();
      frontClone.applyMatrix4(matrix);
      geometries.push(frontClone);

      // Back beam
      matrix.setPosition(0, level, depth / 2);
      const backClone = frontBeam.clone();
      backClone.applyMatrix4(matrix);
      geometries.push(backClone);

      // Left beam
      const sideBeam = GeometryPool.getBox(beamSize, beamSize, depth);
      matrix.setPosition(-width / 2, level, 0);
      const leftClone = sideBeam.clone();
      leftClone.applyMatrix4(matrix);
      geometries.push(leftClone);

      // Right beam
      matrix.setPosition(width / 2, level, 0);
      const rightClone = sideBeam.clone();
      rightClone.applyMatrix4(matrix);
      geometries.push(rightClone);
    });

    // Merge all geometries into one
    const merged = mergeGeometries(geometries, false);
    
    // Clean up cloned geometries
    geometries.forEach(g => g.dispose());
    
    return merged;
  }, [width, height, depth]);

  // Create material with theme-aware properties
  const material = useMemo(() => {
    return MaterialPool.getStandardMaterial({
      color,
      roughness: finalRoughness,
      metalness: finalMetalness,
      emissive,
      emissiveIntensity,
    });
  }, [color, finalRoughness, finalMetalness, emissive, emissiveIntensity]);

  return (
    <mesh 
      geometry={mergedGeometry} 
      material={material}
      castShadow={false}  // Disable shadows on rack frames for performance
      receiveShadow={false}
    />
  );
}
