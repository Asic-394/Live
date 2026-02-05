import * as THREE from 'three';

/**
 * Material configuration for creating pooled materials
 */
interface MaterialConfig {
  color: string | number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: string | number;
  emissiveIntensity?: number;
}

/**
 * Centralized material pool for reusing materials across the scene
 * Reduces memory overhead and improves performance
 */
class MaterialPoolClass {
  private materials: Map<string, THREE.MeshStandardMaterial>;

  constructor() {
    this.materials = new Map();
  }

  /**
   * Get or create a standard material with the given configuration
   */
  getStandardMaterial(config: MaterialConfig): THREE.MeshStandardMaterial {
    const key = this.getMaterialKey(config);
    
    if (!this.materials.has(key)) {
      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness ?? 0.7,
        metalness: config.metalness ?? 0.1,
        transparent: config.transparent ?? false,
        opacity: config.opacity ?? 1.0,
        emissive: config.emissive ?? '#000000',
        emissiveIntensity: config.emissiveIntensity ?? 0,
      });
      
      this.materials.set(key, material);
    }
    
    return this.materials.get(key)!;
  }

  /**
   * Create a unique key for material configuration
   */
  private getMaterialKey(config: MaterialConfig): string {
    const parts = [
      `c_${config.color}`,
      `r_${config.roughness ?? 0.7}`,
      `m_${config.metalness ?? 0.1}`,
      `t_${config.transparent ?? false}`,
      `o_${config.opacity ?? 1.0}`,
      `e_${config.emissive ?? '#000000'}`,
      `ei_${config.emissiveIntensity ?? 0}`,
    ];
    return parts.join('_');
  }

  /**
   * Update an existing material's properties
   * Returns the material for chaining
   */
  updateMaterial(
    material: THREE.MeshStandardMaterial,
    updates: Partial<MaterialConfig>
  ): THREE.MeshStandardMaterial {
    if (updates.color !== undefined) material.color.set(updates.color);
    if (updates.roughness !== undefined) material.roughness = updates.roughness;
    if (updates.metalness !== undefined) material.metalness = updates.metalness;
    if (updates.transparent !== undefined) material.transparent = updates.transparent;
    if (updates.opacity !== undefined) material.opacity = updates.opacity;
    if (updates.emissive !== undefined) material.emissive.set(updates.emissive);
    if (updates.emissiveIntensity !== undefined) {
      material.emissiveIntensity = updates.emissiveIntensity;
    }
    
    material.needsUpdate = true;
    return material;
  }

  /**
   * Clone a material for independent modifications
   */
  cloneMaterial(material: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
    return material.clone();
  }

  /**
   * Dispose all cached materials
   */
  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }

  /**
   * Get stats about cached materials
   */
  getStats(): { count: number; keys: string[] } {
    return {
      count: this.materials.size,
      keys: Array.from(this.materials.keys()),
    };
  }
}

// Singleton instance
export const MaterialPool = new MaterialPoolClass();
