import { useState } from 'react';
import type { Entity } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
import { getThemeConfig } from '../../utils/materials';
import { useStore } from '../../state/store';
import BlobShadow from './BlobShadow';

interface Props {
  entities: Entity[];
}

interface EntityMeshProps {
  entity: Entity;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: () => void;
}

function WorkerMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  // Theme token: selection and hover emissive intensity
  const emissiveIntensity = isSelected 
    ? config.effects.selection.emissiveIntensity * 0.3  // Slightly reduced for entities
    : hovered 
    ? config.effects.hover.emissiveIntensity 
    : 0;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow */}
      <BlobShadow width={2.5} depth={2.5} opacity={isDimmed ? 0.15 : undefined} />
      
      {/* Worker cylinder */}
      <mesh
        position={[0, 3, 0]}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[1, 1, 6]} />
        <meshStandardMaterial
          color={isSelected ? colors.workerSelected : colors.worker}
          emissive={isSelected || hovered ? colors.worker : '#000000'}
          emissiveIntensity={emissiveIntensity * opacity}  // Theme token: hover/selection glow
          roughness={config.materials.entity.roughness}
          metalness={config.materials.entity.metalness}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

function ForkliftMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  // Theme token: selection and hover emissive intensity
  const emissiveIntensity = isSelected 
    ? config.effects.selection.emissiveIntensity * 0.3 
    : hovered 
    ? config.effects.hover.emissiveIntensity 
    : 0;

  return (
    <group position={[pos.x, 0, pos.z]} onClick={onSelect}>
      {/* Blob shadow */}
      <BlobShadow width={5} depth={7} opacity={isDimmed ? 0.15 : undefined} />
      
      {/* Body */}
      <mesh
        position={[0, 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[4, 4, 6]} />
        <meshStandardMaterial
          color={isSelected ? colors.forkliftSelected : colors.forklift}
          emissive={isSelected || hovered ? colors.forklift : '#000000'}
          emissiveIntensity={emissiveIntensity * opacity}  // Theme token: hover/selection glow
          roughness={config.materials.entity.roughness * 0.85}
          metalness={config.materials.entity.metalness * 2}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
      {/* Forks */}
      <mesh position={[0, 1, 4]}>
        <boxGeometry args={[3, 1, 3]} />
        <meshStandardMaterial 
          color={colors.forkliftForks} 
          roughness={0.4} 
          metalness={0.6}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

function PalletMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  // Theme token: selection and hover emissive intensity
  const emissiveIntensity = isSelected 
    ? config.effects.selection.emissiveIntensity * 0.25 
    : hovered 
    ? config.effects.hover.emissiveIntensity * 0.8 
    : 0;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow */}
      <BlobShadow width={4.5} depth={4.5} opacity={isDimmed ? 0.15 : undefined} />
      
      {/* Pallet */}
      <mesh
        position={[0, 1, 0]}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial
          color={isSelected ? colors.palletSelected : colors.pallet}
          emissive={isSelected || hovered ? colors.pallet : '#000000'}
          emissiveIntensity={emissiveIntensity * opacity}  // Theme token: hover/selection glow
          roughness={config.materials.entity.roughness * 1.4}
          metalness={0.0}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

function InventoryMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  // Theme token: selection and hover emissive intensity
  const emissiveIntensity = isSelected 
    ? config.effects.selection.emissiveIntensity * 0.25 
    : hovered 
    ? config.effects.hover.emissiveIntensity * 0.8 
    : 0;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow (only if on ground) */}
      {(entity.z === undefined || entity.z === 0) && (
        <BlobShadow width={3.5} depth={3.5} opacity={isDimmed ? 0.15 : undefined} />
      )}
      
      {/* Inventory box */}
      <mesh
        position={[0, pos.y, 0]}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial
          color={colors.inventory}
          emissive={isSelected || hovered ? colors.inventory : '#000000'}
          emissiveIntensity={emissiveIntensity * opacity}  // Theme token: hover/selection glow
          roughness={config.materials.entity.roughness * 1.1}
          metalness={config.materials.entity.metalness * 1.3}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

export default function EntityRenderer({ entities }: Props) {
  const selectedEntity = useStore((state) => state.selectedEntity);
  const selectedRack = useStore((state) => state.selectedRack);
  const selectEntity = useStore((state) => state.selectEntity);
  const selectRack = useStore((state) => state.selectRack);

  return (
    <group>
      {entities.map((entity) => {
        const isSelected = entity.entity_id === selectedEntity;
        
        // Determine if entity should be dimmed
        // Dim if: a rack is selected AND this entity is not in that rack AND this entity is not selected
        const isInSelectedRack = selectedRack && entity.zone === selectedRack;
        const isDimmed = Boolean(selectedRack && !isInSelectedRack && !isSelected);
        
        // Special handler for inventory items - also select parent rack
        const handleSelect = () => {
          selectEntity(entity.entity_id);
          
          // If this is an inventory item in a rack, also select the rack
          if (entity.entity_type === 'inventory' && entity.zone && entity.zone.startsWith('Rack-')) {
            selectRack(entity.zone);
          } else {
            // Clear rack selection for non-inventory items
            selectRack(null);
          }
        };

        switch (entity.entity_type) {
          case 'worker':
            return (
              <WorkerMesh
                key={entity.entity_id}
                entity={entity}
                isSelected={isSelected}
                isDimmed={isDimmed}
                onSelect={handleSelect}
              />
            );
          case 'forklift':
            return (
              <ForkliftMesh
                key={entity.entity_id}
                entity={entity}
                isSelected={isSelected}
                isDimmed={isDimmed}
                onSelect={handleSelect}
              />
            );
          case 'pallet':
            return (
              <PalletMesh
                key={entity.entity_id}
                entity={entity}
                isSelected={isSelected}
                isDimmed={isDimmed}
                onSelect={handleSelect}
              />
            );
          case 'inventory':
            return (
              <InventoryMesh
                key={entity.entity_id}
                entity={entity}
                isSelected={isSelected}
                isDimmed={isDimmed}
                onSelect={handleSelect}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
}
