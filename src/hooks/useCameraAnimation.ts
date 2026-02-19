import { useEffect } from 'react';
import { useStore } from '../state/store';
import { CameraController } from '../utils/CameraController';

/**
 * Hook to handle camera animations when focusing on warehouse elements
 */
export function useCameraAnimation(controlsRef: React.MutableRefObject<any>) {
  const focusedZone = useStore((state) => state.focusedZone);
  const focusedElementType = useStore((state) => state.focusedElementType);
  const warehouseLayout = useStore((state) => state.warehouseLayout);

  useEffect(() => {
    if (!focusedZone || !controlsRef.current || !warehouseLayout) {
      return;
    }

    let element = null;
    const elementId = focusedZone;

    // Find the element based on its type
    if (focusedElementType === 'zone') {
      element = warehouseLayout.zones.find(z => z.element_id === elementId);
    } else if (focusedElementType === 'aisle') {
      element = warehouseLayout.aisles.find(a => a.element_id === elementId);
    } else if (focusedElementType === 'rack') {
      element = warehouseLayout.racks.find(r => r.element_id === elementId);
    } else {
      // Legacy support: if no type is specified, assume it's a zone
      element = warehouseLayout.zones.find(z => z.element_id === elementId);
    }

    if (!element) {
      console.warn(`Element not found: ${elementId} (type: ${focusedElementType})`);
      return;
    }

    // Animate camera to focus on the element
    CameraController.focusOnElement(
      controlsRef.current.object, // camera
      controlsRef.current,         // controls
      element,
      1.5                          // duration
    );
  }, [focusedZone, focusedElementType, warehouseLayout, controlsRef]);
}
