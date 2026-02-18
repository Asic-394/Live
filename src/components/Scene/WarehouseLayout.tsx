import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { WarehouseLayout, WarehouseLayoutElement } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
import { useStore } from '../../state/store';
import { useSceneTheme } from '../../utils/useSceneTheme';
import { getLabelOpacity } from '../../hooks/useLOD';
import OptimizedRackFrame from './OptimizedRackFrame';
import BlobShadow from './BlobShadow';
import RackInventory from './RackInventory';

interface Props {
  layout: WarehouseLayout;
}

interface WallSegment {
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

// Helper function to calculate wall segments with openings
function calculateWallSegments(wall: WarehouseLayoutElement): WallSegment[] {
  const segments: WallSegment[] = [];
  
  // Handle both 'openings' array and single 'gate_opening' object
  let openings = wall.metadata?.openings || [];
  if (wall.metadata?.gate_opening && openings.length === 0) {
    // Convert single gate_opening to openings array
    openings = [wall.metadata.gate_opening];
  }
  
  // Determine if this is a vertical (West/East) or horizontal (North/South) wall
  const isVertical = wall.width < wall.depth; // width=2, depth=120 for vertical walls
  
  if (openings.length === 0) {
    // No openings, return full wall
    segments.push({
      x: wall.x,
      y: wall.y,
      z: wall.z || 0,
      width: wall.width,
      depth: wall.depth,
      height: wall.height || 25,
    });
    return segments;
  }
  
  if (isVertical) {
    // Vertical wall (West/East): openings specified by Y coordinate
    // Sort openings by Y position
    const sortedOpenings = [...openings].sort((a, b) => a.y - b.y);
    
    // Wall spans from (y - depth/2) to (y + depth/2)
    const wallStart = wall.y - wall.depth / 2;
    const wallEnd = wall.y + wall.depth / 2;
    
    let currentY = wallStart;
    
    sortedOpenings.forEach((opening) => {
      const openingStart = opening.y - opening.height / 2;
      const openingEnd = opening.y + opening.height / 2;
      
      // Add segment before opening if there's space
      if (currentY < openingStart) {
        const segmentDepth = openingStart - currentY;
        const segmentCenterY = currentY + segmentDepth / 2;
        segments.push({
          x: wall.x,
          y: segmentCenterY,
          z: wall.z || 0,
          width: wall.width,
          depth: segmentDepth,
          height: wall.height || 25,
        });
      }
      
      currentY = openingEnd;
    });
    
    // Add final segment after last opening
    if (currentY < wallEnd) {
      const segmentDepth = wallEnd - currentY;
      const segmentCenterY = currentY + segmentDepth / 2;
      segments.push({
        x: wall.x,
        y: segmentCenterY,
        z: wall.z || 0,
        width: wall.width,
        depth: segmentDepth,
        height: wall.height || 25,
      });
    }
  } else {
    // Horizontal wall (North/South): openings specified by X coordinate
    const sortedOpenings = [...openings].sort((a, b) => (a.x || 0) - (b.x || 0));
    
    const wallStart = wall.x - wall.width / 2;
    const wallEnd = wall.x + wall.width / 2;
    
    let currentX = wallStart;
    
    sortedOpenings.forEach((opening) => {
      const openingStart = (opening.x || 0) - (opening.width || 15) / 2;
      const openingEnd = (opening.x || 0) + (opening.width || 15) / 2;
      
      if (currentX < openingStart) {
        const segmentWidth = openingStart - currentX;
        const segmentCenterX = currentX + segmentWidth / 2;
        segments.push({
          x: segmentCenterX,
          y: wall.y,
          z: wall.z || 0,
          width: segmentWidth,
          depth: wall.depth,
          height: wall.height || 25,
        });
      }
      
      currentX = openingEnd;
    });
    
    if (currentX < wallEnd) {
      const segmentWidth = wallEnd - currentX;
      const segmentCenterX = currentX + segmentWidth / 2;
      segments.push({
        x: segmentCenterX,
        y: wall.y,
        z: wall.z || 0,
        width: segmentWidth,
        depth: wall.depth,
        height: wall.height || 25,
      });
    }
  }
  
  return segments;
}

/** Rack's hierarchy.parent_id = aisle id; aisle's parent_id = zone id.
 *  Falls back to spatial containment when the hierarchy path is broken
 *  (e.g. racks assigned to a cross-aisle that has no zone parent). */
function getZoneIdForRack(rack: WarehouseLayoutElement, layout: WarehouseLayout): string | null {
  // 1. Try hierarchy path first
  const aisleId = rack.hierarchy?.parent_id;
  if (aisleId) {
    const aisle = layout.aisles.find((a) => a.element_id === aisleId);
    const zoneId = aisle?.hierarchy?.parent_id ?? null;
    if (zoneId) return zoneId;
  }

  // 2. Spatial fallback: find the zone whose bounding box contains the rack centre
  for (const zone of layout.zones) {
    const zoneMinX = zone.x - zone.width / 2;
    const zoneMaxX = zone.x + zone.width / 2;
    const zoneMinY = zone.y - zone.depth / 2;
    const zoneMaxY = zone.y + zone.depth / 2;
    if (
      rack.x >= zoneMinX && rack.x <= zoneMaxX &&
      rack.y >= zoneMinY && rack.y <= zoneMaxY
    ) {
      return zone.element_id;
    }
  }

  // 3. Nearest zone by centre distance as last resort
  let nearestZone: WarehouseLayoutElement | null = null;
  let minDist = Infinity;
  for (const zone of layout.zones) {
    const dx = rack.x - zone.x;
    const dy = rack.y - zone.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearestZone = zone;
    }
  }
  return nearestZone?.element_id ?? null;
}

export default function WarehouseLayoutComponent({ layout }: Props) {
  const [hoveredRack, setHoveredRack] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [cameraDistance, setCameraDistance] = useState<number>(200);
  const selectedZone = useStore((state) => state.selectedZone);
  const selectedRack = useStore((state) => state.selectedRack);
  const selectZone = useStore((state) => state.selectZone);
  const selectRack = useStore((state) => state.selectRack);
  const selectEntity = useStore((state) => state.selectEntity);
  const focusOnZone = useStore((state) => state.focusOnZone);
  const theme = useStore((state) => state.theme);
  const useRealShadows = useStore((state) => state.useRealShadows);
  const themeConfig = useSceneTheme();
  const { camera } = useThree();

  // Track camera distance for LOD
  useFrame(() => {
    const distance = camera.position.length();
    setCameraDistance(distance);
  });

  // Calculate label opacity based on camera distance using LOD system
  const zoneLabelOpacity = getLabelOpacity(cameraDistance, 'zone');
  const aisleLabelOpacity = getLabelOpacity(cameraDistance, 'aisle');
  const rackLabelOpacity = getLabelOpacity(cameraDistance, 'rack');

  return (
    <group>
      {/* Main warehouse floor - base surface for shadows */}
      {layout.bounds && (() => {
        const boundsWidth = layout.bounds.maxX - layout.bounds.minX;
        const boundsDepth = layout.bounds.maxY - layout.bounds.minY;
        const centerX = (layout.bounds.minX + layout.bounds.maxX) / 2;
        const centerZ = -(layout.bounds.minY + layout.bounds.maxY) / 2;
        
        return (
          <mesh 
            position={[centerX, 0, centerZ]} 
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow={useRealShadows}
          >
            <planeGeometry args={[boundsWidth, boundsDepth]} />
            <meshStandardMaterial
              color={themeConfig.colors.floorBase}
              roughness={themeConfig.materials.floor.roughness}
              metalness={themeConfig.materials.floor.metalness}
            />
          </mesh>
        );
      })()}

      {/* Render Zones */}
      {layout.zones.map((zone) => {
        const pos = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
        const zoneName = zone.name || zone.element_id;
        const isReceiving = zoneName.toLowerCase().includes('receiving');
        const isStorage = zoneName.toLowerCase().includes('storage');
        const isPicking = zoneName.toLowerCase().includes('picking');
        const isStaging = zoneName.toLowerCase().includes('staging');
        const isStoragePicking = isStorage && isPicking; // Combined zone
        const isHovered = hoveredZone === zone.element_id;
        const isZoneSelected = selectedZone === zone.element_id;
        
        // Zone-specific colors - theme token driven
        let zoneColor = themeConfig.colors.zoneDefault;
        let outlineColor = themeConfig.colors.zoneDefaultOutline;
        if (isReceiving) {
          zoneColor = themeConfig.colors.zoneReceiving;
          outlineColor = themeConfig.colors.zoneReceivingOutline;
        }
        if (isStoragePicking) {
          zoneColor = themeConfig.colors.zoneStorage;
          outlineColor = themeConfig.colors.zoneStorageOutline;
        }
        else if (isStorage) {
          zoneColor = themeConfig.colors.zoneStorage;
          outlineColor = themeConfig.colors.zoneStorageOutline;
        }
        else if (isPicking) {
          zoneColor = themeConfig.colors.zonePicking;
          outlineColor = themeConfig.colors.zonePickingOutline;
        }
        if (isStaging) {
          zoneColor = themeConfig.colors.zoneStaging;
          outlineColor = themeConfig.colors.zoneStagingOutline;
        }
        
        const handleZoneClick = (e: any) => {
          e.stopPropagation();
          if (isZoneSelected) {
            selectZone(null);
          } else {
            selectZone(zone.element_id);
            focusOnZone(zone.element_id, true);
          }
        };
        const handleZonePointerOver = (e: any) => {
          e.stopPropagation();
          setHoveredZone(zone.element_id);
          document.body.style.cursor = 'pointer';
        };
        const handleZonePointerOut = () => {
          setHoveredZone(null);
          document.body.style.cursor = 'auto';
        };

        return (
          <group key={zone.element_id}>
            {/* Zone outline border - hover/click target */}
            <lineSegments
              position={[pos.x, 0.15, pos.z]}
              onClick={handleZoneClick}
              onPointerOver={handleZonePointerOver}
              onPointerOut={handleZonePointerOut}
            >
              <edgesGeometry
                args={[new THREE.BoxGeometry(zone.width, 0.1, zone.depth)]}
              />
              <lineBasicMaterial 
                color={isZoneSelected ? themeConfig.colors.selectionGlow : outlineColor}
                linewidth={3}
                transparent
                opacity={isZoneSelected ? 0.5 : isHovered ? 1.0 : 0.8}
              />
            </lineSegments>
            
            {/* Zone floor area - main hover/click target and subtle fill */}
            <mesh 
              position={[pos.x, 0.05, pos.z]} 
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={handleZoneClick}
              onPointerOver={handleZonePointerOver}
              onPointerOut={handleZonePointerOut}
            >
              <planeGeometry args={[zone.width, zone.depth]} />
              <meshStandardMaterial
                color={isZoneSelected ? themeConfig.colors.selectionGlow : zoneColor}
                transparent
                opacity={isZoneSelected ? 0.18 : isHovered ? 0.10 : 0.06}
                roughness={0.7}
                emissive={isZoneSelected ? themeConfig.colors.selectionGlow : isHovered ? zoneColor : '#000000'}
                emissiveIntensity={isZoneSelected ? 0.6 : isHovered ? 0.15 : 0}
              />
            </mesh>

            {/* Prominent selection border - only shown when zone is selected */}
            {isZoneSelected && (
              <lineSegments position={[pos.x, 0.3, pos.z]}>
                <edgesGeometry args={[new THREE.BoxGeometry(zone.width, 0.1, zone.depth)]} />
                <lineBasicMaterial
                  color={themeConfig.colors.selectionGlow}
                  linewidth={6}
                  transparent
                  opacity={1.0}
                />
              </lineSegments>
            )}

            {/* Zone label with LOD-based opacity - only render if visible */}
            {(zoneLabelOpacity > 0 || isHovered || isZoneSelected) ? (
              <Text
                position={[pos.x, 0.5, pos.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={4}
                color={themeConfig.colors.zoneLabelColor}
                anchorX="center"
                anchorY="middle"
                fillOpacity={isZoneSelected || isHovered ? 1.0 : zoneLabelOpacity}
              >
                {zone.name || zone.element_id}
              </Text>
            ) : null}

            {/* Receiving Zone: Staging Pallet Markers */}
            {isReceiving ? (
              <>
                {[0, 1, 2].flatMap((row) => 
                  [0, 1, 2, 3].map((col) => {
                    const markerX = pos.x - zone.width / 3 + col * 15;
                    const markerZ = pos.z - zone.depth / 4 + row * 12;
                    return (
                      <lineSegments key={`marker-${row}-${col}`} position={[markerX, 0.15, markerZ]}>
                        <edgesGeometry args={[new THREE.BoxGeometry(4, 0.1, 4)]} />
                        <lineBasicMaterial color={themeConfig.colors.zoneReceivingOutline} linewidth={1} />
                      </lineSegments>
                    );
                  })
                )}
              </>
            ) : null}

            {/* Storage/Picking Zone: Workstation Markers */}
            {(isPicking || isStoragePicking) && !isStaging && !isReceiving ? (
              <>
                {[0, 1, 2, 3, 4].map((i) => {
                  const stationX = pos.x - zone.width / 2.5 + i * (zone.width / 6);
                  return (
                    <group key={`workstation-${i}`}>
                      <mesh position={[stationX, 0.5, pos.z + zone.depth / 3]} castShadow>
                        <boxGeometry args={[3, 1, 3]} />
                      <meshStandardMaterial color={themeConfig.colors.boxBase} roughness={0.7} />
                      </mesh>
                      <Text
                        position={[stationX, 1.5, pos.z + zone.depth / 3]}
                        fontSize={1}
                        color={themeConfig.colors.zoneLabelColor}
                        anchorX="center"
                        anchorY="middle"
                      >
                        {`WS-${i + 1}`}
                      </Text>
                    </group>
                  );
                })}
              </>
            ) : null}

            {/* Staging Zone: Queue Line Markings */}
            {isStaging ? (
              <>
                {[0, 1, 2].map((line) => {
                  const lineZ = pos.z - zone.depth / 4 + line * 15;
                  return (
                    <mesh key={`queue-${line}`} position={[pos.x, 0.12, lineZ]} rotation={[-Math.PI / 2, 0, 0]}>
                      <planeGeometry args={[zone.width - 10, 1]} />
                      <meshStandardMaterial color={themeConfig.colors.zoneStagingOutline} roughness={0.8} />
                    </mesh>
                  );
                })}
                {/* Truck Bay Outline */}
                <lineSegments position={[pos.x + zone.width / 3, 0.15, pos.z]}>
                  <edgesGeometry args={[new THREE.BoxGeometry(20, 0.1, 25)]} />
                  <lineBasicMaterial color={themeConfig.colors.zoneStagingOutline} linewidth={2} />
                </lineSegments>
              </>
            ) : null}
          </group>
        );
      })}

      {/* Render Aisles */}
      {layout.aisles.map((aisle) => {
        const pos = CoordinateMapper.csvToThree(aisle.x, aisle.y, 0);
        const isMainAisle = aisle.metadata?.type === 'main';
        
        return (
          <group key={aisle.element_id}>
            {/* Aisle floor marking */}
            <mesh position={[pos.x, 0.02, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[aisle.width, aisle.depth]} />
              <meshStandardMaterial 
                color={isMainAisle ? themeConfig.colors.aisleMain : themeConfig.colors.floorGrid}
                transparent 
                opacity={0.12} 
                roughness={0.8}
              />
            </mesh>

            {/* Aisle centerline */}
            <mesh position={[pos.x, 0.08, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.3, aisle.depth]} />
              <meshStandardMaterial color={themeConfig.colors.aisleCenterline} roughness={0.7} />
            </mesh>

            {/* Directional arrows */}
            {isMainAisle ? [0, 1, 2, 3, 4].map((i) => {
              const arrowZ = pos.z - aisle.depth / 3 + i * 15;
              return (
                <group key={`arrow-${i}`}>
                  {/* Arrow body */}
                  <mesh position={[pos.x, 0.1, arrowZ]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1, 4]} />
                    <meshStandardMaterial color={themeConfig.colors.aisleArrow} roughness={0.7} />
                  </mesh>
                  {/* Arrow head */}
                  <mesh position={[pos.x, 0.1, arrowZ + 2.5]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
                    <planeGeometry args={[2, 0.5]} />
                    <meshStandardMaterial color={themeConfig.colors.aisleArrow} roughness={0.7} />
                  </mesh>
                  <mesh position={[pos.x, 0.1, arrowZ + 2.5]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
                    <planeGeometry args={[2, 0.5]} />
                    <meshStandardMaterial color={themeConfig.colors.aisleArrow} roughness={0.7} />
                  </mesh>
                </group>
              );
            }) : null}

            {/* Aisle label with LOD-based opacity - only render if visible */}
            {aisleLabelOpacity > 0 ? (
              <Text
                position={[pos.x, 0.3, pos.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={2.5}
                color={themeConfig.colors.aisleLabelColor}
                anchorX="center"
                anchorY="middle"
                fillOpacity={aisleLabelOpacity}
              >
                {aisle.name || aisle.element_id}
              </Text>
            ) : null}
          </group>
        );
      })}

      {/* Render Racks */}
      {layout.racks.map((rack) => {
        const pos = CoordinateMapper.csvToThree(rack.x, rack.y, rack.z || 0);
        const height = rack.height || 18;
        const zoneIdForRack = getZoneIdForRack(rack, layout);
        const isRackInSelectedZone = Boolean(selectedZone && zoneIdForRack === selectedZone);
        const isSelected = selectedRack === rack.element_id;
        const isHovered = hoveredRack === rack.element_id;
        const isDimmed =
          (selectedZone && !isRackInSelectedZone) ||
          Boolean(selectedRack && !isSelected && !isHovered);
        
        // Convert rotation from degrees to radians (rotation around Y-axis)
        const rotationY = ((rack.rotation || 0) * Math.PI) / 180;
        
        // Refined color palette for premium look with dimming
        const baseDimFactor = isDimmed ? 0.4 : 1.0;
        const rackColor = isSelected
          ? themeConfig.colors.rackSelected
          : isHovered
          ? themeConfig.colors.rackHover
          : themeConfig.colors.rackDefault;
        const emissiveColor = isSelected
          ? themeConfig.effects.selection.glowColor
          : isHovered
          ? themeConfig.colors.rackHover
          : '#000000';
        const emissiveIntensity = isSelected
          ? themeConfig.effects.selection.emissiveIntensity * 0.2
          : isHovered
          ? themeConfig.effects.hover.emissiveIntensity * 0.6
          : 0;
        
        return (
          <group 
            key={rack.element_id}
            position={[pos.x, 0, pos.z]}
            rotation={[0, rotationY, 0]}
            onClick={(e) => {
              // Only intercept the click when we're going to act on it.
              // If the rack is already selected, let the event propagate so
              // box clicks (instanced meshes underneath) can be handled.
              if (!isRackInSelectedZone || isSelected) return;
              e.stopPropagation();
              selectRack(rack.element_id);
              selectEntity(null);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredRack(rack.element_id);
              document.body.style.cursor = isRackInSelectedZone ? 'pointer' : 'auto';
            }}
            onPointerOut={() => {
              setHoveredRack(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Invisible clickable volume for easy selection */}
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[rack.width, height, rack.depth]} />
              <meshBasicMaterial visible={false} />
            </mesh>
            
            {/* Blob shadow for grounding */}
            {!useRealShadows && (
              <BlobShadow
                width={rack.width}
                depth={rack.depth}
                position={[0, 0.005, 0]}
                opacity={isDimmed ? themeConfig.shadows.blob.opacity * 0.6 : themeConfig.shadows.blob.opacity}
              />
            )}
            
            {/* Optimized rack frame structure - single merged mesh per rack */}
            <OptimizedRackFrame
              width={rack.width}
              height={height}
              depth={rack.depth}
              color={rackColor}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity * baseDimFactor}
              theme={theme}
              useRealShadows={useRealShadows}
            />

            {/* Inventory boxes on shelves */}
            <RackInventory
              rackId={rack.element_id}
              width={rack.width}
              height={height}
              depth={rack.depth}
              levels={rack.metadata?.levels || 3}
              isDimmed={isDimmed}
              isSelected={isSelected}
              cameraDistance={cameraDistance}
            />

            {/* Prominent outline effect when selected/hovered */}
            {(isSelected || isHovered) ? (
              <lineSegments position={[0, height / 2, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(rack.width, height, rack.depth)]} />
                <lineBasicMaterial 
                  color={isSelected ? themeConfig.colors.selectionGlow : themeConfig.colors.rackHover}
                  linewidth={3}
                  transparent
                  opacity={isSelected ? 1.0 : 0.9}
                />
              </lineSegments>
            ) : null}

            {/* Rack label with dimming and LOD - only render if visible */}
            {rackLabelOpacity > 0 ? (
              <Text
                position={[0, height + 1, 0]}
                fontSize={1.5}
                color={themeConfig.colors.rackLabelColor}
                anchorX="center"
                anchorY="middle"
                fillOpacity={isDimmed ? 0.4 : rackLabelOpacity}
              >
                {rack.name || rack.element_id}
              </Text>
            ) : null}
          </group>
        );
      })}

      {/* Render Docks */}
      {layout.docks.map((dock) => {
        const pos = CoordinateMapper.csvToThree(dock.x, dock.y, 0);
        const doorHeight = dock.height || 12;
        const isReceiving = dock.metadata?.type === 'receiving';
        const doorColor = isReceiving ? themeConfig.colors.dockReceiving : themeConfig.colors.dockShipping;
        const doorEmissive = isReceiving ? themeConfig.colors.dockReceivingOutline : themeConfig.colors.dockShippingOutline;
        
        // Calculate wall opening depth and position
        // Wall-South is at CSV y=0, which is Three.js z=0
        // Dock is at CSV y=5, which is Three.js z=-5
        const wallY = 0; // South wall Y position in CSV coords
        const wallZ = 0; // Wall center in Three.js coords (CoordinateMapper.csvToThree(0, 0, 0).z)
        const wallDepth = 2; // Wall thickness
        const wallHeight = 25;
        const passageDepth = 8; // Depth of the passage extending OUTWARD from the wall
        const truckHeight = 13; // Height for truck clearance
        
        // Position the passage extending outward from inside wall surface
        // Wall center is at wallZ=0, inside surface is at wallZ - wallDepth/2 = -1
        // Passage extends outward (positive Z direction) from inside surface
        const passageCenterZ = wallZ - wallDepth / 2 + passageDepth / 2; // Extends outward from inside wall
        
        return (
          <group key={dock.element_id}>
            {/* Wall Opening - create a visible tunnel/passage through the wall extending outward */}
            {/* Opening sides - left wall */}
            <mesh position={[pos.x - dock.width / 2 - 0.6, truckHeight / 2, passageCenterZ]} castShadow receiveShadow>
              <boxGeometry args={[1.2, truckHeight, passageDepth]} />
              <meshStandardMaterial 
                color={themeConfig.colors.wallMain} 
                roughness={themeConfig.materials.wall.roughness}
                metalness={themeConfig.materials.wall.metalness}
              />
            </mesh>
            
            {/* Opening sides - right wall */}
            <mesh position={[pos.x + dock.width / 2 + 0.6, truckHeight / 2, passageCenterZ]} castShadow receiveShadow>
              <boxGeometry args={[1.2, truckHeight, passageDepth]} />
              <meshStandardMaterial 
                color={themeConfig.colors.wallMain}
                roughness={themeConfig.materials.wall.roughness}
                metalness={themeConfig.materials.wall.metalness}
              />
            </mesh>
            
            {/* Wall section above opening - flush with inside wall, extends outward */}
            <mesh position={[pos.x, truckHeight + (wallHeight - truckHeight) / 2, passageCenterZ]} castShadow receiveShadow>
              <boxGeometry args={[dock.width + 2.4, wallHeight - truckHeight, passageDepth]} />
              <meshStandardMaterial 
                color={themeConfig.colors.wallMain}
                roughness={themeConfig.materials.wall.roughness}
                metalness={themeConfig.materials.wall.metalness}
              />
            </mesh>
            
            {/* Inner passage floor - slightly darker to show depth */}
            <mesh position={[pos.x, 0.05, passageCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[dock.width, passageDepth]} />
              <meshStandardMaterial 
                color={themeConfig.colors.floorBase}
                roughness={0.9}
              />
            </mesh>
            
            {/* Loading Bay Platform (elevated in front of door) */}
            <mesh position={[pos.x, 0.75, pos.z]} castShadow receiveShadow={useRealShadows}>
              <boxGeometry args={[dock.width + 4, 1.5, dock.depth + 4]} />
              <meshStandardMaterial color={themeConfig.colors.dockPlatform} roughness={0.8} />
            </mesh>

            {/* Dock Door Frame - Left Post (at inside wall surface) */}
            <mesh position={[pos.x - dock.width / 2, truckHeight / 2, wallZ - wallDepth / 2]} castShadow>
              <boxGeometry args={[0.8, truckHeight, 0.5]} />
              <meshStandardMaterial color={themeConfig.colors.dockFrame} roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Dock Door Frame - Right Post (at inside wall surface) */}
            <mesh position={[pos.x + dock.width / 2, truckHeight / 2, wallZ - wallDepth / 2]} castShadow>
              <boxGeometry args={[0.8, truckHeight, 0.5]} />
              <meshStandardMaterial color={themeConfig.colors.dockFrame} roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Dock Door Frame - Top Lintel (at inside wall surface) */}
            <mesh position={[pos.x, truckHeight, wallZ - wallDepth / 2]} castShadow>
              <boxGeometry args={[dock.width + 1.6, 0.8, 0.5]} />
              <meshStandardMaterial color={themeConfig.colors.dockFrame} roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Door opening - no shutter, remains open */}

            {/* Safety Stripes on Platform (yellow/black) */}
            <mesh position={[pos.x - dock.width / 2 - 2, 1.51, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, dock.depth + 4]} />
              <meshStandardMaterial color={themeConfig.colors.safetyYellow} roughness={0.7} />
            </mesh>
            <mesh position={[pos.x + dock.width / 2 + 2, 1.51, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, dock.depth + 4]} />
              <meshStandardMaterial color={themeConfig.colors.safetyYellow} roughness={0.7} />
            </mesh>
            
            {/* Parking lines outside dock door (yard style) */}
            <group>
              {/* Left parking boundary line */}
              <mesh position={[pos.x - dock.width / 2, 0.06, wallZ + passageDepth + 10]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, 20]} />
                <meshBasicMaterial 
                  color={themeConfig.colors.parkingBay}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              
              {/* Right parking boundary line */}
              <mesh position={[pos.x + dock.width / 2, 0.06, wallZ + passageDepth + 10]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, 20]} />
                <meshBasicMaterial 
                  color={themeConfig.colors.parkingBay}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            </group>
            
            {/* Floor safety markings extending from dock */}
            <group>
              {/* Approach zone markings */}
              <mesh position={[pos.x, 0.02, pos.z + dock.depth / 2 + 8]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[dock.width + 8, 0.4]} />
                <meshStandardMaterial 
                  color={themeConfig.colors.safetyYellow} 
                  roughness={0.8}
                  transparent
                  opacity={0.7}
                />
              </mesh>
              <mesh position={[pos.x, 0.02, pos.z + dock.depth / 2 + 12]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[dock.width + 8, 0.4]} />
                <meshStandardMaterial 
                  color={themeConfig.colors.safetyYellow} 
                  roughness={0.8}
                  transparent
                  opacity={0.5}
                />
              </mesh>
              
              {/* Side warning lines */}
              <mesh position={[pos.x - dock.width / 2 - 4, 0.02, pos.z + 6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 16]} />
                <meshStandardMaterial 
                  color={themeConfig.colors.floorGrid} 
                  roughness={0.8}
                  transparent
                  opacity={0.6}
                />
              </mesh>
              <mesh position={[pos.x + dock.width / 2 + 4, 0.02, pos.z + 6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 16]} />
                <meshStandardMaterial 
                  color={themeConfig.colors.floorGrid} 
                  roughness={0.8}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>

            {/* Dock signage on wall above door - INSIDE (facing warehouse interior) */}
            <group>
              {/* Signage background panel - inside (attached to wall) */}
              <mesh position={[pos.x, truckHeight + 2.5, wallZ - wallDepth / 2 - 0.2]} castShadow>
                <boxGeometry args={[dock.width - 1, 3, 0.4]} />
                <meshStandardMaterial 
                  color={isReceiving ? '#1e3a28' : '#3a281e'}
                  emissive={isReceiving ? '#4ade80' : '#fb923c'}
                  emissiveIntensity={0.5}
                  roughness={0.3}
                  metalness={0.5}
                />
              </mesh>
              
              {/* Bay number - inside (rotated to face warehouse interior) */}
              <Text
                position={[pos.x, truckHeight + 3.2, wallZ - wallDepth / 2 - 0.45]}
                fontSize={2.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.15}
                outlineColor="#000000"
                rotation={[0, Math.PI, 0]}
              >
                {dock.element_id.replace('Dock-', 'BAY ')}
              </Text>
              
              {/* Dock type label - inside (rotated to face warehouse interior) */}
              <Text
                position={[pos.x, truckHeight + 1.8, wallZ - wallDepth / 2 - 0.45]}
                fontSize={1.4}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.1}
                outlineColor="#000000"
                rotation={[0, Math.PI, 0]}
              >
                {isReceiving ? 'RECEIVING' : 'SHIPPING'}
              </Text>
            </group>

            {/* Dock signage on wall above door - OUTSIDE (facing yard) */}
            <group>
              {/* Signage background panel - outside (attached to outer wall surface) */}
              <mesh position={[pos.x, truckHeight + 2.5, passageCenterZ + passageDepth / 2 + 0.2]} castShadow>
                <boxGeometry args={[dock.width - 1, 3, 0.4]} />
                <meshStandardMaterial 
                  color={isReceiving ? '#1e3a28' : '#3a281e'}
                  emissive={isReceiving ? '#4ade80' : '#fb923c'}
                  emissiveIntensity={0.5}
                  roughness={0.3}
                  metalness={0.5}
                />
              </mesh>
              
              {/* Bay number - outside */}
              <Text
                position={[pos.x, truckHeight + 3.2, passageCenterZ + passageDepth / 2 + 0.45]}
                fontSize={2.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.15}
                outlineColor="#000000"
              >
                {dock.element_id.replace('Dock-', 'BAY ')}
              </Text>
              
              {/* Dock type label - outside */}
              <Text
                position={[pos.x, truckHeight + 1.8, passageCenterZ + passageDepth / 2 + 0.45]}
                fontSize={1.4}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.1}
                outlineColor="#000000"
              >
                {isReceiving ? 'RECEIVING' : 'SHIPPING'}
              </Text>
            </group>
          </group>
        );
      })}

      {/* Interior curb/edge - subtle perimeter line */}
      {layout.bounds && (() => {
        const boundsWidth = layout.bounds.maxX - layout.bounds.minX;
        const boundsDepth = layout.bounds.maxY - layout.bounds.minY;
        return (
          <lineSegments position={[
            (layout.bounds.minX + layout.bounds.maxX) / 2,
            0.05,
            -(layout.bounds.minY + layout.bounds.maxY) / 2
          ]}>
            <edgesGeometry
              args={[new THREE.BoxGeometry(
                boundsWidth - 4,
                0.1,
                boundsDepth - 4
              )]}
            />
            <lineBasicMaterial 
              color={themeConfig.colors.floorGrid}
              linewidth={2}
              transparent
              opacity={0.6}
            />
          </lineSegments>
        );
      })()}

      {/* Render Walls */}
      {layout.walls?.map((wall) => {
        const segments = calculateWallSegments(wall);
        return (
          <group key={wall.element_id}>
            {segments.map((segment, i) => {
              const pos = CoordinateMapper.csvToThree(segment.x, segment.y, segment.z);
              return (
                <group key={`${wall.element_id}-segment-${i}`}>
                  {/* Wall main structure - darker, more matte */}
                  <mesh
                    position={[pos.x, segment.height / 2, pos.z]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[segment.width, segment.height, segment.depth]} />
                    <meshStandardMaterial
                      color={themeConfig.colors.wallMain}
                      roughness={themeConfig.materials.wall.roughness}
                      metalness={themeConfig.materials.wall.metalness}
                    />
                  </mesh>
                  
                  {/* Base trim - darker accent at bottom */}
                  <mesh
                    position={[pos.x, 0.4, pos.z]}
                    receiveShadow
                  >
                    <boxGeometry args={[segment.width, 0.8, segment.depth]} />
                    <meshStandardMaterial
                      color={themeConfig.colors.wallTrim}
                      roughness={themeConfig.materials.wall.roughness}
                      metalness={themeConfig.materials.wall.metalness}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}

      {/* Render Yards */}
      {layout.yards?.map((yard) => {
        const pos = CoordinateMapper.csvToThree(yard.x, yard.y, 0);
        
        return (
          <group key={yard.element_id}>
            {/* Yard surface */}
            <mesh position={[pos.x, 0.005, pos.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[yard.width, yard.depth]} />
              <meshStandardMaterial
                color={themeConfig.colors.yardSurface}
                roughness={0.85}
                metalness={0.05}
              />
            </mesh>
            
            {/* Yard grid lines for texture */}
            <lineSegments position={[pos.x, 0.015, pos.z]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(yard.width, yard.depth, 16, 16)]} />
              <lineBasicMaterial
                color={themeConfig.colors.yardGrid}
                transparent
                opacity={0.15}
              />
            </lineSegments>
          </group>
        );
      })}

      {/* Render Parking Spaces */}
      {layout.parkings?.map((parking, index) => {
        const pos = CoordinateMapper.csvToThree(parking.x, parking.y, 0);
        const bayNumber = parking.metadata?.bay_number;
        const isIndividualBay = bayNumber !== undefined;
        
        // Check for adjacent parking spaces
        const prevParking = index > 0 ? layout.parkings?.[index - 1] : null;
        const hasPrevAdjacent = prevParking && 
          Math.abs(prevParking.x - parking.x) <= (parking.width + 10) &&
          prevParking.y === parking.y &&
          prevParking.metadata?.bay_number !== undefined;
        
        const nextParking = layout.parkings?.[index + 1];
        const hasNextAdjacent = nextParking && 
          Math.abs(nextParking.x - parking.x) <= (parking.width + 10) &&
          nextParking.y === parking.y &&
          nextParking.metadata?.bay_number !== undefined;
        
        return (
          <group key={parking.element_id}>
            {/* Left boundary line - only for first parking in a row */}
            {isIndividualBay && !hasPrevAdjacent && (
              <mesh 
                position={[pos.x - parking.width / 2, 0.04, pos.z]} 
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.5, parking.depth]} />
                <meshBasicMaterial
                  color={themeConfig.colors.parkingBay}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            )}
            
            {/* Right line - division between spaces or end boundary */}
            {isIndividualBay && (
              <mesh 
                position={[pos.x + parking.width / 2, 0.04, pos.z]} 
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.5, parking.depth]} />
                <meshBasicMaterial
                  color={themeConfig.colors.parkingBay}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            )}
            
            {/* Bay number label */}
            {isIndividualBay && (
              <Text
                position={[pos.x, 0.06, pos.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={2.5}
                color={themeConfig.colors.parkingNumber}
                anchorX="center"
                anchorY="middle"
              >
                P{bayNumber}
              </Text>
            )}
          </group>
        );
      })}

      {/* Render Gates */}
      {layout.gates?.map((gate) => {
        const pos = CoordinateMapper.csvToThree(gate.x, gate.y, 0);
        const gateHeight = gate.height || 12;
        const status = gate.metadata?.status || 'closed';
        const isOpen = status === 'open';
        const lanes = gate.metadata?.lanes || 1;
        const laneWidth = (gate.width - 6) / 2; // Subtract cabin width, divide by 2
        
        return (
          <group key={gate.element_id} position={[pos.x, 0, pos.z]}>
            {/* Gate foundation/base */}
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[gate.width + 4, 1, gate.depth + 2]} />
              <meshStandardMaterial
                color={themeConfig.colors.gateFrame}
                roughness={0.8}
                metalness={0.3}
              />
            </mesh>
            
            {/* Security cabin (center) */}
            <mesh position={[0, 4, 0]} castShadow>
              <boxGeometry args={[6, 8, gate.depth]} />
              <meshStandardMaterial
                color={themeConfig.colors.gateCabin}
                roughness={0.6}
                metalness={0.2}
              />
            </mesh>
            
            {/* Cabin roof */}
            <mesh position={[0, 8.5, 0]} castShadow>
              <boxGeometry args={[7, 1, gate.depth + 1]} />
              <meshStandardMaterial
                color={themeConfig.colors.gateFrame}
                roughness={0.7}
                metalness={0.4}
              />
            </mesh>
            
            {/* Entry Lane (left side) */}
            <group position={[-gate.width / 2 + laneWidth / 2 + 2, 0, 0]}>
              {/* Entry post */}
              <mesh position={[0, 3.5, 0]} castShadow>
                <cylinderGeometry args={[0.6, 0.6, 7]} />
                <meshStandardMaterial
                  color={themeConfig.colors.gatePost}
                  roughness={0.6}
                  metalness={0.5}
                />
              </mesh>
              {/* Post cap */}
              <mesh position={[0, 7, 0]} castShadow>
                <sphereGeometry args={[0.7]} />
                <meshStandardMaterial
                  color={themeConfig.colors.gatePost}
                  roughness={0.5}
                  metalness={0.6}
                />
              </mesh>
              
              {/* Entry boom barrier */}
              <group position={[0, 7, 0]} rotation={[0, 0, isOpen ? -Math.PI / 2 : 0]}>
                <mesh position={[laneWidth / 2, 0, 0]} castShadow>
                  <boxGeometry args={[laneWidth, 0.5, 0.5]} />
                  <meshStandardMaterial
                    color={themeConfig.colors.gateBarrier}
                    roughness={0.5}
                    metalness={0.3}
                  />
                </mesh>
                {/* Red/white stripes on barrier */}
                {[...Array(Math.floor(laneWidth / 3))].map((_, i) => (
                  <mesh key={i} position={[i * 3 - laneWidth / 2 + 1.5, 0, 0]}>
                    <boxGeometry args={[1.5, 0.51, 0.51]} />
                    <meshStandardMaterial
                      color={i % 2 === 0 ? '#ffffff' : '#ff0000'}
                      roughness={0.4}
                      metalness={0.2}
                    />
                  </mesh>
                ))}
              </group>
              
              {/* Entry status light */}
              <mesh position={[0, 8, -gate.depth / 2 - 0.5]}>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial
                  color={isOpen ? themeConfig.colors.gateLightGreen : themeConfig.colors.gateLightRed}
                  emissive={isOpen ? themeConfig.colors.gateLightGreen : themeConfig.colors.gateLightRed}
                  emissiveIntensity={0.8}
                />
              </mesh>
              
              {/* Entry sign */}
              <Text
                position={[0, 5, -gate.depth / 2 - 0.5]}
                fontSize={1.2}
                color={themeConfig.colors.gateText}
                anchorX="center"
                anchorY="middle"
              >
                ENTRY
              </Text>
            </group>
            
            {/* Exit Lane (right side) */}
            <group position={[gate.width / 2 - laneWidth / 2 - 2, 0, 0]}>
              {/* Exit post */}
              <mesh position={[0, 3.5, 0]} castShadow>
                <cylinderGeometry args={[0.6, 0.6, 7]} />
                <meshStandardMaterial
                  color={themeConfig.colors.gatePost}
                  roughness={0.6}
                  metalness={0.5}
                />
              </mesh>
              {/* Post cap */}
              <mesh position={[0, 7, 0]} castShadow>
                <sphereGeometry args={[0.7]} />
                <meshStandardMaterial
                  color={themeConfig.colors.gatePost}
                  roughness={0.5}
                  metalness={0.6}
                />
              </mesh>
              
              {/* Exit boom barrier */}
              <group position={[0, 7, 0]} rotation={[0, 0, isOpen ? Math.PI / 2 : 0]}>
                <mesh position={[-laneWidth / 2, 0, 0]} castShadow>
                  <boxGeometry args={[laneWidth, 0.5, 0.5]} />
                  <meshStandardMaterial
                    color={themeConfig.colors.gateBarrier}
                    roughness={0.5}
                    metalness={0.3}
                  />
                </mesh>
                {/* Red/white stripes on barrier */}
                {[...Array(Math.floor(laneWidth / 3))].map((_, i) => (
                  <mesh key={i} position={[-i * 3 + laneWidth / 2 - 1.5, 0, 0]}>
                    <boxGeometry args={[1.5, 0.51, 0.51]} />
                    <meshStandardMaterial
                      color={i % 2 === 0 ? '#ffffff' : '#ff0000'}
                      roughness={0.4}
                      metalness={0.2}
                    />
                  </mesh>
                ))}
              </group>
              
              {/* Exit status light */}
              <mesh position={[0, 8, -gate.depth / 2 - 0.5]}>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial
                  color={isOpen ? themeConfig.colors.gateLightGreen : themeConfig.colors.gateLightRed}
                  emissive={isOpen ? themeConfig.colors.gateLightGreen : themeConfig.colors.gateLightRed}
                  emissiveIntensity={0.8}
                />
              </mesh>
              
              {/* Exit sign */}
              <Text
                position={[0, 5, -gate.depth / 2 - 0.5]}
                fontSize={1.2}
                color={themeConfig.colors.gateText}
                anchorX="center"
                anchorY="middle"
              >
                EXIT
              </Text>
            </group>
            
            {/* Main gate sign */}
            <Text
              position={[0, 9.5, -gate.depth / 2 - 0.5]}
              fontSize={1.8}
              color={themeConfig.colors.gateText}
              anchorX="center"
              anchorY="middle"
            >
              SECURITY
            </Text>
          </group>
        );
      })}

    </group>
  );
}
