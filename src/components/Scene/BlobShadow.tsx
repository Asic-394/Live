import * as THREE from 'three';
import { useMemo } from 'react';
import { useStore } from '../../state/store';
import { getThemeConfig } from '../../utils/materials';

interface BlobShadowProps {
  width: number;
  depth: number;
  position?: [number, number, number];
  opacity?: number;
}

/**
 * Lightweight blob shadow - simple circular gradient plane
 * Much more performant than ContactShadows or real shadow mapping
 * Theme-aware with tokens for optimal grounding in both light and dark modes
 */
export default function BlobShadow({ 
  width, 
  depth, 
  position = [0, 0.01, 0],  // Raised slightly to avoid z-fighting with floor
  opacity 
}: BlobShadowProps) {
  const theme = useStore((state) => state.theme);
  const config = getThemeConfig(theme);
  
  // Theme token: use shadow opacity from theme config if not overridden
  const baseOpacity = opacity ?? config.shadows.blob.opacity;
  
  // Create radial gradient texture (cached per theme)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      
      // Theme token: shadow gradient adjusted for mode
      // Light mode: visible shadows for grounding and depth
      // Dark mode: deep black shadows for visible grounding
      if (theme === 'light') {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [theme]);
  
  // Theme token: calculate size with theme-aware multiplier for grounding emphasis
  const shadowSize = Math.max(width, depth) * config.shadows.blob.sizeMultiplier;
  
  return (
    <mesh 
      position={position} 
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={-1}  // Render shadows before other objects
    >
      <planeGeometry args={[shadowSize, shadowSize]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={baseOpacity}  // Theme token: shadow opacity for grounding
        depthWrite={false}
        depthTest={true}
        blending={THREE.MultiplyBlending}
        polygonOffset={true}  // Enable polygon offset to prevent z-fighting
        polygonOffsetFactor={-1}  // Push shadows slightly back
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}
