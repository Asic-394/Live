/**
 * Material utility functions for consistent visual styling across the warehouse scene
 * Centralizes color definitions and material properties for easier maintenance
 */

import type { MeshStandardMaterialParameters } from 'three';

/**
 * Theme colors aligned with Tailwind config
 */
export const THEME_COLORS = {
  // Floor and base
  floorBase: '#2a2c30',     // Lighter charcoal, not black
  floorGrid: '#3a3e44',     // More visible subtle grid
  
  // Walls and structure
  wallMain: '#6a6c70',
  wallTrim: '#0d0f12',
  
  // Racks (monochrome palette)
  rackDefault: '#6a6e75',
  rackHover: '#9a9ea5',
  rackSelected: '#00D9FF', // accent cyan
  
  // Boxes (neutral grey palette)
  boxLight: '#8a8e93',      // Light neutral grey
  boxMedium: '#6a6e75',     // Medium grey, matches rack
  boxDark: '#4a4e55',       // Dark grey
  boxBase: '#5a5e65',       // Base grey
  
  // Zones (more saturated for outlines)
  zoneReceiving: '#5a8a6a',
  zoneStorage: '#6a6a8c',
  zonePicking: '#8c6a5d',
  zoneStaging: '#6a8a5d',
  zoneDefault: '#4a7a9c',
  
  // Docks
  dockReceiving: '#4a9a7a',
  dockShipping: '#7a9a4a',
  
  // Scene
  sceneBackground: '#1a1d22',
  
  // Accent
  accentCyan: '#22d3ee',
} as const;

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
