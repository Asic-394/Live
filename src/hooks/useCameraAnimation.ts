import { useEffect } from 'react';
import { useStore } from '../state/store';
import { CameraController } from '../utils/CameraController';

/**
 * Hook to handle camera animations when focusing on zones
 */
export function useCameraAnimation(controlsRef: React.MutableRefObject<any>) {
  const focusedZone = useStore((state) => state.focusedZone);
  const warehouseLayout = useStore((state) => state.warehouseLayout);

  useEffect(() => {
    if (!focusedZone || !controlsRef.current || !warehouseLayout) {
      return;
    }

    const zone = warehouseLayout.zones.find(z => z.element_id === focusedZone);
    if (!zone) {
      console.warn(`Zone not found: ${focusedZone}`);
      return;
    }

    // Animate camera to focus on the zone
    CameraController.focusOnZone(
      controlsRef.current.object, // camera
      controlsRef.current,         // controls
      zone,
      1.5                          // duration
    );
  }, [focusedZone, warehouseLayout, controlsRef]);
}
