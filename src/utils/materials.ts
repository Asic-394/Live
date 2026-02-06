/**
 * Material utility functions for consistent visual styling across the warehouse scene
 * Centralizes color definitions and material properties for easier maintenance
 */

import type { MeshStandardMaterialParameters } from 'three';
import type { Theme } from '../types';

/**
 * Comprehensive theme configuration interface for scene styling
 */
export interface ThemeConfig {
  colors: {
    // Background & atmosphere
    background: string;
    fog: string;

    // Floor & ground
    floorBase: string;
    floorGrid: string;

    // Walls & structure
    wallMain: string;
    wallTrim: string;

    // Racks
    rackDefault: string;
    rackHover: string;
    rackSelected: string;

    // Boxes & pallets
    boxLight: string;
    boxMedium: string;
    boxDark: string;
    boxBase: string;

    // Zones
    zoneReceiving: string;
    zoneReceivingOutline: string;
    zoneStorage: string;
    zoneStorageOutline: string;
    zonePicking: string;
    zonePickingOutline: string;
    zoneStaging: string;
    zoneStagingOutline: string;
    zoneDefault: string;
    zoneDefaultOutline: string;

    // Aisles
    aisleMain: string;
    aisleCenterline: string;
    aisleArrow: string;

    // Docks
    dockReceiving: string;
    dockShipping: string;
    dockReceivingOutline: string;
    dockShippingOutline: string;
    dockFrame: string;
    dockPlatform: string;
    safetyYellow: string;

    // Labels
    zoneLabelColor: string;
    aisleLabelColor: string;
    rackLabelColor: string;
    dockLabelColor: string;

    // Entities
    worker: string;
    workerSelected: string;
    forklift: string;
    forkliftSelected: string;
    forkliftForks: string;
    pallet: string;
    palletSelected: string;
    inventory: string;
    inventorySelected: string;
    truck: string;
    truckSelected: string;
    truckCab: string;
    truckTrailer: string;
    truckWheel: string;

    // Yard elements
    yardSurface: string;
    yardGrid: string;
    roadAsphalt: string;
    roadMarking: string;
    roadArrow: string;
    parkingBay: string;
    parkingNumber: string;
    gateFrame: string;
    gateBarrier: string;
    gateLightGreen: string;
    gateLightRed: string;

    // Accents
    accentCyan: string;
    selectionGlow: string;
  };

  renderer: {
    background: string;
    toneMapping: number;
    toneMappingExposure: number;
  };

  fog: {
    enabled: boolean;
    color: string;
    near: number;
    far: number;
  };

  lighting: {
    ambient: {
      intensity: number;
      color: string;
    };
    keyLight: {
      intensity: number;
      color: string;
      position: [number, number, number];
      castShadow: boolean;
    };
    fillLight: {
      intensity: number;
      color: string;
      position: [number, number, number];
    };
    rimLight: {
      intensity: number;
      color: string;
      position: [number, number, number];
    };
    hemisphere: {
      intensity: number;
      skyColor: string;
      groundColor: string;
    };
  };

  materials: {
    floor: {
      roughness: number;
      metalness: number;
    };
    wall: {
      roughness: number;
      metalness: number;
    };
    rack: {
      roughness: number;
      metalness: number;
    };
    entity: {
      roughness: number;
      metalness: number;
    };
  };

  shadows: {
    enabled: boolean;
    blob: {
      opacity: number;
      sizeMultiplier: number;
    };
    contact: {
      opacity: number;
      blur: number;
    };
  };

  effects: {
    selection: {
      emissiveIntensity: number;
      glowColor: string;
    };
    hover: {
      emissiveIntensity: number;
    };
  };
}

/**
 * Dark mode theme configuration - "Command Center" aesthetic
 */
const DARK_THEME_CONFIG: ThemeConfig = {
  colors: {
    background: '#1a1d22',
    fog: '#1a1d22',

    floorBase: '#2a2c30',
    floorGrid: '#3a3e44',

    wallMain: '#6a6c70',
    wallTrim: '#0d0f12',

    rackDefault: '#6a6e75',
    rackHover: '#9a9ea5',
    rackSelected: '#00D9FF',

    boxLight: '#8a8e93',
    boxMedium: '#6a6e75',
    boxDark: '#4a4e55',
    boxBase: '#5a5e65',

    zoneReceiving: '#3d5a4a',
    zoneReceivingOutline: '#5a8a6a',
    zoneStorage: '#4a4a5c',
    zoneStorageOutline: '#6a6a8c',
    zonePicking: '#5c4a3d',
    zonePickingOutline: '#8c6a5d',
    zoneStaging: '#4a5a3d',
    zoneStagingOutline: '#6a8a5d',
    zoneDefault: '#2d4a5c',
    zoneDefaultOutline: '#4a7a9c',

    aisleMain: '#3a3e42',
    aisleCenterline: '#5a5e65',
    aisleArrow: '#6a6e75',

    dockReceiving: '#3d7a5e',
    dockShipping: '#5a7a3d',
    dockReceivingOutline: '#4a9a7a',
    dockShippingOutline: '#7a9a4a',
    dockFrame: '#2d2f33',
    dockPlatform: '#4a4d52',
    safetyYellow: '#f4d03f',

    zoneLabelColor: '#7a8a9a',
    aisleLabelColor: '#7a7e84',
    rackLabelColor: '#c8ced4',
    dockLabelColor: '#f4d03f',

    worker: '#7a8a9a',
    workerSelected: '#00D9FF',
    forklift: '#8a7a6a',
    forkliftSelected: '#00D9FF',
    forkliftForks: '#6a6e75',
    pallet: '#7a6a5a',
    palletSelected: '#00D9FF',
    inventory: '#6a7a8a',
    inventorySelected: '#4ade80',
    truck: '#5a6a7a',
    truckSelected: '#00D9FF',
    truckCab: '#1e3a5f',
    truckTrailer: '#6a7a8a',
    truckWheel: '#1a1a1a',

    yardSurface: '#2a2a2a',
    yardGrid: '#3a3a3a',
    roadAsphalt: '#1a1a1a',
    roadMarking: '#ffffff',
    roadArrow: '#ffff00',
    parkingBay: '#ffd700',
    parkingNumber: '#ffffff',
    gateFrame: '#4a4a4a',
    gateBarrier: '#ff6600',
    gateLightGreen: '#00ff00',
    gateLightRed: '#ff0000',

    accentCyan: '#22d3ee',
    selectionGlow: '#00D9FF',
  },

  renderer: {
    background: '#1a1d22',
    toneMapping: 4,
    toneMappingExposure: 1.0,
  },

  fog: {
    enabled: false,
    color: '#1a1d22',
    near: 50,
    far: 500,
  },

  lighting: {
    ambient: {
      intensity: 0.3,
      color: '#ffffff',
    },
    keyLight: {
      intensity: 1.4,
      color: '#ffffff',
      position: [50, 200, 40],
      castShadow: true,
    },
    fillLight: {
      intensity: 0.7,
      color: '#b0c4de',
      position: [-40, 50, -30],
    },
    rimLight: {
      intensity: 0.6,
      color: '#ffffff',
      position: [0, 100, 0],
    },
    hemisphere: {
      intensity: 0.4,
      skyColor: '#87ceeb',
      groundColor: '#2a2c30',
    },
  },

  materials: {
    floor: {
      roughness: 0.95,
      metalness: 0.02,
    },
    wall: {
      roughness: 0.95,
      metalness: 0.05,
    },
    rack: {
      roughness: 0.45,
      metalness: 0.2,
    },
    entity: {
      roughness: 0.6,
      metalness: 0.15,
    },
  },

  shadows: {
    enabled: true,
    blob: {
      opacity: 0.18,
      sizeMultiplier: 1.6,
    },
    contact: {
      opacity: 0.45,
      blur: 2.5,
    },
  },

  effects: {
    selection: {
      emissiveIntensity: 1.2,
      glowColor: '#00D9FF',
    },
    hover: {
      emissiveIntensity: 0.5,
    },
  },
};

/**
 * Light mode theme configuration - "Daylight Studio" aesthetic
 */
const LIGHT_THEME_CONFIG: ThemeConfig = {
  colors: {
    background: '#e8ebef',
    fog: '#e8ebef',

    floorBase: '#d4d7db',
    floorGrid: '#c0c4c9',

    wallMain: '#b8bbc0',
    wallTrim: '#9fa3a8',

    rackDefault: '#7a7e85',
    rackHover: '#5a5e65',
    rackSelected: '#0088cc',

    boxLight: '#9a9ea5',
    boxMedium: '#7a7e85',
    boxDark: '#5a5e65',
    boxBase: '#6a6e75',

    zoneReceiving: '#b8d4c4',
    zoneReceivingOutline: '#5a9a7a',
    zoneStorage: '#c4c4d4',
    zoneStorageOutline: '#6a6a9c',
    zonePicking: '#d4c4b8',
    zonePickingOutline: '#9c7a6a',
    zoneStaging: '#c4d4b8',
    zoneStagingOutline: '#7a9a6a',
    zoneDefault: '#b8c4d4',
    zoneDefaultOutline: '#5a7a9c',

    aisleMain: '#c8ccd0',
    aisleCenterline: '#a0a4a8',
    aisleArrow: '#8a8e94',

    dockReceiving: '#8ac4a8',
    dockShipping: '#a8c48a',
    dockReceivingOutline: '#5a9a7a',
    dockShippingOutline: '#7a9a5a',
    dockFrame: '#8a8d92',
    dockPlatform: '#b0b3b8',
    safetyYellow: '#f4c430',

    zoneLabelColor: '#5a6a7a',
    aisleLabelColor: '#6a6e74',
    rackLabelColor: '#3a3e44',
    dockLabelColor: '#d4a400',

    worker: '#6a7a8a',
    workerSelected: '#0088cc',
    forklift: '#7a6a5a',
    forkliftSelected: '#0088cc',
    forkliftForks: '#5a5e65',
    pallet: '#6a5a4a',
    palletSelected: '#0088cc',
    inventory: '#5a6a7a',
    inventorySelected: '#22c55e',
    truck: '#5a6a7a',
    truckSelected: '#0088cc',
    truckCab: '#2e5a8f',
    truckTrailer: '#8a9aaa',
    truckWheel: '#2a2a2a',

    yardSurface: '#c8ccd0',
    yardGrid: '#b8bcc0',
    roadAsphalt: '#7a7e84',
    roadMarking: '#ffffff',
    roadArrow: '#f4c430',
    parkingBay: '#ffd700',
    parkingNumber: '#3a3e44',
    gateFrame: '#8a8e94',
    gateBarrier: '#ff8800',
    gateLightGreen: '#22c55e',
    gateLightRed: '#ef4444',

    accentCyan: '#0099dd',
    selectionGlow: '#0088cc',
  },

  renderer: {
    background: '#e8ebef',
    toneMapping: 1,
    toneMappingExposure: 1.1,
  },

  fog: {
    enabled: false,
    color: '#e8ebef',
    near: 100,
    far: 600,
  },

  lighting: {
    ambient: {
      intensity: 0.75,
      color: '#ffffff',
    },
    keyLight: {
      intensity: 1.1,
      color: '#fffef8',
      position: [50, 200, 40],
      castShadow: true,
    },
    fillLight: {
      intensity: 0.7,
      color: '#f0f4f8',
      position: [-40, 50, -30],
    },
    rimLight: {
      intensity: 0.6,
      color: '#ffffff',
      position: [0, 100, 0],
    },
    hemisphere: {
      intensity: 0.5,
      skyColor: '#b0d0f0',
      groundColor: '#d4d7db',
    },
  },

  materials: {
    floor: {
      roughness: 0.6,
      metalness: 0.12,
    },
    wall: {
      roughness: 0.65,
      metalness: 0.15,
    },
    rack: {
      roughness: 0.25,
      metalness: 0.4,
    },
    entity: {
      roughness: 0.4,
      metalness: 0.2,
    },
  },

  shadows: {
    enabled: true,
    blob: {
      opacity: 0.15,
      sizeMultiplier: 1.65,
    },
    contact: {
      opacity: 0.3,
      blur: 3.0,
    },
  },

  effects: {
    selection: {
      emissiveIntensity: 0.8,
      glowColor: '#0088cc',
    },
    hover: {
      emissiveIntensity: 0.35,
    },
  },
};

/**
 * Get theme configuration based on current theme
 */
export function getThemeConfig(theme: Theme): ThemeConfig {
  return theme === 'dark' ? DARK_THEME_CONFIG : LIGHT_THEME_CONFIG;
}

/**
 * Legacy theme colors for backward compatibility
 * @deprecated Use getThemeConfig().colors instead
 */
export const THEME_COLORS = DARK_THEME_CONFIG.colors;

/**
 * Premium floor material configuration
 */
export function premiumFloorMaterial(): MeshStandardMaterialParameters {
  return {
    color: THEME_COLORS.floorBase,
    roughness: 0.85,
    metalness: 0.05,
  };
}

/**
 * Outline material for consistent line rendering
 */
export function outlineMaterial(
  color: string = THEME_COLORS.accentCyan,
  opacity: number = 1.0
): { color: string; linewidth: number; transparent: boolean; opacity: number } {
  return {
    color,
    linewidth: 3,
    transparent: true,
    opacity,
  };
}

/**
 * Rack frame beam material with proper roughness/metalness
 */
export function frameBeamMaterial(
  color: string,
  emissive: string = '#000000',
  emissiveIntensity: number = 0
): MeshStandardMaterialParameters {
  return {
    color,
    emissive,
    emissiveIntensity,
    roughness: 0.45,
    metalness: 0.2,
  };
}

/**
 * Selection ring material for animated indicators
 */
export function selectionRingMaterial(
  color: string = THEME_COLORS.accentCyan,
  emissiveIntensity: number = 0.5,
  opacity: number = 0.8
): MeshStandardMaterialParameters {
  return {
    color,
    emissive: color,
    emissiveIntensity,
    transparent: true,
    opacity,
  };
}

/**
 * Wall material with matte industrial look
 */
export function wallMaterial(): MeshStandardMaterialParameters {
  return {
    color: THEME_COLORS.wallMain,
    roughness: 0.95,
    metalness: 0.1,
  };
}

/**
 * Wall base trim material
 */
export function wallTrimMaterial(): MeshStandardMaterialParameters {
  return {
    color: THEME_COLORS.wallTrim,
    roughness: 0.9,
    metalness: 0.15,
  };
}

/**
 * Calculate dimming factor for non-selected items
 */
export function getDimFactor(isDimmed: boolean): number {
  return isDimmed ? 0.4 : 1.0;
}

/**
 * Apply dimming to material opacity
 */
export function applyDimming(
  baseOpacity: number = 1.0,
  isDimmed: boolean = false
): { transparent: boolean; opacity: number } {
  const opacity = baseOpacity * getDimFactor(isDimmed);
  return {
    transparent: isDimmed || baseOpacity < 1.0,
    opacity,
  };
}
