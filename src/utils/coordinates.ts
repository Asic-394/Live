import type { Vector3 } from '../types';

/**
 * Coordinate conversion utilities for mapping between CSV coordinates and Three.js scene
 * 
 * CSV Format:
 * - x, y: ground plane coordinates (in feet)
 * - z: vertical height (optional, defaults to 0)
 * 
 * Three.js Scene:
 * - x: east-west (same as CSV x)
 * - y: vertical (up, maps to CSV z)
 * - z: north-south (maps to CSV y, but inverted for correct orientation)
 */

export class CoordinateMapper {
  /**
   * Convert CSV coordinates (x, y, z) to Three.js coordinates
   * CSV: x=east, y=north, z=up
   * Three.js: x=east, y=up, z=south (negative north for correct camera view)
   */
  static csvToThree(csvX: number, csvY: number, csvZ: number = 0): Vector3 {
    return {
      x: csvX,
      y: csvZ, // CSV z (height) becomes Three.js y (up axis)
      z: -csvY, // CSV y (north) becomes negative Three.js z (for correct orientation)
    };
  }

  /**
   * Convert Three.js coordinates back to CSV coordinates (if needed)
   */
  static threeToCsv(threeX: number, threeY: number, threeZ: number): Vector3 {
    return {
      x: threeX,
      y: -threeZ, // Three.js z becomes CSV y (with sign flip)
      z: threeY, // Three.js y becomes CSV z (height)
    };
  }

  /**
   * Calculate center point of a rectangular area
   */
  static calculateCenter(x: number, y: number, _width: number, _depth: number): Vector3 {
    return this.csvToThree(x, y, 0);
  }

  /**
   * Calculate bounding box from layout elements
   */
  static calculateBounds(elements: Array<{ x: number; y: number; z?: number; width: number; depth: number }>) {
    if (elements.length === 0) {
      return {
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
        minZ: 0,
        maxZ: 20,
      };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = 0;
    let maxZ = 0;

    elements.forEach((el) => {
      const x1 = el.x - el.width / 2;
      const x2 = el.x + el.width / 2;
      const y1 = el.y - el.depth / 2;
      const y2 = el.y + el.depth / 2;

      minX = Math.min(minX, x1);
      maxX = Math.max(maxX, x2);
      minY = Math.min(minY, y1);
      maxY = Math.max(maxY, y2);

      if (el.z !== undefined) {
        maxZ = Math.max(maxZ, el.z);
      }
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  /**
   * Calculate optimal camera position for viewing the entire warehouse
   */
  static calculateCameraPosition(bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  }): { position: Vector3; target: Vector3 } {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    const width = bounds.maxX - bounds.minX;
    const depth = bounds.maxY - bounds.minY;
    const maxDim = Math.max(width, depth);

    // Position camera at 45-degree angle, elevated
    const distance = maxDim * 1.2;
    const height = distance * 0.7;

    const centerThree = this.csvToThree(centerX, centerY, centerZ);

    return {
      position: {
        x: centerThree.x,
        y: height,
        z: centerThree.z + distance * 0.7,
      },
      target: centerThree,
    };
  }

  /**
   * Calculate camera position to focus on a specific rack
   */
  static calculateRackFocusPosition(
    rackX: number,
    rackY: number,
    rackZ: number,
    rackWidth: number,
    rackDepth: number,
    rackHeight: number
  ): { position: Vector3; target: Vector3 } {
    const rackThree = this.csvToThree(rackX, rackY, rackZ);
    const targetHeight = rackHeight / 2;
    
    // Calculate distance based on rack size to fit it nicely in view
    const maxDim = Math.max(rackWidth, rackDepth, rackHeight);
    const distance = maxDim * 2.5;
    
    // Position camera at 45-degree angle, slightly elevated
    const cameraHeight = targetHeight + distance * 0.5;
    
    return {
      position: {
        x: rackThree.x + distance * 0.4,
        y: cameraHeight,
        z: rackThree.z + distance * 0.6,
      },
      target: {
        x: rackThree.x,
        y: targetHeight,
        z: rackThree.z,
      },
    };
  }
}
