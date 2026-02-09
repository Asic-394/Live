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
  
  // Create soft gaussian shadow texture (cached per theme)
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const center = size / 2;
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;
      
      // Maximum opacity values for different themes
      const maxOpacity = theme === 'light' ? 0.20 : 0.28;
      
      // Create gaussian shadow with very wide spread for soft blur
      const sigma = size / 3.5; // Wide spread = softer blur
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - center;
          const dy = y - center;
          const distSq = dx * dx + dy * dy;
          
          // Gaussian distribution formula: e^(-(dist²) / (2σ²))
          const exponent = -distSq / (2 * sigma * sigma);
          const alpha = maxOpacity * Math.exp(exponent);
          
          const idx = (y * size + x) * 4;
          data[idx] = 0;     // R
          data[idx + 1] = 0; // G
          data[idx + 2] = 0; // B
          data[idx + 3] = Math.floor(alpha * 255); // A
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTexture.needsUpdate = true;
    
    return canvasTexture;
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
