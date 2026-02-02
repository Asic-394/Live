import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useStore } from '../../state/store';
import { CoordinateMapper } from '../../utils/coordinates';
import WarehouseLayout from './WarehouseLayout';
import EntityRenderer from './EntityRenderer';
import { useEffect, useRef } from 'react';

interface WarehouseSceneProps {
  controlsRef?: React.RefObject<any>;
}

export default function WarehouseScene({ controlsRef: externalControlsRef }: WarehouseSceneProps = {}) {
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const entities = useStore((state) => state.entities);
  const cameraReset = useStore((state) => state.cameraReset);
  const loadingState = useStore((state) => state.loadingState);
  const cameraMode = useStore((state) => state.cameraMode);
  const selectedRack = useStore((state) => state.selectedRack);
  const selectEntity = useStore((state) => state.selectEntity);
  const selectRack = useStore((state) => state.selectRack);
  
  const internalControlsRef = useRef<any>(null);
  const controlsRef = externalControlsRef || internalControlsRef;

  // Handle background clicks to deselect
  const handleBackgroundClick = () => {
    selectEntity(null);
    selectRack(null);
  };

  // Reset camera when dataset changes
  useEffect(() => {
    if (warehouseLayout && controlsRef.current && cameraReset > 0) {
      const { position, target } = CoordinateMapper.calculateCameraPosition(warehouseLayout.bounds);
      
      // Smoothly animate to new camera position using GSAP
      if (controlsRef.current.object) {
        const camera = controlsRef.current.object;
        const controls = controlsRef.current;
        
        // Animate camera position
        gsap.to(camera.position, {
          x: position.x,
          y: position.y,
          z: position.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => controls.update(),
        });
        
        // Animate target
        gsap.to(controls.target, {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => controls.update(),
        });
      }
    }
  }, [warehouseLayout, cameraReset]);

  // Focus camera on selected rack with smooth animation from current angle
  useEffect(() => {
    if (!controlsRef.current || !controlsRef.current.object) return;
    
    const camera = controlsRef.current.object;
    const controls = controlsRef.current;
    
    // Reset orthographic zoom when rack is deselected (luxurious feel)
    if (!selectedRack && cameraMode === 'orthographic' && 'zoom' in camera) {
      gsap.to(camera, {
        zoom: 2.5, // Default zoom level
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          camera.updateProjectionMatrix();
          controls.update();
        },
      });
      return;
    }
    
    if (selectedRack && warehouseLayout && controlsRef.current) {
      const rack = warehouseLayout.racks.find((r) => r.element_id === selectedRack);
      if (rack && controlsRef.current.object) {
        const camera = controlsRef.current.object;
        const controls = controlsRef.current;
        
        // Calculate rack center in Three.js coordinates
        const rackHeight = rack.height || 18;
        const rackCenterCoords = CoordinateMapper.csvToThree(rack.x, rack.y, rack.z || 0);
        const rackCenter = new THREE.Vector3(rackCenterCoords.x, rackHeight / 2, rackCenterCoords.z);
        
        // Get current camera position and direction to rack
        const currentPos = camera.position.clone();
        const directionToRack = new THREE.Vector3()
          .subVectors(rackCenter, currentPos)
          .normalize();
        
        // Calculate zoom distance based on rack size
        const maxDim = Math.max(rack.width, rack.depth, rackHeight);
        // In orthographic mode, keep camera further to avoid clipping
        const zoomDistance = cameraMode === 'orthographic' 
          ? maxDim * 4.0  // Further away for orthographic
          : maxDim * 2.5; // Closer for perspective
        
        // New camera position: zoom in from current angle
        const newPosition = new THREE.Vector3()
          .copy(rackCenter)
          .sub(directionToRack.multiplyScalar(zoomDistance));
        
        // Smoothly animate camera position to zoom in from current angle (luxurious feel)
        gsap.to(camera.position, {
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => controls.update(),
        });
        
        // Smoothly animate target to rack center
        gsap.to(controls.target, {
          x: rackCenter.x,
          y: rackCenter.y,
          z: rackCenter.z,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => controls.update(),
        });
        
        // For orthographic cameras, also animate the zoom property
        if (cameraMode === 'orthographic' && 'zoom' in camera) {
          // Calculate appropriate zoom level based on rack size
          // Higher multiplier = more zoom in
          const targetZoom = 100 / maxDim; // Increased from 50 for better zoom
          
          gsap.to(camera, {
            zoom: targetZoom,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
              camera.updateProjectionMatrix();
              controls.update();
            },
          });
        }
      }
    }
  }, [selectedRack, warehouseLayout, cameraMode]);

  if (loadingState === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading warehouse...</div>
      </div>
    );
  }

  if (!warehouseLayout || entities.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-xl">No data loaded</div>
      </div>
    );
  }

  const { position, target } = CoordinateMapper.calculateCameraPosition(warehouseLayout.bounds);

  // Camera configuration based on mode
  const cameraConfig = cameraMode === 'orthographic' 
    ? {
        orthographic: true,
        camera: {
          position: [position.x, position.y, position.z] as [number, number, number],
          zoom: 2.5,
          near: 0.1,
          far: 2000,
        }
      }
    : {
        camera: {
          position: [position.x, position.y, position.z] as [number, number, number],
          fov: 50,
          near: 0.1,
          far: 2000,
        }
      };

  return (
    <Canvas
      key={cameraMode} // Force remount when camera mode changes
      shadows
      {...cameraConfig}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#1a1d22');
      }}
    >
      {/* Low ambient for depth and grounding */}
      <ambientLight intensity={0.45} color="#e0e6ed" />

      {/* Main key light - cool temperature without expensive shadows */}
      <directionalLight 
        position={[50, 100, 40]} 
        intensity={1.2} 
        color="#e0e6ed"
      />

      {/* Fill light with warm temperature */}
      <directionalLight 
        position={[-40, 80, -30]} 
        intensity={0.8} 
        color="#ede8e0"
      />

      {/* Soft overhead spotlight for grounding */}
      <spotLight
        position={[0, 150, 0]}
        angle={Math.PI / 3}
        penumbra={0.8}
        intensity={0.6}
        color="#e8eaed"
        castShadow={false}
      />

      {/* Subtle hemisphere for ambient */}
      <hemisphereLight 
        color="#ffffff" 
        groundColor="#8a8e94" 
        intensity={0.4} 
      />

      {/* World floor - darker base layer */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.2, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial 
          color="#1a1c1f"
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* Warehouse floor - charcoal base */}
      {warehouseLayout && (() => {
        const boundsWidth = warehouseLayout.bounds.maxX - warehouseLayout.bounds.minX;
        const boundsDepth = warehouseLayout.bounds.maxY - warehouseLayout.bounds.minY;
        const centerX = (warehouseLayout.bounds.minX + warehouseLayout.bounds.maxX) / 2;
        const centerZ = -(warehouseLayout.bounds.minY + warehouseLayout.bounds.maxY) / 2;
        
        return (
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[centerX, 0.02, centerZ]} 
            receiveShadow
            onClick={handleBackgroundClick}
          >
            <planeGeometry args={[boundsWidth * 1.05, boundsDepth * 1.05]} />
            <meshStandardMaterial 
              color="#2a2c30"
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>
        );
      })()}

      {/* Warehouse Layout */}
      <WarehouseLayout layout={warehouseLayout} />

      {/* Entities */}
      <EntityRenderer entities={entities} />

      {/* Camera Controls */}
      <OrbitControls
        ref={controlsRef}
        target={[target.x, target.y, target.z]}
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={500}
        maxPolarAngle={cameraMode === 'orthographic' ? Math.PI / 2 - 0.1 : Math.PI / 2 + 0.3}
        enablePan
        panSpeed={1}
      />

      {/* Subtle grid on world floor for spatial reference */}
      <gridHelper 
        args={[
          500,
          100,
          '#2a2e34',  // More visible center lines
          '#1e2226'   // Subtle but present grid lines
        ]} 
        position={[0, -0.09, 0]}
      />
    </Canvas>
  );
}
