import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { getThemeConfig } from '../../utils/materials';

interface RackInventoryProps {
  width: number;
  height: number;
  depth: number;
  levels: number;
  isDimmed: boolean;
  cameraDistance: number;
}

interface BoxPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
  colorIndex: number;
}

// Deterministic random generator using rack dimensions as seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get shelf heights for pallets and boxes
function getShelfLevels(height: number): number[] {
  // Position pallets ON the beam levels (matching RackFrame beam positions)
  // Using bottom 3 beams: 10%, 35%, 65% (not the top beam at 95%)
  return [
    height * 0.1,   // Bottom beam
    height * 0.35,  // Low-mid beam
    height * 0.65,  // High-mid beam
  ];
}

// Generate box positions for the rack
function generateBoxPositions(
  width: number,
  height: number,
  depth: number,
  levels: number
): BoxPosition[] {
  const positions: BoxPosition[] = [];
  
  const shelfLevels = getShelfLevels(height);
  
  // Calculate vertical space between shelves
  const shelfSpacing = height * 0.25; // Space between beam levels
  
  // Configuration for exactly 3 boxes per rack shelf
  const columnsPerShelf = 3; // Fixed: 3 boxes per shelf
  const rowsPerShelf = 1; // Single row
  
  // Calculate box size to fit 3 boxes in the rack width
  const boxSpacing = 0.4;
  const boxSize = (width - (columnsPerShelf + 1) * boxSpacing) / columnsPerShelf;
  
  let seedCounter = 0;
  
  shelfLevels.forEach((shelfY, levelIndex) => {
    // Variable fill percentage (60-90% occupancy) for randomness
    const fillPercentage = 0.6 + seededRandom(seedCounter++) * 0.3;
    
    for (let col = 0; col < columnsPerShelf; col++) {
      for (let row = 0; row < rowsPerShelf; row++) {
        // Randomly decide if this slot should have a box
        if (seededRandom(seedCounter++) > fillPercentage) {
          continue;
        }
        
        // Calculate position in tight grid
        const startX = -width / 2 + boxSpacing;
        const startZ = -depth / 2 + boxSpacing;
        
        const x = startX + col * (boxSize + boxSpacing) + boxSize / 2;
        const z = startZ + row * (boxSize + boxSpacing) + boxSize / 2;
        
        // Position box on top of pallet
        const palletHeight = 0.3;
        const y = shelfY + palletHeight + boxSize / 2;
        
        // Very minimal rotation for slight realism
        const rotation = (seededRandom(seedCounter++) - 0.5) * 0.07;
        
        positions.push({
          x,
          y,
          z,
          rotation,
          scale: boxSize / 2.0, // Normalize to base size of 2.0 (uniform scale)
          colorIndex: 0, // Single color
        });
      }
    }
  });
  
  return positions;
}

export default function RackInventory({
  width,
  height,
  depth,
  levels,
  isDimmed,
  cameraDistance,
}: RackInventoryProps) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  
  // Generate box positions (memoized based on rack dimensions)
  const boxPositions = useMemo(() => {
    return generateBoxPositions(width, height, depth, levels);
  }, [width, height, depth, levels]);
  
  // Get shelf levels for pallet rendering
  const shelfLevels = useMemo(() => getShelfLevels(height), [height]);
  
  // Theme token: box and pallet colors
  const boxColor = useMemo(() => new THREE.Color(colors.boxMedium), [colors.boxMedium]);
  const palletColor = useMemo(() => colors.boxBase, [colors.boxBase]);
  
  // Don't render if no boxes
  if (boxPositions.length === 0) {
    return null;
  }
  
  // Simplified opacity - fully opaque unless dimmed
  const opacity = isDimmed ? 0.4 : 1.0;
  const shouldBeTransparent = isDimmed;
  
  // Pallet dimensions - extend beyond rack to rest on beams
  const palletHeight = 0.3;
  const palletWidth = width * 1.05; // Extend beyond rack width to rest on side beams
  const palletDepth = depth * 1.1; // Extend beyond rack depth to rest on front/back beams
  
  return (
    <>
      {/* Pallets on each shelf level */}
      {shelfLevels.map((beamY, levelIdx) => {
        // Position pallet on top of the beam
        const palletY = beamY + palletHeight / 2;
        return (
          <mesh
            key={`pallet-${levelIdx}`}
            position={[0, palletY, 0]}
            castShadow={false}
            receiveShadow={false}
          >
            <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
            <meshStandardMaterial
              color={palletColor}
              roughness={config.materials.entity.roughness * 1.5}
              metalness={config.materials.entity.metalness * 0.7}
              transparent={shouldBeTransparent}
              opacity={opacity}
            />
          </mesh>
        );
      })}
      
      {/* Boxes on pallets */}
      {boxPositions.map((pos, i) => (
        <mesh
          key={`box-${i}`}
          position={[pos.x, pos.y, pos.z]}
          rotation={[0, pos.rotation, 0]}
          scale={pos.scale} // Uniform scale for proportional boxes
          castShadow={false}
          receiveShadow={false}
        >
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color={boxColor}
            roughness={config.materials.entity.roughness * 1.3}
            metalness={config.materials.entity.metalness * 0.5}
            transparent={shouldBeTransparent}
            opacity={opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}
