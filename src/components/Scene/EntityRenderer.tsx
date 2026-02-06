import { useState, useMemo } from 'react';
import type { Entity } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
import { getThemeConfig } from '../../utils/materials';
import { useStore } from '../../state/store';
import { GeometryPool } from '../../utils/GeometryPool';
import { MaterialPool } from '../../utils/MaterialPool';
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
  const useRealShadows = useStore((state) => state.useRealShadows);
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

  // Use pooled geometry
  const geometry = useMemo(() => GeometryPool.getCylinder(1, 1, 6), []);

  // Use pooled material with dynamic properties
  const material = useMemo(() => {
    const baseColor = isSelected ? colors.workerSelected : colors.worker;
    const emissiveColor = isSelected || hovered ? colors.worker : '#000000';
    
    return MaterialPool.getStandardMaterial({
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: emissiveIntensity * opacity,
      roughness: config.materials.entity.roughness,
      metalness: config.materials.entity.metalness,
      transparent: isDimmed,
      opacity: opacity,
    });
  }, [isSelected, hovered, isDimmed, colors, config, emissiveIntensity, opacity]);

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow */}
      {!useRealShadows && (
        <BlobShadow width={2.5} depth={2.5} opacity={isDimmed ? 0.15 : undefined} />
      )}
      
      {/* Worker cylinder - using pooled geometry and material */}
      <mesh
        position={[0, 3, 0]}
        geometry={geometry}
        material={material}
        castShadow={useRealShadows}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
    </group>
  );
}

function ForkliftMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const useRealShadows = useStore((state) => state.useRealShadows);
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

  // Use pooled geometries - enhanced forklift design
  const bodyGeometry = useMemo(() => GeometryPool.getBox(3.5, 2.5, 4), []);
  const mastGeometry = useMemo(() => GeometryPool.getBox(0.4, 6, 0.4), []);
  const forkTineGeometry = useMemo(() => GeometryPool.getBox(0.3, 0.3, 3.5), []);
  const wheelGeometry = useMemo(() => GeometryPool.getCylinder(0.6, 0.6, 0.5, 8), []);
  const overheadGuardGeometry = useMemo(() => GeometryPool.getBox(3, 0.2, 3.5), []);
  const seatGeometry = useMemo(() => GeometryPool.getBox(1.2, 0.6, 1), []);

  // Use pooled materials
  const bodyMaterial = useMemo(() => 
    MaterialPool.getStandardMaterial({
      color: isSelected ? colors.forkliftSelected : colors.forklift,
      emissive: isSelected || hovered ? colors.forklift : '#000000',
      emissiveIntensity: emissiveIntensity * opacity,
      roughness: config.materials.entity.roughness * 0.85,
      metalness: config.materials.entity.metalness * 2,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [isSelected, hovered, isDimmed, colors, config, emissiveIntensity, opacity]
  );

  const forksMaterial = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: colors.forkliftForks,
      roughness: 0.4,
      metalness: 0.6,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [colors.forkliftForks, isDimmed, opacity]
  );

  const wheelMaterial = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
      metalness: 0.1,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [isDimmed, opacity]
  );

  const mastMaterial = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: colors.forkliftForks,
      roughness: 0.5,
      metalness: 0.5,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [colors.forkliftForks, isDimmed, opacity]
  );

  return (
    <group position={[pos.x, 0, pos.z]} onClick={onSelect}>
      {/* Blob shadow */}
      {!useRealShadows && (
        <BlobShadow width={5} depth={7} opacity={isDimmed ? 0.15 : undefined} />
      )}
      
      {/* Main Body */}
      <mesh
        position={[0, 1.5, 0]}
        geometry={bodyGeometry}
        material={bodyMaterial}
        castShadow={useRealShadows}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {/* Seat */}
      <mesh
        position={[0, 2.8, 0.3]}
        geometry={seatGeometry}
        material={bodyMaterial}
        castShadow={useRealShadows}
      />

      {/* Overhead Guard */}
      <mesh
        position={[0, 5.5, 0]}
        geometry={overheadGuardGeometry}
        material={mastMaterial}
        castShadow={useRealShadows}
      />

      {/* Mast (vertical support) */}
      <mesh
        position={[0, 4, 2.2]}
        geometry={mastGeometry}
        material={mastMaterial}
        castShadow={useRealShadows}
      />

      {/* Fork Tines (left and right) */}
      <mesh 
        position={[-0.8, 1.2, 3.5]}
        geometry={forkTineGeometry}
        material={forksMaterial}
        castShadow={useRealShadows}
      />
      <mesh 
        position={[0.8, 1.2, 3.5]}
        geometry={forkTineGeometry}
        material={forksMaterial}
        castShadow={useRealShadows}
      />

      {/* Wheels - Front (rotated 90 degrees on Z axis) */}
      <mesh
        position={[-1.2, 0.6, 1.5]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />
      <mesh
        position={[1.2, 0.6, 1.5]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />

      {/* Wheels - Rear */}
      <mesh
        position={[-1.2, 0.6, -1.2]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />
      <mesh
        position={[1.2, 0.6, -1.2]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />
    </group>
  );
}

function PalletMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const useRealShadows = useStore((state) => state.useRealShadows);
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

  // Use pooled geometry
  const geometry = useMemo(() => GeometryPool.getBox(4, 2, 4), []);

  // Use pooled material
  const material = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: isSelected ? colors.palletSelected : colors.pallet,
      emissive: isSelected || hovered ? colors.pallet : '#000000',
      emissiveIntensity: emissiveIntensity * opacity,
      roughness: config.materials.entity.roughness * 1.4,
      metalness: 0.0,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [isSelected, hovered, isDimmed, colors, config, emissiveIntensity, opacity]
  );

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow */}
      {!useRealShadows && (
        <BlobShadow width={4.5} depth={4.5} opacity={isDimmed ? 0.15 : undefined} />
      )}
      
      {/* Pallet - using pooled geometry and material */}
      <mesh
        position={[0, 1, 0]}
        geometry={geometry}
        material={material}
        castShadow={useRealShadows}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
    </group>
  );
}

function InventoryMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const useRealShadows = useStore((state) => state.useRealShadows);
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

  // Use pooled geometry
  const geometry = useMemo(() => GeometryPool.getBox(3, 3, 3), []);

  // Use pooled material
  const material = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: colors.inventory,
      emissive: isSelected || hovered ? colors.inventory : '#000000',
      emissiveIntensity: emissiveIntensity * opacity,
      roughness: config.materials.entity.roughness * 1.1,
      metalness: config.materials.entity.metalness * 1.3,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [isSelected, hovered, isDimmed, colors, config, emissiveIntensity, opacity]
  );

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Blob shadow (only if on ground) */}
      {!useRealShadows && (entity.z === undefined || entity.z === 0) && (
        <BlobShadow width={3.5} depth={3.5} opacity={isDimmed ? 0.15 : undefined} />
      )}
      
      {/* Inventory box - using pooled geometry and material */}
      <mesh
        position={[0, pos.y, 0]}
        geometry={geometry}
        material={material}
        castShadow={useRealShadows}
        onClick={onSelect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
    </group>
  );
}

function TruckMesh({ entity, isSelected, isDimmed, onSelect }: EntityMeshProps) {
  const theme = useStore((state) => state.theme);
  const useRealShadows = useStore((state) => state.useRealShadows);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  const pos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
  const [hovered, setHovered] = useState(false);
  const opacity = isDimmed ? 0.4 : 1.0;

  // Get rotation from entity (convert degrees to radians)
  const rotation = entity.metadata?.rotation || 0;
  const rotationRad = (rotation * Math.PI) / 180;

  // Theme token: selection and hover emissive intensity
  const emissiveIntensity = isSelected 
    ? config.effects.selection.emissiveIntensity * 0.3 
    : hovered 
    ? config.effects.hover.emissiveIntensity 
    : 0;

  // Use pooled geometries
  const cabGeometry = useMemo(() => GeometryPool.getBox(10, 6, 8), []);
  const trailerGeometry = useMemo(() => GeometryPool.getBox(10, 8, 22), []);
  const wheelGeometry = useMemo(() => GeometryPool.getCylinder(1.8, 1.8, 3.0), []);

  // Use pooled materials
  const cabMaterial = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: isSelected ? colors.truckSelected : colors.truckCab,
      emissive: isSelected || hovered ? colors.truckCab : '#000000',
      emissiveIntensity: emissiveIntensity * opacity,
      roughness: config.materials.entity.roughness * 0.8,
      metalness: config.materials.entity.metalness * 2,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [isSelected, hovered, isDimmed, colors, config, emissiveIntensity, opacity]
  );

  const trailerMaterial = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: isSelected ? colors.truckSelected : colors.truckTrailer,
      emissive: isSelected || hovered ? colors.truckTrailer : '#000000',
      emissiveIntensity: emissiveIntensity * opacity * 0.5,
      roughness: config.materials.entity.roughness,
      metalness: config.materials.entity.metalness * 1.5,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [isSelected, hovered, isDimmed, colors, config, emissiveIntensity, opacity]
  );

  const wheelMaterial = useMemo(() =>
    MaterialPool.getStandardMaterial({
      color: colors.truckWheel,
      roughness: 0.8,
      metalness: 0.3,
      transparent: isDimmed,
      opacity: opacity,
    }),
    [colors.truckWheel, isDimmed, opacity]
  );

  return (
    <group 
      position={[pos.x, 0, pos.z]} 
      rotation={[0, rotationRad, 0]}
      onClick={onSelect}
    >
      {/* Blob shadow */}
      {!useRealShadows && (
        <BlobShadow width={12} depth={30} opacity={isDimmed ? 0.15 : undefined} />
      )}
      
      {/* Truck cab - raised off ground */}
      <mesh
        position={[0, 4.8, -11]}
        geometry={cabGeometry}
        material={cabMaterial}
        castShadow={useRealShadows}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {/* Truck trailer - raised off ground, touching cab */}
      <mesh
        position={[0, 5.8, 4]}
        geometry={trailerGeometry}
        material={trailerMaterial}
        castShadow={useRealShadows}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {/* Wheels - cab (single pair) */}
      <mesh
        position={[-3.55, 1.8, -10]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />
      <mesh
        position={[3.55, 1.8, -10]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />

      {/* Wheels - trailer front */}
      <mesh
        position={[-3.55, 1.8, 2]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />
      <mesh
        position={[3.55, 1.8, 2]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />

      {/* Wheels - trailer rear */}
      <mesh
        position={[-3.55, 1.8, 12]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />
      <mesh
        position={[3.55, 1.8, 12]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={wheelGeometry}
        material={wheelMaterial}
        castShadow={useRealShadows}
      />
    </group>
  );
}

export default function EntityRenderer({ entities }: Props) {
  const selectedEntity = useStore((state) => state.selectedEntity);
  const selectedRack = useStore((state) => state.selectedRack);
  const selectEntity = useStore((state) => state.selectEntity);
  const selectRack = useStore((state) => state.selectRack);
  const visibleEntityTypes = useStore((state) => state.visibleEntityTypes);

  // Filter entities by visible types
  const filteredEntities = entities.filter(entity => 
    visibleEntityTypes.has(entity.entity_type)
  );

  return (
    <group>
      {filteredEntities.map((entity) => {
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
          case 'truck':
            return (
              <TruckMesh
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
