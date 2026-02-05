import * as THREE from 'three';

/**
 * Centralized geometry pool for reusing geometries across the scene
 * Reduces memory overhead and improves performance
 */
class GeometryPoolClass {
  private geometries: Map<string, THREE.BufferGeometry>;

  constructor() {
    this.geometries = new Map();
  }

  /**
   * Get or create a box geometry
   */
  getBox(width: number, height: number, depth: number): THREE.BufferGeometry {
    const key = `box_${width}_${height}_${depth}`;
    
    if (!this.geometries.has(key)) {
      this.geometries.set(key, new THREE.BoxGeometry(width, height, depth));
    }
    
    return this.geometries.get(key)!;
  }

  /**
   * Get or create a cylinder geometry
   */
  getCylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number = 8
  ): THREE.BufferGeometry {
    const key = `cylinder_${radiusTop}_${radiusBottom}_${height}_${radialSegments}`;
    
    if (!this.geometries.has(key)) {
      this.geometries.set(
        key,
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
      );
    }
    
    return this.geometries.get(key)!;
  }

  /**
   * Get or create a plane geometry
   */
  getPlane(width: number, height: number): THREE.BufferGeometry {
    const key = `plane_${width}_${height}`;
    
    if (!this.geometries.has(key)) {
      this.geometries.set(key, new THREE.PlaneGeometry(width, height));
    }
    
    return this.geometries.get(key)!;
  }

  /**
   * Get or create a sphere geometry
   */
  getSphere(
    radius: number,
    widthSegments: number = 16,
    heightSegments: number = 12
  ): THREE.BufferGeometry {
    const key = `sphere_${radius}_${widthSegments}_${heightSegments}`;
    
    if (!this.geometries.has(key)) {
      this.geometries.set(
        key,
        new THREE.SphereGeometry(radius, widthSegments, heightSegments)
      );
    }
    
    return this.geometries.get(key)!;
  }

  /**
   * Dispose all cached geometries
   */
  dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.geometries.clear();
  }

  /**
   * Get stats about cached geometries
   */
  getStats(): { count: number; keys: string[] } {
    return {
      count: this.geometries.size,
      keys: Array.from(this.geometries.keys()),
    };
  }
}

// Singleton instance
export const GeometryPool = new GeometryPoolClass();
