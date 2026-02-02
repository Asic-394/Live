import * as THREE from 'three';
import { useMemo } from 'react';

interface BlobShadowProps {
  width: number;
  depth: number;
  position?: [number, number, number];
  opacity?: number;
}

/**
 * Lightweight blob shadow - simple circular gradient plane
 * Much more performant than ContactShadows or real shadow mapping
 */
export default function BlobShadow({ 
  width, 
  depth, 
  position = [0, 0.005, 0],
  opacity = 0.35 
}: BlobShadowProps) {
  // Create radial gradient texture (cached)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);
  
  // Calculate size based on object dimensions
  const shadowSize = Math.max(width, depth) * 1.15;
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[shadowSize, shadowSize]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.MultiplyBlending}
      />
    </mesh>
  );
}
