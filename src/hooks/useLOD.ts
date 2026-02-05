import { useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export type LODLevel = 'close' | 'medium' | 'far';

interface LODConfig {
  closeThreshold: number;  // < this = close
  mediumThreshold: number; // < this = medium, >= closeThreshold
  // >= mediumThreshold = far
}

const DEFAULT_CONFIG: LODConfig = {
  closeThreshold: 50,
  mediumThreshold: 150,
};

/**
 * Hook for Level of Detail management
 * Returns current LOD level based on camera distance from origin
 */
export function useLOD(config: Partial<LODConfig> = {}): {
  lodLevel: LODLevel;
  cameraDistance: number;
  showLabels: boolean;
  showDetails: boolean;
  showShadows: boolean;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { camera } = useThree();
  const [cameraDistance, setCameraDistance] = useState<number>(200);

  useFrame(() => {
    const distance = camera.position.length();
    setCameraDistance(distance);
  });

  const lodLevel: LODLevel =
    cameraDistance < finalConfig.closeThreshold
      ? 'close'
      : cameraDistance < finalConfig.mediumThreshold
      ? 'medium'
      : 'far';

  return {
    lodLevel,
    cameraDistance,
    showLabels: lodLevel !== 'far',
    showDetails: lodLevel === 'close',
    showShadows: lodLevel !== 'far',
  };
}

/**
 * Calculate label opacity based on camera distance
 * Returns 0-1 opacity value
 */
export function getLabelOpacity(
  cameraDistance: number,
  type: 'zone' | 'aisle' | 'rack'
): number {
  switch (type) {
    case 'zone':
      // Show zone labels when zoomed out (distance > 150), fade out when closer
      if (cameraDistance > 200) return 0.8;
      if (cameraDistance > 150) return 0.6;
      if (cameraDistance > 100) return Math.max(0, (cameraDistance - 100) / 50 * 0.6);
      return 0;

    case 'aisle':
      // Keep aisle labels visible in mid-range, fade when too far or too close
      if (cameraDistance > 300) return 0.3;
      if (cameraDistance > 200) return 0.5;
      if (cameraDistance > 80) return 0.7;
      if (cameraDistance > 40) return Math.max(0, (cameraDistance - 40) / 40 * 0.7);
      return 0;

    case 'rack':
      // Show rack labels at close to medium range
      if (cameraDistance > 150) return 0;
      if (cameraDistance > 100) return Math.max(0, (150 - cameraDistance) / 50);
      if (cameraDistance < 30) return Math.max(0.4, (cameraDistance - 10) / 20);
      return 1.0;

    default:
      return 1.0;
  }
}
