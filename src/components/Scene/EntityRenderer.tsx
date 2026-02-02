import { useState } from 'react';
import type { Entity } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
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
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow */}
      <BlobShadow width={2.5} depth={2.5} opacity={isDimmed ? 0.15 : 0.25} />
      
      {/* Worker cylinder */}
      <mesh
        position={[0, 3, 0]}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[1, 1, 6]} />
        <meshStandardMaterial
          color={isSelected ? '#d97706' : '#c2410c'}
          emissive={isSelected || hovered ? '#c2410c' : '#000000'}
          emissiveIntensity={(isSelected || hovered ? 0.2 : 0) * opacity}
          roughness={0.6}
          metalness={0.1}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

function ForkliftMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  return (
    <group position={[pos.x, 0, pos.z]} onClick={onSelect}>
      {/* Blob shadow */}
      <BlobShadow width={5} depth={7} opacity={isDimmed ? 0.15 : 0.3} />
      
      {/* Body */}
      <mesh
        position={[0, 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[4, 4, 6]} />
        <meshStandardMaterial
          color={isSelected ? '#ca8a04' : '#a16207'}
          emissive={isSelected || hovered ? '#a16207' : '#000000'}
          emissiveIntensity={(isSelected || hovered ? 0.2 : 0) * opacity}
          roughness={0.5}
          metalness={0.3}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
      {/* Forks */}
      <mesh position={[0, 1, 4]}>
        <boxGeometry args={[3, 1, 3]} />
        <meshStandardMaterial 
          color="#52525b" 
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
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow */}
      <BlobShadow width={4.5} depth={4.5} opacity={isDimmed ? 0.15 : 0.25} />
      
      {/* Pallet */}
      <mesh
        position={[0, 1, 0]}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial
          color={isSelected ? '#78350f' : '#451a03'}
          emissive={isSelected || hovered ? '#451a03' : '#000000'}
          emissiveIntensity={(isSelected || hovered ? 0.15 : 0) * opacity}
          roughness={0.85}
          metalness={0.0}
          transparent={isDimmed}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

function InventoryMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow (only if on ground) */}
      {(entity.z === undefined || entity.z === 0) && (
        <BlobShadow width={3.5} depth={3.5} opacity={isDimmed ? 0.15 : 0.25} />
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
          color={isSelected ? '#71717a' : '#52525b'}
          emissive={isSelected || hovered ? '#52525b' : '#000000'}
          emissiveIntensity={(isSelected || hovered ? 0.15 : 0) * opacity}
          roughness={0.7}
          metalness={0.2}
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
