import { useStore } from '../../state/store';
import type { CameraMode } from '../../types';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import gsap from 'gsap';

interface ViewGizmoProps {
  controlsRef: React.RefObject<any>;
}

export default function ViewGizmo({ controlsRef }: ViewGizmoProps) {
  const cameraMode = useStore((state) => state.cameraMode);
  const setCameraMode = useStore((state) => state.setCameraMode);
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const theme = useStore((state) => state.theme);
  const leftSidebarCollapsed = useStore((state) => state.leftSidebarCollapsed);
  const [hoveredView, setHoveredView] = useState<string | null>(null);
  const [controlsReady, setControlsReady] = useState(false);

  // Track when controls become available (poll since refs don't trigger re-renders)
  useEffect(() => {
    const checkControls = () => {
      if (controlsRef?.current && !controlsReady) {
        setControlsReady(true);
      }
    };

    // Check immediately
    checkControls();

    // Poll every 100ms until controls are ready
    const interval = setInterval(checkControls, 100);

    return () => clearInterval(interval);
  }, [controlsRef, controlsReady]);

  const handleCameraMode = (mode: CameraMode) => {
    setCameraMode(mode);
  };

  const animateCamera = (position: THREE.Vector3, lookAt: THREE.Vector3, zoom?: number) => {
    if (!controlsRef.current || !warehouseLayout) return;
    
    const camera = controlsRef.current.object;
    const controls = controlsRef.current;

    gsap.to(camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    });

    gsap.to(controls.target, {
      x: lookAt.x,
      y: lookAt.y,
      z: lookAt.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    });

    // Handle orthographic zoom
    if (zoom !== undefined && cameraMode === 'orthographic' && 'zoom' in camera) {
      gsap.to(camera, {
        zoom: zoom,
        duration: 1.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.updateProjectionMatrix();
          controls.update();
        },
      });
    }
  };

  const handleViewPreset = (view: string) => {
    if (!warehouseLayout) return;

    const bounds = warehouseLayout.bounds;
    const center = new THREE.Vector3(
      (bounds.minX + bounds.maxX) / 2,
      0,
      (bounds.minZ + bounds.maxZ) / 2
    );
    const size = Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxZ - bounds.minZ,
      bounds.maxY - bounds.minY
    );

    const distance = size * 2;

    switch (view) {
      case 'map':
        // Map view - Top-down orthographic
        // Switch to orthographic if not already
        if (cameraMode !== 'orthographic') {
          setCameraMode('orthographic');
          // Delay animation to allow camera mode to switch
          setTimeout(() => {
            animateCamera(
              new THREE.Vector3(center.x, distance, center.z),
              center,
              2.5
            );
          }, 100);
        } else {
          animateCamera(
            new THREE.Vector3(center.x, distance, center.z),
            center,
            2.5
          );
        }
        break;

      case 'birds-eye':
        // Isometric-style birds eye view
        animateCamera(
          new THREE.Vector3(
            center.x + distance * 0.7,
            distance * 1.2,
            center.z + distance * 0.7
          ),
          center,
          cameraMode === 'orthographic' ? 2.0 : undefined
        );
        break;
    }
  };

  // Separate the gizmo and controls into two containers
  // Position gizmo 16px from top navigation (104px + 16px = 120px) 
  // and 16px from left sidebar edge (48px or 400px + 16px)
  const leftOffset = leftSidebarCollapsed ? 48 + 16 : 400 + 16; // 64px or 416px
  
  const gizmoUI = (
    <>
      {/* 3D Orientation Gizmo - Top Left of Canvas */}
      <div 
        className="transition-all duration-300"
        style={{ 
          position: 'fixed',
          top: '120px', // 104px nav + 16px spacing
          left: `${leftOffset}px`,
          zIndex: 99999,
          isolation: 'isolate', 
          pointerEvents: 'auto'
        }}
      >
        <OrientationCube controlsRef={controlsRef} />
      </div>

      {/* View Controls - Bottom Right */}
      <div 
        className="fixed bottom-6 right-6 flex flex-col gap-3" 
        style={{ 
          zIndex: 99999,
          isolation: 'isolate', 
          pointerEvents: 'auto',
          position: 'fixed',
          bottom: '24px',
          right: '24px'
        }}
      >
        <div 
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: theme === 'dark' ? '#16181f' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            minWidth: '160px',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* View Presets */}
          <div className="p-2">
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => handleViewPreset('map')}
                onMouseEnter={() => setHoveredView('map')}
                onMouseLeave={() => setHoveredView(null)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: hoveredView === 'map' 
                    ? '#3b82f6' 
                    : theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: hoveredView === 'map' 
                    ? 'white' 
                    : theme === 'dark' ? 'rgba(209, 213, 219, 1)' : 'rgba(55, 65, 81, 1)'
                }}
              >
                <span className="text-sm">🗺️</span>
                <span>Map View</span>
              </button>
              
              <button
                onClick={() => handleViewPreset('birds-eye')}
                onMouseEnter={() => setHoveredView('birds-eye')}
                onMouseLeave={() => setHoveredView(null)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: hoveredView === 'birds-eye' 
                    ? '#3b82f6' 
                    : theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: hoveredView === 'birds-eye' 
                    ? 'white' 
                    : theme === 'dark' ? 'rgba(209, 213, 219, 1)' : 'rgba(55, 65, 81, 1)'
                }}
              >
                <span className="text-sm">🦅</span>
                <span>Birds Eye</span>
              </button>
            </div>
          </div>

          {/* Camera Mode Toggle */}
          <div 
            className="p-2 border-t"
            style={{ borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
          >
            <div className="flex gap-1">
              <button
                onClick={() => handleCameraMode('orthographic')}
                className="flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all"
                style={{
                  backgroundColor: cameraMode === 'orthographic' 
                    ? '#3b82f6' 
                    : theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: cameraMode === 'orthographic' 
                    ? 'white' 
                    : theme === 'dark' ? 'rgba(156, 163, 175, 1)' : 'rgba(75, 85, 99, 1)'
                }}
                title="Orthographic projection"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <rect x="4" y="4" width="16" height="16" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                <span className="text-[10px] mt-1">Ortho</span>
              </button>
              
              <button
                onClick={() => handleCameraMode('perspective')}
                className="flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all"
                style={{
                  backgroundColor: cameraMode === 'perspective' 
                    ? '#3b82f6' 
                    : theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: cameraMode === 'perspective' 
                    ? 'white' 
                    : theme === 'dark' ? 'rgba(156, 163, 175, 1)' : 'rgba(75, 85, 99, 1)'
                }}
                title="Perspective projection"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
                  <line x1="12" y1="12" x2="21" y2="7" />
                  <line x1="12" y1="12" x2="3" y2="7" />
                </svg>
                <span className="text-[10px] mt-1">Persp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(gizmoUI, document.body);
}

interface OrientationCubeProps {
  controlsRef: React.RefObject<any>;
}

function OrientationCube({ controlsRef }: OrientationCubeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 80;
    canvas.width = size;
    canvas.height = size;

    let animationFrameId: number;

    const animate = () => {
      // Always draw something, even if controls not ready
      if (!controlsRef.current?.object) {
        // Draw a simple placeholder when controls aren't ready
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('...', size / 2, size / 2);
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const camera = controlsRef.current.object;
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw axes based on camera orientation
      const center = { x: size / 2, y: size / 2 };
      const axisLength = 25;

      // Calculate 2D projections of axes
      const axes = [
        { dir: new THREE.Vector3(1, 0, 0), color: '#ef4444', label: 'X' }, // Red
        { dir: new THREE.Vector3(0, 1, 0), color: '#22c55e', label: 'Y' }, // Green
        { dir: new THREE.Vector3(0, 0, 1), color: '#3b82f6', label: 'Z' }, // Blue
      ];

      // Transform axes by camera rotation
      const quaternion = camera.quaternion.clone().invert();
      const sortedAxes = axes.map(axis => {
        const dir = axis.dir.clone().applyQuaternion(quaternion);
        const x = center.x + dir.x * axisLength;
        const y = center.y - dir.y * axisLength;
        const z = dir.z;
        return { ...axis, x, y, z };
      }).sort((a, b) => a.z - b.z); // Draw back to front

      // Draw axes
      sortedAxes.forEach(axis => {
        const alpha = axis.z < 0 ? 0.3 : 1.0;
        
        ctx.strokeStyle = axis.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(axis.x, axis.y);
        ctx.stroke();

        // Draw label
        ctx.fillStyle = axis.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(axis.label, axis.x, axis.y);
      });

      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [controlsRef, theme]);

  return (
    <div 
      className="flex items-center justify-center rounded-lg"
    >
      <canvas
        ref={canvasRef}
        className="w-20 h-20"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
}
