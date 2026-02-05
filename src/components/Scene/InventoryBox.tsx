import { useState } from 'react';
import type { Box } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
import { getThemeConfig } from '../../utils/materials';
import { useStore } from '../../state/store';
import { RackSlots } from '../../utils/RackSlots';
import BlobShadow from './BlobShadow';

interface Props {
  box: Box;
  isSelected: boolean;
  isDimmed?: boolean;
  onClick: () => void;
  scale?: number;
}

/**
 * 3D representation of an inventory box/bin
 * Color-coded by status with selection and hover effects
 */
export default function InventoryBox({ box, isSelected, isDimmed = false, onClick, scale = 1 }: Props) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  const [hovered, setHovered] = useState(false);
  const warehouseLayout = useStore((state) => state.warehouseLayout);

  // Get rack to use slot-based positioning
  const rack = warehouseLayout?.racks.find(r => r.element_id === box.rack_id);
  
  // Use slot-based positioning for boxes in racks
  const pos = rack 
    ? RackSlots.getSlotPosition(box.level, box.position, {
        width: rack.width,
        height: rack.height || 20,
        depth: rack.depth,
      })
    : CoordinateMapper.csvToThree(box.x, box.y, box.z);
  
  const opacity = isDimmed ? 0.4 : 1.0;

  // Emissive intensity for selection/hover
  const emissiveIntensity = isSelected 
    ? config.effects.selection.emissiveIntensity * 0.3
    : hovered 
    ? config.effects.hover.emissiveIntensity 
    : 0;

  // Color based on status
  const getBoxColor = () => {
    if (isSelected) {
      return colors.inventorySelected || '#4ade80'; // Green when selected
    }

    switch (box.status) {
      case 'stored':
        return colors.inventory || '#60a5fa'; // Blue for stored
      case 'staged':
        return '#facc15'; // Yellow for staged
      case 'in_transit':
        return '#fb923c'; // Orange for in transit
      case 'empty':
        return '#9ca3af'; // Gray for empty
      default:
        return colors.inventory || '#60a5fa';
    }
  };

  // Box size - slightly smaller than standard inventory mesh
  const boxSize = 2.5;

  // Capacity indicator - visualize how full the box is
  const capacityHeight = (box.capacity_used / 100) * boxSize;

  return (
    <group position={[pos.x, pos.y, pos.z]} scale={scale}>
      {/* Blob shadow - only for boxes on the ground or in transit */}
      {(box.status === 'staged' || box.status === 'in_transit' || box.z < 1) && (
        <BlobShadow width={boxSize + 0.5} depth={boxSize + 0.5} opacity={isDimmed ? 0.15 : undefined} />
      )}
      
      {/* Main box mesh */}
      <mesh
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[boxSize, boxSize, boxSize]} />
        <meshStandardMaterial
          color={getBoxColor()}
          emissive={isSelected || hovered ? getBoxColor() : '#000000'}
          emissiveIntensity={emissiveIntensity * opacity}
          transparent={isDimmed}
          opacity={opacity}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Capacity fill indicator - inner box showing how full it is */}
      {box.capacity_used > 0 && (
        <mesh position={[0, -(boxSize - capacityHeight) / 2, 0]}>
          <boxGeometry args={[boxSize * 0.9, capacityHeight, boxSize * 0.9]} />
          <meshStandardMaterial
            color={theme === 'dark' ? '#1e293b' : '#f1f5f9'}
            transparent
            opacity={0.3 * opacity}
            roughness={0.8}
          />
        </mesh>
      )}

      {/* Selection outline */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[boxSize + 0.2, boxSize + 0.2, boxSize + 0.2]} />
          <meshBasicMaterial
            color={colors.inventorySelected || '#4ade80'}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}

      {/* Hover outline */}
      {hovered && !isSelected && (
        <mesh>
          <boxGeometry args={[boxSize + 0.15, boxSize + 0.15, boxSize + 0.15]} />
          <meshBasicMaterial
            color={getBoxColor()}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}
