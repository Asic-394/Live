import { useEffect, useRef, useMemo } from 'react';
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
 * High-performance instanced rendering for inventory boxes.
 * Groups boxes by status and renders using InstancedMesh (reduces draw calls from ~6000 to ~4).
 *
 * Hover is handled imperatively via refs + direct GPU buffer writes so it never
 * triggers a React re-render or a full instance-matrix rebuild.
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

  // Refs for instanced meshes
  const storedRef = useRef<THREE.InstancedMesh>(null);
  const stagedRef = useRef<THREE.InstancedMesh>(null);
  const transitRef = useRef<THREE.InstancedMesh>(null);
  const emptyRef = useRef<THREE.InstancedMesh>(null);
  const selectedRef = useRef<THREE.InstancedMesh>(null);

  // Hover tracking — never touches React state to avoid re-renders
  const hoveredBoxIdRef = useRef<string | null>(null);
  const hoveredOrigColor = useRef(new THREE.Color());
  // Maps box_id → { mesh, instanceIdx } built after each instance update
  const boxInstanceMap = useRef<Map<string, { mesh: THREE.InstancedMesh; idx: number }>>(new Map());

  // Shared geometry and materials
  const boxGeometry = useMemo(() => GeometryPool.getBox(2.5, 2.5, 2.5), []);

  const materials = useMemo(() => ({
    stored: MaterialPool.getStandardMaterial({
      color: '#d1d5db',
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
      color: colors.inventorySelected || '#a855f7',
      roughness: 0.6,
      metalness: 0.2,
      emissive: colors.inventorySelected || '#a855f7',
      emissiveIntensity: config.effects.selection.emissiveIntensity * 0.3,
    }),
  }), [colors, config]);

  // Group boxes by status — hover is no longer a group; it is handled imperatively
  const boxGroups = useMemo(() => {
    const groups: Record<string, Box[]> = {
      stored: [],
      staged: [],
      in_transit: [],
      empty: [],
      selected: [],
    };

    boxes.forEach((box) => {
      if (box.box_id === selectedBox) {
        groups.selected.push(box);
      } else {
        groups[box.status]?.push(box);
      }
    });

    return groups;
  }, [boxes, selectedBox]);

  // Update instance matrices + colors, then rebuild the fast lookup map
  useEffect(() => {
    const updateInstances = (
      ref: React.RefObject<THREE.InstancedMesh>,
      boxList: Box[],
    ) => {
      if (!ref.current || !warehouseLayout) return;

      const mesh = ref.current;
      const matrix = new THREE.Matrix4();
      const baseOpacity = selectedRack ? 0.4 : 1.0;

      boxList.forEach((box, i) => {
        const rack = warehouseLayout.racks.find((r) => r.element_id === box.rack_id);

        let pos: { x: number; y: number; z: number };
        if (rack) {
          const slotPos = RackSlots.getSlotPosition(box.level, box.position, {
            width: rack.width,
            height: rack.height || 20,
            depth: rack.depth,
          });
          const rackWorldPos = CoordinateMapper.csvToThree(rack.x, rack.y, rack.z || 0);
          const rotationY = ((rack.rotation || 0) * Math.PI) / 180;
          const cosR = Math.cos(rotationY);
          const sinR = Math.sin(rotationY);
          const rotatedX = slotPos.x * cosR - slotPos.z * sinR;
          const rotatedZ = slotPos.x * sinR + slotPos.z * cosR;
          pos = {
            x: rackWorldPos.x + rotatedX,
            y: slotPos.y,
            z: rackWorldPos.z + rotatedZ,
          };
        } else {
          pos = CoordinateMapper.csvToThree(box.x, box.y, box.z);
        }

        const isInSelectedRack = selectedRack && box.rack_id === selectedRack;
        const isDimmed = Boolean(selectedRack && !isInSelectedRack && box.box_id !== selectedBox);
        const finalOpacity = isDimmed ? 0.4 : baseOpacity;

        // Deterministic per-box variation seeded from box_id
        const seed = box.box_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = (offset: number) => {
          const x = Math.sin(seed + offset) * 10000;
          return x - Math.floor(x);
        };

        const gapBetweenBoxes = 0.5;
        const availableWidth = rack ? rack.width - gapBetweenBoxes * 2 : 15;
        const slotWidth = availableWidth / 3;
        const baseScale = (slotWidth / 2.5) * 0.95;
        const scaleVariation = baseScale * (0.95 + random(4) * 0.10);
        const offsetX = (random(2) - 0.5) * 0.2;
        const offsetZ = (random(3) - 0.5) * 0.2;

        matrix.compose(
          new THREE.Vector3(pos.x + offsetX, pos.y, pos.z + offsetZ),
          new THREE.Quaternion(),
          new THREE.Vector3(scaleVariation, scaleVariation, scaleVariation),
        );
        mesh.setMatrixAt(i, matrix);

        if (mesh.instanceColor && mesh.material instanceof THREE.MeshStandardMaterial) {
          const color = new THREE.Color();
          color.setStyle(mesh.material.color.getStyle());

          // Per-box brightness variation
          color.r = Math.min(1, color.r * (0.90 + random(6) * 0.20));
          color.g = Math.min(1, color.g * (0.90 + random(7) * 0.20));
          color.b = Math.min(1, color.b * (0.90 + random(8) * 0.20));

          // Blend toward selection color for boxes inside the selected rack
          if (isInSelectedRack) {
            const selColor = new THREE.Color(colors.rackSelected);
            color.r = color.r * 0.45 + selColor.r * 0.55;
            color.g = color.g * 0.45 + selColor.g * 0.55;
            color.b = color.b * 0.45 + selColor.b * 0.55;
          }

          color.multiplyScalar(finalOpacity);
          mesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
        }
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    updateInstances(storedRef, boxGroups.stored);
    updateInstances(stagedRef, boxGroups.staged);
    updateInstances(transitRef, boxGroups.in_transit);
    updateInstances(emptyRef, boxGroups.empty);
    updateInstances(selectedRef, boxGroups.selected);

    // Rebuild the box → {mesh, idx} lookup map so useFrame can address instances directly
    const map = new Map<string, { mesh: THREE.InstancedMesh; idx: number }>();
    const register = (ref: React.RefObject<THREE.InstancedMesh>, list: Box[]) => {
      if (!ref.current) return;
      list.forEach((box, idx) => map.set(box.box_id, { mesh: ref.current!, idx }));
    };
    register(storedRef, boxGroups.stored);
    register(stagedRef, boxGroups.staged);
    register(transitRef, boxGroups.in_transit);
    register(emptyRef, boxGroups.empty);
    register(selectedRef, boxGroups.selected);
    boxInstanceMap.current = map;

    // Clear any stale hover state since the buffers were just rebuilt
    hoveredBoxIdRef.current = null;
  }, [boxGroups, warehouseLayout, selectedRack, selectedBox, colors.rackSelected]);

  // Raycasting for hover + click — zero React state updates, zero re-renders
  useFrame(() => {
    if (!raycaster || !pointer) return;

    raycaster.setFromCamera(pointer, camera);

    const meshes = [
      storedRef.current,
      stagedRef.current,
      transitRef.current,
      emptyRef.current,
      selectedRef.current,
    ].filter((m): m is THREE.InstancedMesh => m !== null);

    const intersects = raycaster.intersectObjects(meshes, false);

    let newHoveredId: string | null = null;

    if (intersects.length > 0) {
      const hit = intersects[0];
      const instanceId = hit.instanceId;

      if (instanceId !== undefined && hit.object instanceof THREE.InstancedMesh) {
        let boxId: string | null = null;
        if (hit.object === storedRef.current && instanceId < boxGroups.stored.length) {
          boxId = boxGroups.stored[instanceId].box_id;
        } else if (hit.object === stagedRef.current && instanceId < boxGroups.staged.length) {
          boxId = boxGroups.staged[instanceId].box_id;
        } else if (hit.object === transitRef.current && instanceId < boxGroups.in_transit.length) {
          boxId = boxGroups.in_transit[instanceId].box_id;
        } else if (hit.object === emptyRef.current && instanceId < boxGroups.empty.length) {
          boxId = boxGroups.empty[instanceId].box_id;
        } else if (hit.object === selectedRef.current && instanceId < boxGroups.selected.length) {
          boxId = boxGroups.selected[instanceId].box_id;
        }

        if (boxId) {
          const box = boxes.find((b) => b.box_id === boxId);
          if (selectedRack && box && box.rack_id === selectedRack) {
            newHoveredId = boxId;
          }
        }
      }
    }

    gl.domElement.style.cursor = newHoveredId ? 'pointer' : 'auto';

    if (newHoveredId === hoveredBoxIdRef.current) return;

    // Restore the previously hovered instance's original color
    if (hoveredBoxIdRef.current) {
      const info = boxInstanceMap.current.get(hoveredBoxIdRef.current);
      if (info?.mesh.instanceColor) {
        info.mesh.instanceColor.setXYZ(info.idx, hoveredOrigColor.current.r, hoveredOrigColor.current.g, hoveredOrigColor.current.b);
        info.mesh.instanceColor.needsUpdate = true;
      }
    }

    hoveredBoxIdRef.current = newHoveredId;

    // Apply hover tint to the newly hovered instance
    if (newHoveredId) {
      const info = boxInstanceMap.current.get(newHoveredId);
      if (info?.mesh.instanceColor) {
        // Save current color so we can restore it on un-hover
        hoveredOrigColor.current.set(
          info.mesh.instanceColor.getX(info.idx),
          info.mesh.instanceColor.getY(info.idx),
          info.mesh.instanceColor.getZ(info.idx),
        );
        const hoverColor = new THREE.Color('#60a5fa');
        info.mesh.instanceColor.setXYZ(info.idx, hoverColor.r, hoverColor.g, hoverColor.b);
        info.mesh.instanceColor.needsUpdate = true;
      }
    }
  });

  // Click handler reads from the ref — no state dependency
  const handleClick = (event: { stopPropagation?: () => void }) => {
    event.stopPropagation?.();
    const id = hoveredBoxIdRef.current;
    if (!id) return;
    const box = boxes.find((b) => b.box_id === id);
    if (selectedRack && box && box.rack_id === selectedRack) {
      selectBox(id);
    }
  };

  return (
    <group>
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
    </group>
  );
}
