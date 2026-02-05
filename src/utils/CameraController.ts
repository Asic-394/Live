import { Camera, Vector3 } from 'three';
import gsap from 'gsap';
import type { WarehouseLayoutElement } from '../types';

export class CameraController {
  /**
   * Focus camera on a specific zone with smooth animation
   */
  static focusOnZone(
    camera: Camera,
    controls: any, // OrbitControls
    zone: WarehouseLayoutElement,
    duration: number = 1.5
  ): void {
    if (!camera || !controls || !zone) {
      console.warn('CameraController: Invalid parameters for focusOnZone');
      return;
    }

    const targetPosition = this.calculateZoneViewPosition(zone);
    const targetLookAt = new Vector3(zone.x, 0, zone.y);

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
   * Calculate optimal camera position to view a zone
   * Places camera at an angle that shows the zone well
   */
  static calculateZoneViewPosition(zone: WarehouseLayoutElement): Vector3 {
    // Calculate height based on zone size (larger zones need higher camera)
    const zoneSize = Math.max(zone.width, zone.depth);
    const height = zoneSize * 1.2;

    // Position camera at an angle (45 degrees from zone center)
    const offset = zoneSize * 0.8;
    
    return new Vector3(
      zone.x + offset,
      height,
      zone.y + offset
    );
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
