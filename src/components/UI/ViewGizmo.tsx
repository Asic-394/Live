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

  // Normalized isometric camera direction (0.7, 1.2, 0.7) → length ≈ 1.556
  const ISO_DIR = new THREE.Vector3(0.7, 1.2, 0.7).normalize();

  const fitOrthographicZoom = () => {
    if (!warehouseLayout) return 1;
    const bounds = warehouseLayout.bounds;
    const w = bounds.maxX - bounds.minX;
    const d = bounds.maxZ - bounds.minZ;
    const camera = controlsRef.current?.object;
    if (!camera || !('isOrthographicCamera' in camera)) return 1;
    // Frustum extents at zoom=1
    const frustumW = (camera as THREE.OrthographicCamera).right - (camera as THREE.OrthographicCamera).left;
    const frustumH = (camera as THREE.OrthographicCamera).top - (camera as THREE.OrthographicCamera).bottom;
    // Fit with ~15% padding
    return Math.min(frustumW / (w * 1.15), frustumH / (d * 1.15));
  };

  const fitIsometricDistance = () => {
    if (!warehouseLayout) return 50;
    const bounds = warehouseLayout.bounds;
    const w = bounds.maxX - bounds.minX;
    const d = bounds.maxZ - bounds.minZ;
    const footprintDiag = Math.sqrt(w * w + d * d);
    const camera = controlsRef.current?.object;
    const vFov = ((camera?.fov || 60) * Math.PI) / 180;
    // ~15% padding around the footprint
    return (footprintDiag * 0.65) / Math.tan(vFov / 2);
  };

  const handleSwitch3D = () => {
    if (!warehouseLayout) return;
    const bounds = warehouseLayout.bounds;
    const center = new THREE.Vector3(
      (bounds.minX + bounds.maxX) / 2,
      0,
      (bounds.minZ + bounds.maxZ) / 2
    );
    const fitDist = fitIsometricDistance();
    const camPos = center.clone().addScaledVector(ISO_DIR, fitDist);
    if (cameraMode !== 'perspective') {
      setCameraMode('perspective');
      setTimeout(() => animateCamera(camPos, center), 100);
    } else {
      animateCamera(camPos, center);
    }
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
    const distance = size * 2; // used by map view for top-down height

    switch (view) {
      case 'map':
        // Map view - Top-down orthographic
        if (cameraMode !== 'orthographic') {
          setCameraMode('orthographic');
          // Delay to allow orthographic camera to initialise before reading its frustum
          setTimeout(() => {
            animateCamera(
              new THREE.Vector3(center.x, distance, center.z),
              center,
              fitOrthographicZoom()
            );
          }, 100);
        } else {
          animateCamera(
            new THREE.Vector3(center.x, distance, center.z),
            center,
            fitOrthographicZoom()
          );
        }
        break;

      case 'birds-eye': {
        // Fit the warehouse footprint snugly in view
        const fitDist = fitIsometricDistance();
        const camPos = center.clone().addScaledVector(ISO_DIR, fitDist);
        animateCamera(
          camPos,
          center,
          cameraMode === 'orthographic' ? 2.0 : undefined
        );
        break;
      }
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
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          isolation: 'isolate',
          pointerEvents: 'auto',
        }}
      >
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: theme === 'dark' ? '#16181f' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            width: '148px',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* 2D / 3D View Toggle */}
          <div className="p-1.5">
            <div
              className="flex rounded-lg p-0.5"
              style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            >
              <button
                onClick={() => handleViewPreset('map')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: cameraMode === 'orthographic' ? '#3b82f6' : 'transparent',
                  color: cameraMode === 'orthographic'
                    ? 'white'
                    : theme === 'dark' ? 'rgba(156,163,175,1)' : 'rgba(75,85,99,1)',
                }}
                title="2D map view"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="1" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                2D
              </button>
              <button
                onClick={handleSwitch3D}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: cameraMode === 'perspective' ? '#3b82f6' : 'transparent',
                  color: cameraMode === 'perspective'
                    ? 'white'
                    : theme === 'dark' ? 'rgba(156,163,175,1)' : 'rgba(75,85,99,1)',
                }}
                title="3D view"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                3D
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

          {/* Ortho / Persp Projection Toggle */}
          <div className="p-1.5">
            <div
              className="flex rounded-lg p-0.5"
              style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            >
              <button
                onClick={() => handleCameraMode('orthographic')}
                className="flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: cameraMode === 'orthographic' ? '#3b82f6' : 'transparent',
                  color: cameraMode === 'orthographic'
                    ? 'white'
                    : theme === 'dark' ? 'rgba(156,163,175,1)' : 'rgba(75,85,99,1)',
                }}
                title="Orthographic projection"
              >
                Ortho
              </button>
              <button
                onClick={() => handleCameraMode('perspective')}
                className="flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: cameraMode === 'perspective' ? '#3b82f6' : 'transparent',
                  color: cameraMode === 'perspective'
                    ? 'white'
                    : theme === 'dark' ? 'rgba(156,163,175,1)' : 'rgba(75,85,99,1)',
                }}
                title="Perspective projection"
              >
                Persp
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

          {/* Fit / Zoom Extents */}
          <div className="p-1.5">
            <button
              onClick={() => handleViewPreset('birds-eye')}
              onMouseEnter={() => setHoveredView('fit')}
              onMouseLeave={() => setHoveredView(null)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: hoveredView === 'fit'
                  ? '#3b82f6'
                  : theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: hoveredView === 'fit'
                  ? 'white'
                  : theme === 'dark' ? 'rgba(156,163,175,1)' : 'rgba(75,85,99,1)',
              }}
              title="Fit view to extents"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              Fit View
            </button>
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
