import { useEffect, useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { getThemeConfig } from '../../utils/materials';
import { RackSlots } from '../../utils/RackSlots';
import { CoordinateMapper } from '../../utils/coordinates';
import { GeometryPool } from '../../utils/GeometryPool';
import { MaterialPool } from '../../utils/MaterialPool';
import type { Box } from '../../types';

/**
 * High-performance instanced rendering for inventory boxes
 * Groups boxes by status and renders using InstancedMesh
 * Reduces draw calls from ~6000 to ~4
 */
export default function InstancedInventoryBoxes() {
  const boxes = useStore((state) => state.boxes);
  const selectedBox = useStore((state) => state.selectedBox);
  const selectBox = useStore((state) => state.selectBox);
  const selectedRack = useStore((state) => state.selectedRack);
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const theme = useStore((state) => state.theme);
  const useRealShadows = useStore((state) => state.useRealShadows);
  const config = getThemeConfig(theme);
  const colors = config.colors;
  const { raycaster, pointer, camera, gl } = useThree();

  // Log when component mounts
  useEffect(() => {
    console.log('🎨 InstancedInventoryBoxes component mounted - ID:', Math.random().toString(36).substr(2, 9));
    console.log('📦 Initial boxes count:', boxes.length);
    return () => console.log('🎨 InstancedInventoryBoxes component unmounted');
  }, []);

  // Refs for instanced meshes
  const storedRef = useRef<THREE.InstancedMesh>(null);
  const stagedRef = useRef<THREE.InstancedMesh>(null);
  const transitRef = useRef<THREE.InstancedMesh>(null);
  const emptyRef = useRef<THREE.InstancedMesh>(null);
  const selectedRef = useRef<THREE.InstancedMesh>(null);

  // Hover state
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const hoveredRef = useRef<THREE.InstancedMesh>(null);

  // Shared geometry and materials from pools
  const boxGeometry = useMemo(() => GeometryPool.getBox(2.5, 2.5, 2.5), []);

  const materials = useMemo(() => ({
    stored: MaterialPool.getStandardMaterial({
      color: '#d1d5db', // Light gray for better visibility
      roughness: 0.6,
      metalness: 0.2,
    }),
    staged: MaterialPool.getStandardMaterial({
      color: '#facc15',
      roughness: 0.6,
      metalness: 0.2,
    }),
    in_transit: MaterialPool.getStandardMaterial({
      color: '#fb923c',
      roughness: 0.6,
      metalness: 0.2,
    }),
    empty: MaterialPool.getStandardMaterial({
      color: '#9ca3af',
      roughness: 0.6,
      metalness: 0.2,
    }),
    selected: MaterialPool.getStandardMaterial({
      color: colors.inventorySelected || '#4ade80',
      roughness: 0.6,
      metalness: 0.2,
      emissive: colors.inventorySelected || '#4ade80',
      emissiveIntensity: config.effects.selection.emissiveIntensity * 0.3,
    }),
    hovered: MaterialPool.getStandardMaterial({
      color: '#60a5fa', // Blue for hover
      roughness: 0.6,
      metalness: 0.2,
      emissive: '#60a5fa',
      emissiveIntensity: config.effects.hover.emissiveIntensity,
    }),
  }), [colors, config]);

  // Group boxes by status
  const boxGroups = useMemo(() => {
    const groups: Record<string, Box[]> = {
      stored: [],
      staged: [],
      in_transit: [],
      empty: [],
      selected: [],
      hovered: [],
    };
    
    console.log('📊 Grouping boxes...');

    boxes.forEach((box) => {
      if (box.box_id === selectedBox) {
        groups.selected.push(box);
      } else if (box.box_id === hoveredBoxId) {
        groups.hovered.push(box);
      } else {
        groups[box.status]?.push(box);
      }
    });

    console.log('✅ Box groups created:', Object.keys(groups).map(k => `${k}:${groups[k].length}`).join(', '));
    return groups;
  }, [boxes, selectedBox, hoveredBoxId]);
  
  // Log every render to detect duplicates
  console.log('🔄 InstancedInventoryBoxes RENDER', { boxCount: boxes.length, groupCounts: Object.keys(boxGroups).map(k => `${k}:${boxGroups[k].length}`).join(', ') });

  // Update instance matrices
  useEffect(() => {
    console.log('🔄 useEffect triggered for updating instances');
    console.log('Conditions:', { 
      hasBoxes: boxes.length, 
      hasLayout: !!warehouseLayout,
      storedCount: boxGroups.stored.length,
      stagedCount: boxGroups.staged.length 
    });
    
    const updateInstances = (
      ref: React.RefObject<THREE.InstancedMesh>,
      boxList: Box[],
      groupName: string
    ) => {
      if (!ref.current || !warehouseLayout) {
        if (boxList.length > 0) {
          console.warn(`❌ Cannot update ${groupName} instances:`, { hasRef: !!ref.current, hasLayout: !!warehouseLayout, boxCount: boxList.length });
        }
        return;
      }
      
      console.log(`🎯 Updating ${groupName}: ${boxList.length} instances`);

      const mesh = ref.current;
      const matrix = new THREE.Matrix4();
      const opacity = selectedRack ? 0.4 : 1.0;


      boxList.forEach((box, i) => {
        // Get position based on rack slot or coordinates
        const rack = warehouseLayout.racks.find((r) => r.element_id === box.rack_id);
        
        let pos: { x: number; y: number; z: number };
        
        if (rack) {
          // Get slot position RELATIVE to rack
          const slotPos = RackSlots.getSlotPosition(box.level, box.position, {
            width: rack.width,
            height: rack.height || 20,
            depth: rack.depth,
          });
          
          // Convert rack's CSV coordinates to THREE.js world space
          const rackWorldPos = CoordinateMapper.csvToThree(rack.x, rack.y, rack.z || 0);
          
          // Apply rack rotation to slot offset
          const rotationY = ((rack.rotation || 0) * Math.PI) / 180;
          const cosR = Math.cos(rotationY);
          const sinR = Math.sin(rotationY);
          
          // Rotate slot offset around Y-axis
          const rotatedX = slotPos.x * cosR - slotPos.z * sinR;
          const rotatedZ = slotPos.x * sinR + slotPos.z * cosR;
          
          // Add rotated slot offset to rack world position
          pos = {
            x: rackWorldPos.x + rotatedX,
            y: slotPos.y,  // Y is absolute (height from ground)
            z: rackWorldPos.z + rotatedZ,
          };
        } else {
          // Fallback to box's own coordinates
          pos = CoordinateMapper.csvToThree(box.x, box.y, box.z);
        }

        // Check if box should be dimmed (not in selected rack)
        const isInSelectedRack = selectedRack && box.rack_id === selectedRack;
        const isDimmed = Boolean(selectedRack && !isInSelectedRack && box.box_id !== selectedBox);
        const finalOpacity = isDimmed ? 0.4 : opacity;

        // Add realistic variation per box using deterministic randomization
        // Seed based on box_id for consistent but unique variations
        const seed = box.box_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = (offset: number) => {
          const x = Math.sin(seed + offset) * 10000;
          return x - Math.floor(x);
        };

        // Calculate base scale to fit boxes within slots
        // Rack has 3 positions per shelf with gaps
        const gapBetweenBoxes = 0.5;
        const totalGapSpace = gapBetweenBoxes * 2; // 2 gaps for 3 boxes
        const availableWidth = rack ? rack.width - totalGapSpace : 15;
        const slotWidth = availableWidth / 3;
        const baseBoxSize = 2.5; // Default geometry size
        const baseScale = (slotWidth / baseBoxSize) * 0.95; // 0.95 to leave small gaps
        
        // Subtle scale variation (95-105%) on top of base scale
        const scaleVariation = baseScale * (0.95 + random(4) * 0.10);

        // Small position offsets for organic placement
        const offsetX = (random(2) - 0.5) * 0.2;
        const offsetZ = (random(3) - 0.5) * 0.2;

        // Compose transformation matrix: Scale -> Translate (no rotation)
        const position = new THREE.Vector3(pos.x + offsetX, pos.y, pos.z + offsetZ);
        const quaternion = new THREE.Quaternion(); // Identity rotation (no rotation)
        const scale = new THREE.Vector3(scaleVariation, scaleVariation, scaleVariation);
        
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(i, matrix);

        // Set color/opacity per instance (for dimming) + subtle color variation
        if (mesh.instanceColor && mesh.material instanceof THREE.MeshStandardMaterial) {
          const color = new THREE.Color();
          color.setStyle(mesh.material.color.getStyle());
          
          // Subtle color variation for realism (90-110% brightness)
          color.r = Math.min(1, color.r * (0.90 + random(6) * 0.20));
          color.g = Math.min(1, color.g * (0.90 + random(7) * 0.20));
          color.b = Math.min(1, color.b * (0.90 + random(8) * 0.20));
          
          color.multiplyScalar(finalOpacity);
          mesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
        }
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.computeBoundingSphere();
      
      console.log(`✅ Updated ${groupName}: ${boxList.length} instances positioned`);
    };

    updateInstances(storedRef, boxGroups.stored, 'stored');
    updateInstances(stagedRef, boxGroups.staged, 'staged');
    updateInstances(transitRef, boxGroups.in_transit, 'in_transit');
    updateInstances(emptyRef, boxGroups.empty, 'empty');
    updateInstances(selectedRef, boxGroups.selected, 'selected');
    updateInstances(hoveredRef, boxGroups.hovered, 'hovered');
    
    console.log('✅ All instance updates complete');
  }, [boxGroups, warehouseLayout, selectedRack, selectedBox]);

  // Raycasting for selection and hover
  useFrame(() => {
    if (!raycaster || !pointer) return;

    raycaster.setFromCamera(pointer, camera);

    const meshes = [
      storedRef.current,
      stagedRef.current,
      transitRef.current,
      emptyRef.current,
      selectedRef.current,
      hoveredRef.current,
    ].filter((m): m is THREE.InstancedMesh => m !== null);

    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const instanceId = intersection.instanceId;

      if (instanceId !== undefined && intersection.object instanceof THREE.InstancedMesh) {
        // Find which group this mesh belongs to
        let boxId: string | null = null;

        if (intersection.object === storedRef.current && instanceId < boxGroups.stored.length) {
          boxId = boxGroups.stored[instanceId].box_id;
        } else if (intersection.object === stagedRef.current && instanceId < boxGroups.staged.length) {
          boxId = boxGroups.staged[instanceId].box_id;
        } else if (intersection.object === transitRef.current && instanceId < boxGroups.in_transit.length) {
          boxId = boxGroups.in_transit[instanceId].box_id;
        } else if (intersection.object === emptyRef.current && instanceId < boxGroups.empty.length) {
          boxId = boxGroups.empty[instanceId].box_id;
        } else if (intersection.object === selectedRef.current && instanceId < boxGroups.selected.length) {
          boxId = boxGroups.selected[instanceId].box_id;
        } else if (intersection.object === hoveredRef.current && instanceId < boxGroups.hovered.length) {
          boxId = boxGroups.hovered[instanceId].box_id;
        }

        if (boxId && boxId !== hoveredBoxId) {
          setHoveredBoxId(boxId);
          gl.domElement.style.cursor = 'pointer';
        }
      }
    } else if (hoveredBoxId) {
      setHoveredBoxId(null);
      gl.domElement.style.cursor = 'auto';
    }
  });

  // Handle click events
  const handleClick = (event: any) => {
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    
    if (hoveredBoxId) {
      selectBox(hoveredBoxId);
    }
  };

  // Debug: log box counts and verify variations (only once when boxes change)
  useEffect(() => {
    if (boxes.length > 0) {
      console.log('📦 Box counts:', {
        total: boxes.length,
        stored: boxGroups.stored.length,
        staged: boxGroups.staged.length,
        in_transit: boxGroups.in_transit.length,
        empty: boxGroups.empty.length,
      });
      
      // Log sample box to verify variations are being applied
      if (boxGroups.stored.length > 0) {
        const sampleBox = boxGroups.stored[0];
        const seed = sampleBox.box_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = (offset: number) => {
          const x = Math.sin(seed + offset) * 10000;
          return x - Math.floor(x);
        };
        console.log('🎲 Sample box variations:', {
          box_id: sampleBox.box_id,
          rotation: ((random(1) - 0.5) * 0.52 * 180 / Math.PI).toFixed(1) + '°',
          offsetX: ((random(2) - 0.5) * 0.5).toFixed(2),
          offsetZ: ((random(3) - 0.5) * 0.5).toFixed(2),
          scale: (0.90 + random(4) * 0.2).toFixed(2),
        });
      }
    }
  }, [boxes.length, boxGroups.stored.length]);

  console.log('📊 About to render instancedMeshes:', {
    stored: boxGroups.stored.length,
    staged: boxGroups.staged.length,
    in_transit: boxGroups.in_transit.length,
    empty: boxGroups.empty.length,
    selected: boxGroups.selected.length,
    hovered: boxGroups.hovered.length,
  });

  return (
    <group>
      {/* Stored boxes */}
      {boxGroups.stored.length > 0 && (
        <instancedMesh
          ref={storedRef}
          args={[boxGeometry, materials.stored, boxGroups.stored.length]}
          onClick={handleClick}
          castShadow={useRealShadows}
          frustumCulled={false}
        >
          <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(boxGroups.stored.length * 3), 3]} />
        </instancedMesh>
      )}

      {/* Staged boxes */}
      {boxGroups.staged.length > 0 && (
        <instancedMesh
          ref={stagedRef}
          args={[boxGeometry, materials.staged, boxGroups.staged.length]}
          onClick={handleClick}
          castShadow={useRealShadows}
          frustumCulled={false}
        >
          <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(boxGroups.staged.length * 3), 3]} />
        </instancedMesh>
      )}

      {/* In-transit boxes */}
      {boxGroups.in_transit.length > 0 && (
        <instancedMesh
          ref={transitRef}
          args={[boxGeometry, materials.in_transit, boxGroups.in_transit.length]}
          onClick={handleClick}
          castShadow={useRealShadows}
          frustumCulled={false}
        >
          <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(boxGroups.in_transit.length * 3), 3]} />
        </instancedMesh>
      )}

      {/* Empty boxes */}
      {boxGroups.empty.length > 0 && (
        <instancedMesh
          ref={emptyRef}
          args={[boxGeometry, materials.empty, boxGroups.empty.length]}
          onClick={handleClick}
          castShadow={useRealShadows}
          frustumCulled={false}
        >
          <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(boxGroups.empty.length * 3), 3]} />
        </instancedMesh>
      )}

      {/* Selected box */}
      {boxGroups.selected.length > 0 && (
        <instancedMesh
          ref={selectedRef}
          args={[boxGeometry, materials.selected, boxGroups.selected.length]}
          onClick={handleClick}
          castShadow={useRealShadows}
          frustumCulled={false}
        >
          <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(boxGroups.selected.length * 3), 3]} />
        </instancedMesh>
      )}

      {/* Hovered box */}
      {boxGroups.hovered.length > 0 && (
        <instancedMesh
          ref={hoveredRef}
          args={[boxGeometry, materials.hovered, boxGroups.hovered.length]}
          onClick={handleClick}
          castShadow={useRealShadows}
          frustumCulled={false}
        >
          <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(boxGroups.hovered.length * 3), 3]} />
        </instancedMesh>
      )}
    </group>
  );
}
