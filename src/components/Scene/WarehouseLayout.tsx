import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { WarehouseLayout, WarehouseLayoutElement } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
import { useStore } from '../../state/store';
import RackFrame from './RackFrame';
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
  const openings = wall.metadata?.openings || [];
  
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

export default function WarehouseLayoutComponent({ layout }: Props) {
  const [hoveredRack, setHoveredRack] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [cameraDistance, setCameraDistance] = useState<number>(200);
  const selectedRack = useStore((state) => state.selectedRack);
  const selectRack = useStore((state) => state.selectRack);
  const selectEntity = useStore((state) => state.selectEntity);
  const { camera } = useThree();

  // Track camera distance for LOD
  useFrame(() => {
    const distance = camera.position.length();
    setCameraDistance(distance);
  });

  // Calculate label opacity based on camera distance
  const getZoneLabelOpacity = () => {
    // Show zone labels when zoomed out (distance > 150), fade out when closer
    if (cameraDistance > 200) return 0.8;
    if (cameraDistance > 150) return 0.6;
    if (cameraDistance > 100) return Math.max(0, (cameraDistance - 100) / 50 * 0.6);
    return 0;
  };

  const getAisleLabelOpacity = () => {
    // Keep aisle labels visible in mid-range, fade when too far or too close
    if (cameraDistance > 300) return 0.3;
    if (cameraDistance > 200) return 0.5;
    if (cameraDistance > 80) return 0.7;
    if (cameraDistance > 40) return Math.max(0, (cameraDistance - 40) / 40 * 0.7);
    return 0;
  };

  return (
    <group>
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
        
        // Zone-specific colors - more saturated for outlines
        let zoneColor = '#2d4a5c';
        let outlineColor = '#4a7a9c';
        if (isReceiving) {
          zoneColor = '#3d5a4a';
          outlineColor = '#5a8a6a';
        }
        if (isStoragePicking) {
          zoneColor = '#4a4a5c';
          outlineColor = '#6a6a8c';
        }
        else if (isStorage) {
          zoneColor = '#4a4a5c';
          outlineColor = '#6a6a8c';
        }
        else if (isPicking) {
          zoneColor = '#5c4a3d';
          outlineColor = '#8c6a5d';
        }
        if (isStaging) {
          zoneColor = '#4a5a3d';
          outlineColor = '#6a8a5d';
        }
        
        return (
          <group key={zone.element_id}>
            {/* Thin zone outline border (primary) */}
            <lineSegments 
              position={[pos.x, 0.15, pos.z]}
              onPointerOver={() => setHoveredZone(zone.element_id)}
              onPointerOut={() => setHoveredZone(null)}
            >
              <edgesGeometry
                args={[new THREE.BoxGeometry(zone.width, 0.1, zone.depth)]}
              />
              <lineBasicMaterial 
                color={outlineColor}
                linewidth={3}
                transparent
                opacity={isHovered ? 1.0 : 0.8}
              />
            </lineSegments>
            
            {/* Zone floor area - subtle 6% fill */}
            <mesh 
              position={[pos.x, 0.05, pos.z]} 
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[zone.width, zone.depth]} />
              <meshStandardMaterial
                color={zoneColor}
                transparent
                opacity={0.06}
                roughness={0.7}
                emissive={isHovered ? zoneColor : '#000000'}
                emissiveIntensity={isHovered ? 0.15 : 0}
              />
            </mesh>

            {/* Zone label with LOD-based opacity */}
            <Text
              position={[pos.x, 0.5, pos.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={4}
              color="#7a8a9a"
              anchorX="center"
              anchorY="middle"
              fillOpacity={isHovered ? 1.0 : getZoneLabelOpacity()}
            >
              {zone.name || zone.element_id}
            </Text>

            {/* Receiving Zone: Staging Pallet Markers */}
            {isReceiving && (
              <>
                {[0, 1, 2].map((row) => 
                  [0, 1, 2, 3].map((col) => {
                    const markerX = pos.x - zone.width / 3 + col * 15;
                    const markerZ = pos.z - zone.depth / 4 + row * 12;
                    return (
                      <lineSegments key={`marker-${row}-${col}`} position={[markerX, 0.15, markerZ]}>
                        <edgesGeometry args={[new THREE.BoxGeometry(4, 0.1, 4)]} />
                        <lineBasicMaterial color="#6a8a6a" linewidth={1} />
                      </lineSegments>
                    );
                  })
                )}
              </>
            )}

            {/* Storage/Picking Zone: Workstation Markers */}
            {(isPicking || isStoragePicking) && !isStaging && !isReceiving && (
              <>
                {[0, 1, 2, 3, 4].map((i) => {
                  const stationX = pos.x - zone.width / 2.5 + i * (zone.width / 6);
                  return (
                    <group key={`workstation-${i}`}>
                      <mesh position={[stationX, 0.5, pos.z + zone.depth / 3]} castShadow>
                        <boxGeometry args={[3, 1, 3]} />
                        <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
                      </mesh>
                      <Text
                        position={[stationX, 1.5, pos.z + zone.depth / 3]}
                        fontSize={1}
                        color="#9a8a7a"
                        anchorX="center"
                        anchorY="middle"
                      >
                        {`WS-${i + 1}`}
                      </Text>
                    </group>
                  );
                })}
              </>
            )}

            {/* Staging Zone: Queue Line Markings */}
            {isStaging && (
              <>
                {[0, 1, 2].map((line) => {
                  const lineZ = pos.z - zone.depth / 4 + line * 15;
                  return (
                    <mesh key={`queue-${line}`} position={[pos.x, 0.12, lineZ]} rotation={[-Math.PI / 2, 0, 0]}>
                      <planeGeometry args={[zone.width - 10, 1]} />
                      <meshStandardMaterial color="#8a9a6a" roughness={0.8} />
                    </mesh>
                  );
                })}
                {/* Truck Bay Outline */}
                <lineSegments position={[pos.x + zone.width / 3, 0.15, pos.z]}>
                  <edgesGeometry args={[new THREE.BoxGeometry(20, 0.1, 25)]} />
                  <lineBasicMaterial color="#8a9a5a" linewidth={2} />
                </lineSegments>
              </>
            )}
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
                color={isMainAisle ? '#3a3e42' : '#35393f'}
                transparent 
                opacity={0.12} 
                roughness={0.8}
              />
            </mesh>

            {/* Aisle centerline */}
            <mesh position={[pos.x, 0.08, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.3, aisle.depth]} />
              <meshStandardMaterial color="#5a5e65" roughness={0.7} />
            </mesh>

            {/* Directional arrows */}
            {isMainAisle && [0, 1, 2, 3, 4].map((i) => {
              const arrowZ = pos.z - aisle.depth / 3 + i * 15;
              return (
                <group key={`arrow-${i}`}>
                  {/* Arrow body */}
                  <mesh position={[pos.x, 0.1, arrowZ]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1, 4]} />
                    <meshStandardMaterial color="#6a6e75" roughness={0.7} />
                  </mesh>
                  {/* Arrow head */}
                  <mesh position={[pos.x, 0.1, arrowZ + 2.5]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
                    <planeGeometry args={[2, 0.5]} />
                    <meshStandardMaterial color="#6a6e75" roughness={0.7} />
                  </mesh>
                  <mesh position={[pos.x, 0.1, arrowZ + 2.5]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
                    <planeGeometry args={[2, 0.5]} />
                    <meshStandardMaterial color="#6a6e75" roughness={0.7} />
                  </mesh>
                </group>
              );
            })}

            {/* Aisle label with LOD-based opacity */}
            <Text
              position={[pos.x, 0.3, pos.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={2.5}
              color="#7a7e84"
              anchorX="center"
              anchorY="middle"
              fillOpacity={getAisleLabelOpacity()}
            >
              {aisle.name || aisle.element_id}
            </Text>
          </group>
        );
      })}

      {/* Render Racks */}
      {layout.racks.map((rack) => {
        const pos = CoordinateMapper.csvToThree(rack.x, rack.y, rack.z || 0);
        const height = rack.height || 18;
        const isSelected = selectedRack === rack.element_id;
        const isHovered = hoveredRack === rack.element_id;
        const isDimmed = Boolean(selectedRack && !isSelected && !isHovered);
        
        // Refined color palette for premium look with dimming
        const baseDimFactor = isDimmed ? 0.4 : 1.0;
        const rackColor = isSelected ? "#00D9FF" : isHovered ? "#9a9ea5" : "#6a6e75";
        const emissiveColor = isSelected ? "#00D9FF" : isHovered ? "#ffffff" : "#000000";
        const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.15 : 0;
        
        return (
          <group 
            key={rack.element_id}
            position={[pos.x, 0, pos.z]}
            onClick={(e) => {
              e.stopPropagation();
              selectRack(isSelected ? null : rack.element_id);
              selectEntity(null); // Clear entity selection when rack is clicked
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredRack(rack.element_id);
              document.body.style.cursor = 'pointer';
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
            <BlobShadow
              width={rack.width}
              depth={rack.depth}
              position={[0, 0.005, 0]}
              opacity={isDimmed ? 0.2 : 0.35}
            />
            
            {/* Rack frame structure - dimming applied via material properties */}
            <RackFrame
              width={rack.width}
              height={height}
              depth={rack.depth}
              color={rackColor}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity * baseDimFactor}
            />

            {/* Inventory boxes on shelves */}
            <RackInventory
              width={rack.width}
              height={height}
              depth={rack.depth}
              levels={rack.metadata?.levels || 7}
              isDimmed={isDimmed}
              cameraDistance={cameraDistance}
            />

            {/* Prominent outline effect when selected/hovered */}
            {(isSelected || isHovered) && (
              <lineSegments position={[0, height / 2, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(rack.width, height, rack.depth)]} />
                <lineBasicMaterial 
                  color={isSelected ? "#00D9FF" : "#ffffff"}
                  linewidth={3}
                  transparent
                  opacity={isSelected ? 1.0 : 0.9}
                />
              </lineSegments>
            )}

            {/* Rack label with dimming */}
            <Text
              position={[0, height + 1, 0]}
              fontSize={1.5}
              color="#c8ced4"
              anchorX="center"
              anchorY="middle"
              fillOpacity={isDimmed ? 0.4 : 1.0}
            >
              {rack.name || rack.element_id}
            </Text>
          </group>
        );
      })}

      {/* Render Docks */}
      {layout.docks.map((dock) => {
        const pos = CoordinateMapper.csvToThree(dock.x, dock.y, 0);
        const doorHeight = dock.height || 12;
        const isReceiving = dock.metadata?.type === 'receiving';
        const doorColor = isReceiving ? '#3d7a5e' : '#5a7a3d';
        
        return (
          <group key={dock.element_id}>
            {/* Loading Bay Platform (elevated in front of door) */}
            <mesh position={[pos.x, 0.75, pos.z]} castShadow receiveShadow>
              <boxGeometry args={[dock.width + 4, 1.5, dock.depth + 4]} />
              <meshStandardMaterial color="#4a4d52" roughness={0.8} />
            </mesh>

            {/* Dock Door Frame - Left Post */}
            <mesh position={[pos.x - dock.width / 2, doorHeight / 2, pos.z]} castShadow>
              <boxGeometry args={[0.8, doorHeight, 1]} />
              <meshStandardMaterial color="#2d2f33" roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Dock Door Frame - Right Post */}
            <mesh position={[pos.x + dock.width / 2, doorHeight / 2, pos.z]} castShadow>
              <boxGeometry args={[0.8, doorHeight, 1]} />
              <meshStandardMaterial color="#2d2f33" roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Dock Door Frame - Top Lintel */}
            <mesh position={[pos.x, doorHeight, pos.z]} castShadow>
              <boxGeometry args={[dock.width + 1.6, 1.2, 1]} />
              <meshStandardMaterial color="#2d2f33" roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Dock Door (roll-up style) with subtle glow */}
            <mesh position={[pos.x, doorHeight / 2, pos.z]}>
              <boxGeometry args={[dock.width, doorHeight, 0.3]} />
              <meshStandardMaterial 
                color={doorColor} 
                roughness={0.6} 
                metalness={0.4}
                emissive="#1a3d2e"
                emissiveIntensity={0.1}
              />
            </mesh>
            
            {/* Colored outline around door frame */}
            <lineSegments position={[pos.x, doorHeight / 2, pos.z + 0.2]}>
              <edgesGeometry args={[new THREE.BoxGeometry(dock.width, doorHeight, 0.1)]} />
              <lineBasicMaterial 
                color={isReceiving ? "#4a9a7a" : "#7a9a4a"}
                linewidth={2}
                transparent
                opacity={0.8}
              />
            </lineSegments>

            {/* Safety Stripes on Platform (yellow/black) */}
            <mesh position={[pos.x - dock.width / 2 - 2, 1.51, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, dock.depth + 4]} />
              <meshStandardMaterial color="#f4d03f" roughness={0.7} />
            </mesh>
            <mesh position={[pos.x + dock.width / 2 + 2, 1.51, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, dock.depth + 4]} />
              <meshStandardMaterial color="#f4d03f" roughness={0.7} />
            </mesh>
            
            {/* Floor safety markings extending from dock */}
            <group>
              {/* Approach zone markings */}
              <mesh position={[pos.x, 0.02, pos.z + dock.depth / 2 + 8]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[dock.width + 8, 0.4]} />
                <meshStandardMaterial 
                  color="#f4d03f" 
                  roughness={0.8}
                  transparent
                  opacity={0.7}
                />
              </mesh>
              <mesh position={[pos.x, 0.02, pos.z + dock.depth / 2 + 12]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[dock.width + 8, 0.4]} />
                <meshStandardMaterial 
                  color="#f4d03f" 
                  roughness={0.8}
                  transparent
                  opacity={0.5}
                />
              </mesh>
              
              {/* Side warning lines */}
              <mesh position={[pos.x - dock.width / 2 - 4, 0.02, pos.z + 6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 16]} />
                <meshStandardMaterial 
                  color="#e8e8e8" 
                  roughness={0.8}
                  transparent
                  opacity={0.6}
                />
              </mesh>
              <mesh position={[pos.x + dock.width / 2 + 4, 0.02, pos.z + 6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.3, 16]} />
                <meshStandardMaterial 
                  color="#e8e8e8" 
                  roughness={0.8}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>

            {/* Bay Number Sign with subtle backlight */}
            <mesh position={[pos.x, doorHeight + 2, pos.z - 1]} castShadow>
              <boxGeometry args={[3, 2, 0.3]} />
              <meshStandardMaterial 
                color="#2a3a4a"
                emissive="#1a2a3a"
                emissiveIntensity={0.15}
              />
            </mesh>
            <Text
              position={[pos.x, doorHeight + 2, pos.z - 0.85]}
              fontSize={1.5}
              color="#f4d03f"
              anchorX="center"
              anchorY="middle"
            >
              {dock.element_id.replace('Dock-', 'Bay ')}
            </Text>

            {/* Dock Type Label */}
            <Text
              position={[pos.x, 0.2, pos.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={1.5}
              color={isReceiving ? '#5a9a7a' : '#8a9a5a'}
              anchorX="center"
              anchorY="middle"
            >
              {isReceiving ? 'RECEIVING' : 'SHIPPING'}
            </Text>
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
              color="#2a2c30"
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
                      color="#6a6c70"
                      roughness={0.95}
                      metalness={0.1}
                    />
                  </mesh>
                  
                  {/* Base trim - darker accent at bottom */}
                  <mesh
                    position={[pos.x, 0.4, pos.z]}
                    receiveShadow
                  >
                    <boxGeometry args={[segment.width, 0.8, segment.depth]} />
                    <meshStandardMaterial
                      color="#0d0f12"
                      roughness={0.9}
                      metalness={0.15}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}

    </group>
  );
}
