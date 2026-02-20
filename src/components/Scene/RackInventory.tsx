import { useMemo } from 'react';
import { useStore } from '../../state/store';
import { getThemeConfig } from '../../utils/materials';
import { GeometryPool } from '../../utils/GeometryPool';
import { MaterialPool } from '../../utils/MaterialPool';

interface RackInventoryProps {
  rackId: string;
  width: number;
  height: number;
  depth: number;
  levels: number;
  isDimmed: boolean;
  isSelected: boolean;
  cameraDistance: number;
}

// Get shelf heights for pallets
function getShelfLevels(height: number): number[] {
  // Position pallets ON the beam levels (matching RackFrame beam positions)
  // Using bottom 3 beams: 10%, 35%, 65% (not the top beam at 95%)
  return [
    height * 0.1,   // Bottom beam
    height * 0.35,  // Low-mid beam
    height * 0.65,  // High-mid beam
  ];
}

export default function RackInventory({
  width,
  height,
  depth,
  isDimmed,
  isSelected,
}: RackInventoryProps) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  
  // Get shelf levels for pallet rendering
  const shelfLevels = useMemo(() => getShelfLevels(height), [height]);
  
  // Simplified opacity - fully opaque unless dimmed
  const opacity = isDimmed ? 0.4 : 1.0;
  const shouldBeTransparent = isDimmed;
  
  // Pallet dimensions - extend beyond rack to rest on beams
  const palletHeight = 0.3;
  const palletWidth = width * 1.05; // Extend beyond rack width to rest on side beams
  const palletDepth = depth * 1.1; // Extend beyond rack depth to rest on front/back beams
  
  // Use pooled geometry and materials
  const palletGeometry = useMemo(() => GeometryPool.getBox(palletWidth, palletHeight, palletDepth), [palletWidth, palletHeight, palletDepth]);
  const palletMaterial = useMemo(() => 
    MaterialPool.getStandardMaterial({
      color: isSelected ? colors.rackSelected : colors.boxBase,
      roughness: config.materials.entity.roughness * 1.5,
      metalness: isSelected ? 0.5 : config.materials.entity.metalness * 0.7,
      transparent: shouldBeTransparent,
      opacity: opacity,
      emissive: isSelected ? colors.selectionGlow : '#000000',
      emissiveIntensity: isSelected ? config.effects.selection.emissiveIntensity * 0.15 : 0,
    }),
    [colors.boxBase, colors.rackSelected, colors.selectionGlow, isSelected, config.materials.entity, config.effects.selection, shouldBeTransparent, opacity]
  );
  
  return (
    <>
      {/* Pallets on each shelf level - using pooled geometry and materials */}
      {shelfLevels.map((beamY, levelIdx) => {
        // Position pallet on top of the beam
        const palletY = beamY + palletHeight / 2;
        return (
          <mesh
            key={`pallet-${levelIdx}`}
            position={[0, palletY, 0]}
            geometry={palletGeometry}
            material={palletMaterial}
            castShadow={false}
            receiveShadow={false}
          />
        );
      })}
      
      {/* All inventory boxes rendered by InstancedInventoryBoxes in parent component */}
      {/* Decorative boxes removed - instanced rendering handles all boxes */}
    </>
  );
}
