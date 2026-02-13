import { useMemo, memo, useRef } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../state/store';
import { CoordinateMapper } from '../../utils/coordinates';
import type { WarehouseLayoutElement, OverlayType } from '../../types';

interface ZoneKPICardProps {
  zone: WarehouseLayoutElement;
  value: number;
  unit: string;
  intensity: number;
  zoneName: string;
}

function ZoneKPICard({ zone, value, unit, intensity, zoneName }: ZoneKPICardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  const position = useMemo(() => {
    const pos = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
    // Position card elevated above racks - at the height of the zone + some offset
    const cardY = (zone.height || 20) + 5; // Above the zone height
    return [pos.x, cardY, pos.z] as [number, number, number];
  }, [zone.x, zone.y, zone.z, zone.height]);

  // Scale based on distance from camera for better readability
  useFrame(() => {
    if (groupRef.current) {
      const distance = camera.position.distanceTo(new THREE.Vector3(...position));
      // Scale up when far away, scale down when close
      // Min scale: 1.0, Max scale: 2.5
      const scale = Math.min(2.5, Math.max(1.0, distance / 100));
      groupRef.current.scale.setScalar(scale);
    }
  });

  const displayText = useMemo(() => {
    let formattedValue: string;
    
    if (unit === '%') {
      formattedValue = value.toFixed(0);
    } else if (unit === 'density') {
      formattedValue = value.toFixed(2);
    } else if (unit === 'orders/hr') {
      formattedValue = value.toFixed(0);
    } else {
      formattedValue = value.toFixed(1);
    }

    // Format unit display
    let unitDisplay = '';
    if (unit === 'density') {
      unitDisplay = ''; // No unit for density
    } else if (unit === 'orders/hr') {
      unitDisplay = ' ord/hr'; // Shortened for space
    } else {
      unitDisplay = unit;
    }

    return { value: formattedValue, unit: unitDisplay };
  }, [value, unit]);

  // Color scheme based on intensity
  const colors = useMemo(() => {
    if (intensity < 0.4) {
      return {
        bg: '#10b981', // solid green background
        bgOpacity: 0.9,
        text: '#ffffff',
        accent: '#065f46' // darker green for accent
      };
    }
    if (intensity < 0.7) {
      return {
        bg: '#f59e0b', // solid amber background
        bgOpacity: 0.9,
        text: '#ffffff',
        accent: '#92400e' // darker amber for accent
      };
    }
    return {
      bg: '#ef4444', // solid red background
      bgOpacity: 0.9,
      text: '#ffffff',
      accent: '#991b1b' // darker red for accent
    };
  }, [intensity]);

  const cardWidth = 18;
  const cardHeight = 10;

  return (
    <Billboard
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
      position={position}
    >
      <group ref={groupRef}>
        {/* Main card background with status color */}
        <mesh renderOrder={100}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial 
            color={colors.bg}
            transparent 
            opacity={colors.bgOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Darker accent line at the left for depth */}
        <mesh position={[-(cardWidth / 2 - 0.4), 0, 0.01]} renderOrder={101}>
          <planeGeometry args={[0.8, cardHeight - 1]} />
          <meshBasicMaterial 
            color={colors.accent}
            transparent 
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Zone name label (top) */}
        <Text
          position={[0, cardHeight / 2 - 1.5, 0.02]}
          fontSize={1.3}
          color={colors.text}
          anchorX="center"
          anchorY="middle"
          renderOrder={102}
          maxWidth={cardWidth - 2}
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {zoneName}
        </Text>

        {/* Value (center, large) - split into value and unit */}
        <Text
          position={[0, 0, 0.02]}
          fontSize={3.0}
          color={colors.text}
          anchorX="center"
          anchorY="middle"
          renderOrder={102}
          outlineWidth={0.2}
          outlineColor="#000000"
          maxWidth={cardWidth - 2}
        >
          {displayText.value}
        </Text>

        {/* Unit label (smaller, next to value) */}
        {displayText.unit && (
          <Text
            position={[0, -1.5, 0.02]}
            fontSize={1.5}
            color={colors.text}
            anchorX="center"
            anchorY="middle"
            renderOrder={102}
            maxWidth={cardWidth - 2}
            outlineWidth={0.1}
            outlineColor="#000000"
          >
            {displayText.unit}
          </Text>
        )}

        {/* Intensity indicator (bottom, small) */}
        <Text
          position={[0, -(cardHeight / 2 - 1.3), 0.02]}
          fontSize={1.1}
          color={colors.text}
          anchorX="center"
          anchorY="middle"
          renderOrder={102}
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {`${(intensity * 100).toFixed(0)}% intensity`}
        </Text>
      </group>
    </Billboard>
  );
}

function ZoneKPIValuesComponent() {
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const activeOverlay = useStore((state) => state.activeOverlay);
  const selectedKPI = useStore((state) => state.selectedKPI);
  
  // Get the heat data for the active overlay
  const heatData = useStore((state) => {
    if (!activeOverlay) return null;
    const data = state.overlayData.get(activeOverlay as OverlayType);
    return data || null;
  });

  // Get the overlay config to determine the unit
  const overlayUnit = useMemo(() => {
    if (!activeOverlay) return '';
    
    switch (activeOverlay) {
      case 'heat_congestion':
        return 'density';
      case 'heat_utilization':
        return '%';
      case 'heat_throughput':
        return 'orders/hr';
      default:
        return '';
    }
  }, [activeOverlay]);

  const valueLabels = useMemo(() => {
    // Only show values when a KPI is selected and overlay is active
    if (!selectedKPI || !activeOverlay || !warehouseLayout?.zones || !heatData || heatData.length === 0) {
      return [];
    }

    const labels: JSX.Element[] = [];

    for (const zone of warehouseLayout.zones) {
      const data = heatData.find(d => d.zoneId === zone.element_id);
      if (!data) continue;

      labels.push(
        <ZoneKPICard
          key={zone.element_id}
          zone={zone}
          value={data.value}
          unit={overlayUnit}
          intensity={data.intensity}
          zoneName={zone.name || zone.element_id}
        />
      );
    }

    return labels;
  }, [selectedKPI, activeOverlay, warehouseLayout?.zones, heatData, overlayUnit]);

  if (valueLabels.length === 0) {
    return null;
  }

  return <group>{valueLabels}</group>;
}

export default memo(ZoneKPIValuesComponent);
