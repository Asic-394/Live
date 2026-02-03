import * as THREE from 'three';
import { useMemo } from 'react';
import { useSceneTheme } from '../../utils/useSceneTheme';

interface ContactShadowProps {
  width: number;
  depth: number;
  position?: [number, number, number];
  opacity?: number;
}

/**
 * Simple contact shadow for better object grounding
 * Creates a soft radial gradient shadow beneath objects
 */
export default function ContactShadow({ 
  width, 
  depth, 
  position = [0, 0.01, 0],
  opacity
}: ContactShadowProps) {
  const themeConfig = useSceneTheme();
  const finalOpacity = opacity ?? themeConfig.shadows.contact.opacity;
  
  // Create radial gradient texture (cached per theme)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      
      // Theme-aware contact shadow gradient
      if (finalOpacity <= 0.3) {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [finalOpacity]);
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width * 1.2, depth * 1.2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={finalOpacity}
        depthWrite={false}
        blending={THREE.MultiplyBlending}
      />
    </mesh>
  );
}
