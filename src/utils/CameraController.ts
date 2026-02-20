import { Camera, Vector3 } from 'three';
import gsap from 'gsap';
import type { WarehouseLayoutElement } from '../types';
import { CoordinateMapper } from './coordinates';

export class CameraController {
  /**
   * Focus camera on a specific element with smooth animation
   * Works with zones, aisles, racks, and any warehouse layout element
   */
  static focusOnElement(
    camera: Camera,
    controls: any, // OrbitControls
    element: WarehouseLayoutElement,
    duration: number = 1.5
  ): void {
    if (!camera || !controls || !element) {
      console.warn('CameraController: Invalid parameters for focusOnElement');
      return;
    }

    const targetPosition = this.calculateElementViewPosition(element);
    // Convert CSV coordinates to Three.js coordinates for the look-at target
    const threeCoords = CoordinateMapper.csvToThree(element.x, element.y, 0);
    const targetLookAt = new Vector3(threeCoords.x, 0, threeCoords.z);

    // Animate camera position
    gsap.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (controls.update) {
          controls.update();
        }
      }
    });

    // Animate controls target (what camera is looking at)
    gsap.to(controls.target, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (controls.update) {
          controls.update();
        }
      }
    });
  }

  /**
   * Focus camera on a specific zone with smooth animation
   * @deprecated Use focusOnElement instead
   */
  static focusOnZone(
    camera: Camera,
    controls: any,
    zone: WarehouseLayoutElement,
    duration: number = 1.5
  ): void {
    this.focusOnElement(camera, controls, zone, duration);
  }

  /**
   * Calculate optimal camera position to view an element
   * Places camera at an angle that shows the element well
   */
  static calculateElementViewPosition(element: WarehouseLayoutElement): Vector3 {
    // Convert CSV coordinates to Three.js coordinates
    const threeCoords = CoordinateMapper.csvToThree(element.x, element.y, element.z || 0);
    
    // Calculate height based on element size (larger elements need higher camera)
    const elementSize = Math.max(element.width, element.depth);
    
    // Adjust camera distance based on element type
    let heightMultiplier = 1.2;
    let offsetMultiplier = 0.8;
    
    switch (element.element_type) {
      case 'rack':
        // Get closer to racks for better view
        heightMultiplier = 0.6;
        offsetMultiplier = 0.4;
        break;
      case 'aisle':
        // Medium distance for aisles
        heightMultiplier = 0.9;
        offsetMultiplier = 0.6;
        break;
      case 'zone':
        // Farther out for zones
        heightMultiplier = 1.2;
        offsetMultiplier = 0.8;
        break;
      default:
        // Default medium distance
        heightMultiplier = 0.8;
        offsetMultiplier = 0.6;
    }

    const height = elementSize * heightMultiplier;
    const offset = elementSize * offsetMultiplier;
    
    // Position camera at an angle in Three.js coordinates
    return new Vector3(
      threeCoords.x + offset,
      height,
      threeCoords.z + offset
    );
  }

  /**
   * Calculate optimal camera position to view a zone
   * @deprecated Use calculateElementViewPosition instead
   */
  static calculateZoneViewPosition(zone: WarehouseLayoutElement): Vector3 {
    return this.calculateElementViewPosition(zone);
  }

  /**
   * Reset camera to initial birds-eye view
   */
  static resetCamera(
    camera: Camera,
    controls: any,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    duration: number = 1.0
  ): void {
    if (!camera || !controls) {
      return;
    }

    // Calculate center of warehouse
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Calculate size of warehouse
    const sizeX = bounds.maxX - bounds.minX;
    const sizeY = bounds.maxY - bounds.minY;
    const maxSize = Math.max(sizeX, sizeY);

    // Position camera to see entire warehouse
    const height = maxSize * 1.2;
    const offset = maxSize * 0.3;

    gsap.to(camera.position, {
      x: centerX + offset,
      y: height,
      z: centerY + offset,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (controls.update) {
          controls.update();
        }
      }
    });

    gsap.to(controls.target, {
      x: centerX,
      y: 0,
      z: centerY,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (controls.update) {
          controls.update();
        }
      }
    });
  }
}
