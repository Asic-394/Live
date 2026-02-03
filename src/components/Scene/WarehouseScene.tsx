import { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useStore } from '../../state/store';
import { useSceneTheme } from '../../utils/useSceneTheme';
import WarehouseLayoutComponent from './WarehouseLayout';
import EntityRenderer from './EntityRenderer';
import { CoordinateMapper } from '../../utils/coordinates';

interface WarehouseSceneProps {
  controlsRef: React.RefObject<any>;
}

function SceneContent({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const warehouseLayout = useStore((state) => state.warehouseLayout);
  const entities = useStore((state) => state.entities);
  const selectedEntity = useStore((state) => state.selectedEntity);
  const selectedRack = useStore((state) => state.selectedRack);
  const cameraReset = useStore((state) => state.cameraReset);
  const cameraMode = useStore((state) => state.cameraMode);
  const theme = useSceneTheme();
  const { camera, gl } = useThree();
  const orbitControlsRef = useRef<any>(null);

  useEffect(() => {
    if (orbitControlsRef.current && warehouseLayout) {
      const controls = orbitControlsRef.current;
      controlsRef.current = controls;

      const bounds = warehouseLayout.bounds;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerZ = -(bounds.minY + bounds.maxY) / 2;
      const size = Math.max(
        bounds.maxX - bounds.minX,
        bounds.maxZ - bounds.minZ,
        bounds.maxY - bounds.minY
      );

      controls.target.set(centerX, 0, centerZ);

      const distance = size * 1.5;
      if (cameraMode === 'orthographic') {
        camera.position.set(centerX + distance * 0.7, distance * 1.2, centerZ + distance * 0.7);
        if ('zoom' in camera) {
          camera.zoom = 2.0;
          camera.updateProjectionMatrix();
        }
      } else {
        camera.position.set(centerX + distance * 0.7, distance * 0.8, centerZ + distance * 0.7);
      }

      controls.update();
    }
  }, [warehouseLayout, cameraMode, cameraReset, camera, controlsRef]);

  useEffect(() => {
    gl.setClearColor(theme.renderer.background);
    gl.toneMapping = theme.renderer.toneMapping as THREE.ToneMapping;
    gl.toneMappingExposure = theme.renderer.toneMappingExposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, theme.renderer]);

  useEffect(() => {
    if (!orbitControlsRef.current || !warehouseLayout) return;

    const controls = orbitControlsRef.current;
    const cameraObj = controls.object as THREE.Camera;

    let target: { x: number; y: number; z: number } | null = null;
    let position: { x: number; y: number; z: number } | null = null;
    let zoom: number | undefined;

    if (selectedRack) {
      const rack = warehouseLayout.racks.find((r) => r.element_id === selectedRack);
      if (!rack) return;
      const focus = CoordinateMapper.calculateRackFocusPosition(
        rack.x,
        rack.y,
        rack.z || 0,
        rack.width,
        rack.depth,
        rack.height || 18
      );
      target = focus.target;
      position = focus.position;
      zoom = 3.0;
    } else if (selectedEntity) {
      const entity = entities.find((e) => e.entity_id === selectedEntity);
      if (!entity) return;
      const entityPos = CoordinateMapper.csvToThree(entity.x, entity.y, entity.z || 0);
      const distance = 25;
      target = {
        x: entityPos.x,
        y: Math.max(1, entityPos.y),
        z: entityPos.z,
      };
      position = {
        x: entityPos.x + distance * 0.6,
        y: entityPos.y + distance * 0.5 + 5,
        z: entityPos.z + distance * 0.6,
      };
      zoom = 3.5;
    }

    if (!target || !position) return;

    gsap.to(cameraObj.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    });

    gsap.to(controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    });

    if (zoom !== undefined && cameraMode === 'orthographic' && 'zoom' in cameraObj) {
      gsap.to(cameraObj, {
        zoom,
        duration: 0.9,
        ease: 'power2.inOut',
        onUpdate: () => {
          cameraObj.updateProjectionMatrix();
          controls.update();
        },
      });
    }
  }, [selectedEntity, selectedRack, entities, warehouseLayout, cameraMode]);

  if (!warehouseLayout) {
    return null;
  }

  const bounds = warehouseLayout.bounds;
  const floorWidth = (bounds.maxX - bounds.minX) * 1.2;
  const floorDepth = (bounds.maxY - bounds.minY) * 1.2;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = -(bounds.minY + bounds.maxY) / 2;
  const gridOpacity = Math.min(0.18, Math.max(0.08, theme.shadows.contact.opacity * 0.35));

  return (
    <>
      {cameraMode === 'orthographic' ? (
        <OrthographicCamera
          makeDefault
          zoom={2.0}
          near={0.1}
          far={10000}
          position={[100, 150, 100]}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          fov={50}
          near={0.1}
          far={10000}
          position={[100, 120, 100]}
        />
      )}

      <OrbitControls
        ref={orbitControlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={1000}
        maxPolarAngle={Math.PI / 2 - 0.1}
        screenSpacePanning={false}
      />

      <ambientLight
        intensity={theme.lighting.ambient.intensity}
        color={theme.lighting.ambient.color}
      />

      <directionalLight
        position={theme.lighting.keyLight.position}
        intensity={theme.lighting.keyLight.intensity}
        color={theme.lighting.keyLight.color}
        castShadow={theme.lighting.keyLight.castShadow && theme.shadows.enabled}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0001}
      />

      <directionalLight
        position={theme.lighting.fillLight.position}
        intensity={theme.lighting.fillLight.intensity}
        color={theme.lighting.fillLight.color}
      />

      <directionalLight
        position={theme.lighting.rimLight.position}
        intensity={theme.lighting.rimLight.intensity}
        color={theme.lighting.rimLight.color}
      />

      <hemisphereLight
        intensity={theme.lighting.hemisphere.intensity}
        color={theme.lighting.hemisphere.skyColor}
        groundColor={theme.lighting.hemisphere.groundColor}
      />

      <mesh
        position={[centerX, -0.25, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[floorWidth * 2, floorDepth * 2]} />
        <meshStandardMaterial
          color={theme.colors.background}
          roughness={1.0}
          metalness={0}
        />
      </mesh>

      <mesh
        position={[centerX, 0.0, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[floorWidth, floorDepth]} />
        <meshStandardMaterial
          color={theme.colors.floorBase}
          roughness={theme.materials.floor.roughness}
          metalness={theme.materials.floor.metalness}
        />
      </mesh>

      <mesh
        position={[centerX, 0.003, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[floorWidth, floorDepth]} />
        <meshStandardMaterial
          color={theme.colors.floorGrid}
          transparent
          opacity={gridOpacity}
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {theme.shadows.enabled && (
        <ContactShadows
          position={[centerX, 0.006, centerZ]}
          opacity={theme.shadows.contact.opacity}
          scale={Math.max(floorWidth, floorDepth)}
          blur={theme.shadows.contact.blur}
          far={50}
          resolution={512}
          color="#000000"
        />
      )}

      {theme.fog.enabled && (
        <fog
          attach="fog"
          args={[theme.fog.color, theme.fog.near, theme.fog.far]}
        />
      )}

      <WarehouseLayoutComponent layout={warehouseLayout} />
      <EntityRenderer entities={entities} />
    </>
  );
}

export default function WarehouseScene({ controlsRef }: WarehouseSceneProps) {
  const theme = useSceneTheme();

  return (
    <Canvas
      shadows
      className="w-full h-full"
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[theme.renderer.background]} />
      <SceneContent controlsRef={controlsRef} />
    </Canvas>
  );
}