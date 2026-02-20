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
  delta?: number;
}

function ZoneKPICard({ zone, value, unit, intensity, zoneName, delta }: ZoneKPICardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  const position = useMemo(() => {
    const pos = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
    const cardY = (zone.height || 20) + 5;
    return [pos.x, cardY, pos.z] as [number, number, number];
  }, [zone.x, zone.y, zone.z, zone.height]);

  const createRoundedRectShape = (width: number, height: number, radius: number) => {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    
    return shape;
  };

  useFrame(() => {
    if (groupRef.current) {
      const distance = camera.position.distanceTo(new THREE.Vector3(...position));
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

    let unitDisplay = '';
    if (unit === 'density') {
      unitDisplay = '';
    } else if (unit === 'orders/hr') {
      unitDisplay = ' ord/hr';
    } else {
      unitDisplay = unit;
    }

    return { value: formattedValue, unit: unitDisplay };
  }, [value, unit]);

  const colors = useMemo(() => {
    if (intensity < 0.5) {
      return {
        bg: '#0a0f1a',
        bgOpacity: 0.98,
        border: '#10b981',
        accent: '#059669',
        value: '#d1fae5',
        label: '#f1f5f9',
        intensity: '#a7f3d0',
      };
    }
    if (intensity < 0.75) {
      return {
        bg: '#0a0f1a',
        bgOpacity: 0.98,
        border: '#f59e0b',
        accent: '#d97706',
        value: '#fef3c7',
        label: '#f1f5f9',
        intensity: '#fde68a',
      };
    }
    return {
      bg: '#0a0f1a',
      bgOpacity: 0.98,
      border: '#ef4444',
      accent: '#dc2626',
      value: '#fee2e2',
      label: '#f1f5f9',
      intensity: '#fecaca',
    };
  }, [intensity]);

  const statusLabel = useMemo(() => {
    if (intensity < 0.5) return 'SAFE';
    if (intensity < 0.75) return 'WATCH';
    return 'AT RISK';
  }, [intensity]);

  const statusColors = useMemo(() => {
    if (intensity < 0.5) {
      return {
        bg: '#10b981',
        text: '#000000',
      };
    }
    if (intensity < 0.75) {
      return {
        bg: '#f59e0b',
        text: '#000000',
      };
    }
    return {
      bg: '#ef4444',
      text: '#000000',
    };
  }, [intensity]);

  const cardWidth = 18;
  const cardHeight = 9;
  const cornerRadius = 1.5;
  const strokeWidth = 0.4;

  const createStatusBadgeShape = (width: number, height: number, radius: number) => {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    
    return shape;
  };

  const cardShape = useMemo(() => createRoundedRectShape(cardWidth, cardHeight, cornerRadius), []);
  const shadowShape = useMemo(() => createRoundedRectShape(cardWidth, cardHeight, cornerRadius), []);
  const strokeShape = useMemo(() => createRoundedRectShape(cardWidth + strokeWidth, cardHeight + strokeWidth, cornerRadius), []);
  const statusBadgeShape = useMemo(() => createStatusBadgeShape(9, 2.5, 0.5), []);

  return (
    <Billboard
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
      position={position}
    >
      <group ref={groupRef}>
        <mesh position={[0.2, -0.2, -0.01]} renderOrder={9998}>
          <shapeGeometry args={[shadowShape]} />
          <meshBasicMaterial 
            color="#000000"
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>

        <mesh position={[0, 0, -0.001]} renderOrder={9999}>
          <shapeGeometry args={[strokeShape]} />
          <meshBasicMaterial 
            color={colors.border}
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>

        <mesh renderOrder={10000}>
          <shapeGeometry args={[cardShape]} />
          <meshBasicMaterial 
            color={colors.bg}
            transparent 
            opacity={colors.bgOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>

        <group position={[0, 0.8, 0.03]}>
          <Text
            position={[displayText.unit || delta !== undefined ? -1 : 0, 0, 0]}
            fontSize={4.5}
            color={colors.value}
            anchorX={displayText.unit || delta !== undefined ? "right" : "center"}
            anchorY="middle"
            renderOrder={10001}
            fontWeight="bold"
            depthTest={false}
          >
            {displayText.value}
          </Text>
          
          {displayText.unit && (
            <Text
              position={[-0.5, 0, 0]}
              fontSize={2.5}
              color="#ffffff"
              anchorX="left"
              anchorY="middle"
              renderOrder={10001}
              letterSpacing={0.02}
              depthTest={false}
            >
              {displayText.unit}
            </Text>
          )}

          {delta !== undefined && (
            <Text
              position={[displayText.unit ? 2 : 0.5, 0, 0]}
              fontSize={2}
              color={delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#94a3b8'}
              anchorX="left"
              anchorY="middle"
              renderOrder={10001}
              letterSpacing={0.02}
              depthTest={false}
            >
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
            </Text>
          )}
        </group>

        <group position={[0, -(cardHeight / 2 - 1.5), 0.03]}>
          <mesh position={[0, 0, -0.01]} renderOrder={10000}>
            <shapeGeometry args={[statusBadgeShape]} />
            <meshBasicMaterial 
              color={statusColors.bg}
              transparent 
              opacity={1}
              side={THREE.DoubleSide}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>

          <Text
            position={[0, 0, 0]}
            fontSize={1.4}
            color={statusColors.text}
            anchorX="center"
            anchorY="middle"
            renderOrder={10001}
            letterSpacing={0.05}
            depthTest={false}
          >
            {statusLabel}
          </Text>
        </group>
      </group>
    </Billboard>
  );
}

function ZoneKPIValuesComponent() {
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const activeOverlay = useStore((state) => state.activeOverlay);
  const selectedKPI = useStore((state) => state.selectedKPI);
  
  const heatData = useStore((state) => {
    if (!activeOverlay) return null;
    const data = state.overlayData.get(activeOverlay as OverlayType);
    return data || null;
  });

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
