import { Color } from 'three';
import type { OverlayType } from '../types';

export interface ColorStop {
  value: number;
  color: string;
}

export type ColorScale = ColorStop[];

/**
 * Predefined color scales for different overlay types
 */
export const COLOR_SCALES: Record<OverlayType, ColorScale> = {
  heat_congestion: [
    { value: 0.0, color: '#4caf50' }, // green - low congestion
    { value: 0.5, color: '#ffeb3b' }, // yellow - moderate
    { value: 0.75, color: '#ff9800' }, // orange - high
    { value: 1.0, color: '#f44336' }  // red - critical
  ],
  heat_utilization: [
    { value: 0.0, color: '#2196f3' }, // blue - underutilized
    { value: 0.5, color: '#4caf50' }, // green - optimal
    { value: 0.75, color: '#ff9800' }, // orange - high
    { value: 1.0, color: '#f44336' }  // red - overutilized
  ],
  heat_throughput: [
    { value: 0.0, color: '#f44336' }, // red - low throughput
    { value: 0.5, color: '#ffeb3b' }, // yellow - moderate
    { value: 1.0, color: '#4caf50' }  // green - high throughput
  ]
};

/**
 * Interpolate between colors in a color scale based on intensity value (0-1)
 */
export function interpolateColor(colorScale: ColorScale, intensity: number): string {
  // Clamp intensity to [0, 1]
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  // Find the two color stops to interpolate between
  let lowerStop = colorScale[0];
  let upperStop = colorScale[colorScale.length - 1];

  for (let i = 0; i < colorScale.length - 1; i++) {
    if (clampedIntensity >= colorScale[i].value && clampedIntensity <= colorScale[i + 1].value) {
      lowerStop = colorScale[i];
      upperStop = colorScale[i + 1];
      break;
    }
  }

  // If intensity is exactly at a stop, return that color
  if (clampedIntensity === lowerStop.value) {
    return lowerStop.color;
  }
  if (clampedIntensity === upperStop.value) {
    return upperStop.color;
  }

  // Calculate interpolation factor
  const range = upperStop.value - lowerStop.value;
  const factor = (clampedIntensity - lowerStop.value) / range;

  // Parse hex colors
  const lowerColor = hexToRgb(lowerStop.color);
  const upperColor = hexToRgb(upperStop.color);

  if (!lowerColor || !upperColor) {
    return lowerStop.color;
  }

  // Interpolate RGB values
  const r = Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * factor);
  const g = Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * factor);
  const b = Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * factor);

  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB values to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Get discrete color based on intensity thresholds (no interpolation)
 */
export function getDiscreteColor(colorScale: ColorScale, intensity: number): string {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  
  for (let i = colorScale.length - 1; i >= 0; i--) {
    if (clampedIntensity >= colorScale[i].value) {
      return colorScale[i].color;
    }
  }
  
  return colorScale[0].color;
}

/**
 * Get the color scale for a specific overlay type
 */
export function getColorScaleForOverlay(overlayType: OverlayType): ColorScale {
  return COLOR_SCALES[overlayType] || COLOR_SCALES.heat_congestion;
}

/**
 * Create a Three.js Color object from intensity and color scale
 */
export function getThreeColorFromIntensity(
  intensity: number,
  overlayType: OverlayType
): Color {
  const colorScale = getColorScaleForOverlay(overlayType);
  const hexColor = interpolateColor(colorScale, intensity);
  return new Color(hexColor);
}
